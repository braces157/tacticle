package com.tactilegallery.backend.service;

import com.tactilegallery.backend.config.CacheNames;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.CategoryEntity;
import com.tactilegallery.backend.persistence.entity.OrderEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.entity.ProductHighlightEntity;
import com.tactilegallery.backend.persistence.entity.ProductImageEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionValueEntity;
import com.tactilegallery.backend.persistence.entity.ProductReviewEntity;
import com.tactilegallery.backend.persistence.entity.ProductSpecEntity;
import com.tactilegallery.backend.persistence.entity.ProductTagEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.CategoryRepository;
import com.tactilegallery.backend.persistence.repository.OrderRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import com.tactilegallery.backend.persistence.repository.ProductReviewRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

    private static final String IMAGE_FALLBACK =
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAb1gL_k2Ql93MFpyGKczf39692KVEo9vA2lBMttaG0P0rE9qXNspqn8Cqqs3OV1pQPtQR1F--GMV0zEI4rNWmprFZxZ6PFvM1wgeKcsmHGVQaOSaj2_gudXiTKn4zLby-AvIgMv-oNHO4H2spdeITE3vnyXUvuGryNZ5YG_uqWoR65guhikLAogx-mg9diKMXp1arHfCUUPn5RnRMNf5wdKuIGTQ_8sFrchkNRQ7PpoLo3BKcKV3qbwWjzWlDXnYewieA35Mrm4mc";
    private static final Map<DomainModels.OrderStatus, List<DomainModels.OrderStatus>> ORDER_TRANSITIONS = Map.of(
        DomainModels.OrderStatus.PAYMENT_REVIEW,
        List.of(DomainModels.OrderStatus.PROCESSING, DomainModels.OrderStatus.CANCELED),
        DomainModels.OrderStatus.PROCESSING,
        List.of(DomainModels.OrderStatus.READY_TO_SHIP, DomainModels.OrderStatus.SHIPPED, DomainModels.OrderStatus.CANCELED),
        DomainModels.OrderStatus.READY_TO_SHIP,
        List.of(DomainModels.OrderStatus.SHIPPED, DomainModels.OrderStatus.CANCELED),
        DomainModels.OrderStatus.SHIPPED,
        List.of(DomainModels.OrderStatus.DELIVERED),
        DomainModels.OrderStatus.DELIVERED,
        List.of(),
        DomainModels.OrderStatus.CANCELED,
        List.of()
    );

    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final AppUserRepository appUserRepository;
    private final SqlDomainMapper mapper;

    public AdminService(
        ProductRepository productRepository,
        ProductReviewRepository productReviewRepository,
        CategoryRepository categoryRepository,
        OrderRepository orderRepository,
        AppUserRepository appUserRepository,
        SqlDomainMapper mapper
    ) {
        this.productRepository = productRepository;
        this.productReviewRepository = productReviewRepository;
        this.categoryRepository = categoryRepository;
        this.orderRepository = orderRepository;
        this.appUserRepository = appUserRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<DomainModels.AdminDashboardMetric> getMetrics() {
        List<OrderEntity> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        List<ProductEntity> inventory = productRepository.findAllByOrderByIdAsc().stream()
            .filter(product -> !product.isArchived())
            .toList();
        double revenue = orders.stream().mapToDouble(order -> mapper.moneyToDouble(order.getTotalAmount())).sum();
        double average = orders.isEmpty() ? 0 : revenue / orders.size();
        int stock = inventory.stream().mapToInt(ProductEntity::getStock).sum();

        return List.of(
            new DomainModels.AdminDashboardMetric("Total Revenue", formatMoney(revenue), "+12.4%", "positive"),
            new DomainModels.AdminDashboardMetric("Orders", String.valueOf(orders.size()), "+5.2%", "positive"),
            new DomainModels.AdminDashboardMetric("Avg. Order Value", formatMoney(average), "Stable", "neutral"),
            new DomainModels.AdminDashboardMetric("Active Inventory", String.valueOf(stock), "-2.1%", "warning")
        );
    }

    @Transactional(readOnly = true)
    public List<DomainModels.SalesPoint> getSalesSeries() {
        Map<YearMonth, Double> totals = new LinkedHashMap<>();
        YearMonth current = YearMonth.from(LocalDate.now());
        for (int index = 5; index >= 0; index--) {
            YearMonth month = current.minusMonths(index);
            totals.put(month, 0.0);
        }

        for (OrderEntity order : orderRepository.findAllByOrderByCreatedAtDesc()) {
            YearMonth month = YearMonth.from(order.getCreatedAt());
            if (totals.containsKey(month)) {
                totals.put(month, totals.get(month) + mapper.moneyToDouble(order.getTotalAmount()));
            }
        }

        return totals.entrySet().stream()
            .map(entry -> new DomainModels.SalesPoint(
                entry.getKey().getMonth().getDisplayName(TextStyle.SHORT, Locale.US).toUpperCase(Locale.US),
                (int) Math.round(entry.getValue())
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DomainModels.LowStockAlert> getLowStockAlerts() {
        return getInventory(null, null, null).stream()
            .filter(item -> !"In Stock".equals(item.status()))
            .map(item -> new DomainModels.LowStockAlert(
                item.name(),
                item.stock(),
                Math.max(8, Math.min(100, item.stock() * 8)),
                item.status()
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DomainModels.AdminInventoryItem> getInventory(String query, String category, String stockStatus) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase();
        String normalizedCategory = category == null || category.isBlank() ? "All Categories" : category;
        String normalizedStatus = stockStatus == null || stockStatus.isBlank() ? "All Status" : stockStatus;

        return productRepository.findAllByOrderByIdAsc().stream()
            .filter(product -> !product.isArchived())
            .map(mapper::toAdminInventoryItem)
            .filter(item -> normalizedQuery.isBlank() || searchable(item).contains(normalizedQuery))
            .filter(item -> "All Categories".equals(normalizedCategory) || item.category().equals(normalizedCategory))
            .filter(item -> "All Status".equals(normalizedStatus) || item.status().equals(normalizedStatus))
            .toList();
    }

    @Transactional(readOnly = true)
    public DomainModels.AdminProductRecord getProduct(String slug) {
        return productRepository.findBySlug(slug)
            .map(mapper::toAdminProductRecord)
            .orElse(null);
    }

    public DomainModels.AdminDraftProduct getInitialDraftProduct() {
        return new DomainModels.AdminDraftProduct(
            "",
            "Keyboards",
            "",
            "",
            "",
            "",
            "",
            "Active",
            List.of(new DomainModels.AdminDraftProductImage("image-1", "", "")),
            List.of()
        );
    }

    @Transactional(readOnly = true)
    public DomainModels.AdminDraftProduct getDraftProductFromExisting(String slug) {
        ProductEntity product = productRepository.findBySlug(slug).orElse(null);
        if (product == null) {
            return null;
        }

        return new DomainModels.AdminDraftProduct(
            product.getName(),
            mapper.toCategoryLabel(product.getCategory().getSlug()),
            product.getSku(),
            String.format(Locale.US, "%.2f", product.getPrice()),
            String.valueOf(product.getStock()),
            product.getDescription(),
            serializeSpecs(product),
            product.getVisibility(),
            serializeImages(product),
            serializeOptions(product)
        );
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheNames.FEATURED_PRODUCTS, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCTS_BY_CATEGORY, allEntries = true),
        @CacheEvict(value = CacheNames.RELATED_PRODUCTS, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCT_SEARCH, allEntries = true)
    })
    public DomainModels.AdminProductRecord createProduct(DomainModels.AdminDraftProduct draft) {
        CategoryEntity category = resolveCategory(draft.category());
        String slug = uniqueSlug(slugify(draft.name()));
        validateSku(null, draft.sku());
        LocalDateTime now = LocalDateTime.now();

        ProductEntity product = new ProductEntity();
        product.setSlug(slug);
        product.setCategory(category);
        product.setName(draft.name().trim());
        product.setSubtitle(draft.description().isBlank() ? "New gallery item awaiting refinement." : clip(draft.description(), 90));
        product.setDescription(defaultDescription(draft));
        product.setStory(defaultDescription(draft));
        product.setMaterial("Editorial finish");
        product.setPrice(parsePrice(draft.price()));
        product.setSku(draft.sku().trim());
        product.setStock(parseInteger(draft.stock()));
        product.setVisibility(draft.status());
        product.setArchived(false);
        product.setFeatured(false);
        product.setCreatedAt(now);
        product.setUpdatedAt(now);

        List<DomainModels.ImageAsset> draftImages = mapDraftImages(draft.images(), draft.name().trim());
        DomainModels.ImageAsset primaryImage = draftImages.isEmpty()
            ? new DomainModels.ImageAsset(IMAGE_FALLBACK, draft.name().trim() + " main preview")
            : draftImages.get(0);
        product.setImageSrc(primaryImage.src());
        product.setImageAlt(primaryImage.alt());

        setTags(product, List.of("New"));
        setImages(product, draftImages);
        setSpecs(product, parseMetadata(draft.metadata(), product));
        setHighlights(product, List.of("Admin-created draft", "Ready for backend sync"));
        setOptions(product, mapDraftOptions(draft.options()));

        return mapper.toAdminProductRecord(productRepository.save(product));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheNames.FEATURED_PRODUCTS, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCTS_BY_CATEGORY, allEntries = true),
        @CacheEvict(value = CacheNames.RELATED_PRODUCTS, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCT_SEARCH, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCT_DETAILS, key = "#slug")
    })
    public DomainModels.AdminProductRecord updateProduct(String slug, DomainModels.AdminDraftProduct draft) {
        ProductEntity product = productRepository.findBySlug(slug).orElse(null);
        if (product == null) {
            return null;
        }

        validateSku(product, draft.sku());
        product.setCategory(resolveCategory(draft.category()));
        product.setName(draft.name().trim());
        product.setSubtitle(draft.description().isBlank() ? product.getSubtitle() : clip(draft.description(), 90));
        product.setDescription(defaultDescription(draft));
        product.setStory(defaultDescription(draft));
        product.setSku(draft.sku().trim());
        product.setPrice(parsePrice(draft.price()));
        product.setStock(parseInteger(draft.stock()));
        product.setVisibility(draft.status());
        product.setUpdatedAt(LocalDateTime.now());

        List<DomainModels.ImageAsset> draftImages = mapDraftImages(draft.images(), draft.name().trim());
        if (!draftImages.isEmpty()) {
            product.setImageSrc(draftImages.get(0).src());
            product.setImageAlt(draftImages.get(0).alt());
        }

        setImages(product, draftImages);
        setSpecs(product, parseMetadata(draft.metadata(), product));
        setOptions(product, mapDraftOptions(draft.options()));

        if (product.getHighlights().isEmpty()) {
            setHighlights(product, List.of("Admin-updated product", "Ready for merchandising"));
        }
        if (product.getImages().isEmpty()) {
            setImages(product, List.of(new DomainModels.ImageAsset(product.getImageSrc(), product.getImageAlt())));
        }
        if (product.getTags().isEmpty()) {
            setTags(product, List.of("Updated"));
        }

        return mapper.toAdminProductRecord(product);
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = CacheNames.FEATURED_PRODUCTS, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCTS_BY_CATEGORY, allEntries = true),
        @CacheEvict(value = CacheNames.RELATED_PRODUCTS, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCT_SEARCH, allEntries = true),
        @CacheEvict(value = CacheNames.PRODUCT_DETAILS, key = "#slug"),
        @CacheEvict(value = CacheNames.APPROVED_REVIEWS, key = "#slug")
    })
    public void archiveProduct(String slug) {
        productRepository.findBySlug(slug).ifPresent(product -> product.setArchived(true));
    }

    @Transactional(readOnly = true)
    public List<DomainModels.AdminOrderRecord> getOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(mapper::toAdminOrderRecord)
            .toList();
    }

    @Transactional(readOnly = true)
    public DomainModels.AdminOrderDetail getOrderDetail(String orderId) {
        return orderRepository.findByOrderNumber(orderId)
            .map(this::toAdminOrderDetail)
            .orElse(null);
    }

    @Transactional
    public DomainModels.AdminOrderDetail updateOrderStatus(String orderId, String requestedStatus) {
        OrderEntity order = orderRepository.findByOrderNumber(orderId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
        DomainModels.OrderStatus currentStatus = parseOrderStatus(order.getStatus());
        DomainModels.OrderStatus nextStatus = parseOrderStatus(requestedStatus);

        if (currentStatus == nextStatus) {
            return toAdminOrderDetail(order);
        }

        List<DomainModels.OrderStatus> allowedNextStatuses = ORDER_TRANSITIONS.getOrDefault(currentStatus, List.of());
        if (!allowedNextStatuses.contains(nextStatus)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Orders in " + currentStatus.getLabel() + " cannot move to " + nextStatus.getLabel() + "."
            );
        }

        order.setStatus(nextStatus.getLabel());
        order.setFulfillment(fulfillmentFor(nextStatus));
        if (nextStatus == DomainModels.OrderStatus.CANCELED) {
            order.setPaymentStatus("Voided");
            restockOrderItems(order);
        }

        appendTimelineEntry(order, timelineTextFor(nextStatus));
        return toAdminOrderDetail(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<DomainModels.AdminCustomerRecord> getCustomers() {
        Map<String, List<OrderEntity>> ordersByCustomer = orderRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(order -> order.getUser() != null)
            .collect(java.util.stream.Collectors.groupingBy(order -> order.getUser().getExternalId()));

        return appUserRepository.findAllByRoleIgnoreCaseOrderByCreatedAtDesc("customer").stream()
            .map(user -> toAdminCustomerRecord(user, ordersByCustomer.getOrDefault(user.getExternalId(), List.of())))
            .sorted(Comparator
                .comparing(DomainModels.AdminCustomerRecord::lastOrderAt, Comparator.nullsLast(String::compareTo))
                .reversed()
                .thenComparing(DomainModels.AdminCustomerRecord::name))
            .toList();
    }

    @Transactional
    public DomainModels.AdminCustomerRecord updateCustomerStatus(String customerId, String requestedStatus) {
        var user = appUserRepository.findByExternalId(customerId)
            .filter(appUser -> "customer".equalsIgnoreCase(appUser.getRole()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found."));

        boolean enabled = parseCustomerStatus(requestedStatus);
        user.setEnabled(enabled);

        List<OrderEntity> customerOrders = orderRepository.findByUser_ExternalIdOrderByCreatedAtDesc(user.getExternalId());
        return toAdminCustomerRecord(user, customerOrders);
    }

    @Transactional(readOnly = true)
    public List<DomainModels.ProductReview> getProductReviews(String slug, String status) {
        productRepository.findBySlug(slug)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));

        if (status == null || status.isBlank()) {
            return productReviewRepository.findByProduct_SlugOrderByCreatedAtDesc(slug).stream()
                .map(mapper::toProductReview)
                .toList();
        }

        return productReviewRepository.findByProduct_SlugAndStatusOrderByCreatedAtDesc(slug, status).stream()
            .map(mapper::toProductReview)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<DomainModels.ProductReview> getReviews(String status) {
        if (status == null || status.isBlank()) {
            return productReviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(mapper::toProductReview)
                .toList();
        }

        return productReviewRepository.findByStatusOrderByCreatedAtDesc(status).stream()
            .map(mapper::toProductReview)
            .toList();
    }

    @Transactional
    @CacheEvict(value = CacheNames.APPROVED_REVIEWS, key = "#result.productSlug()", condition = "#result != null")
    public DomainModels.ProductReview moderateReview(Long reviewId, String nextStatus, String note) {
        ProductReviewEntity review = productReviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found."));
        LocalDateTime now = LocalDateTime.now();
        review.setStatus(nextStatus);
        review.setAdminNote(trimToEmpty(note));
        review.setReviewedAt(now);
        review.setUpdatedAt(now);
        return mapper.toProductReview(review);
    }

    public String describeShippingAddress(DomainModels.ShippingAddress address) {
        return String.join(", ", address.line1(), address.city(), address.postalCode(), address.country());
    }

    private DomainModels.AdminOrderDetail toAdminOrderDetail(OrderEntity entity) {
        DomainModels.AdminOrderDetail detail = mapper.toAdminOrderDetail(entity);
        return new DomainModels.AdminOrderDetail(
            detail.id(),
            detail.userId(),
            detail.customerName(),
            detail.customerEmail(),
            detail.createdAt(),
            detail.status(),
            detail.subtotal(),
            detail.discount(),
            detail.total(),
            detail.itemCount(),
            detail.promoCode(),
            detail.fulfillment(),
            detail.shippingAddress(),
            detail.paymentStatus(),
            detail.timeline(),
            detail.items(),
            ORDER_TRANSITIONS.getOrDefault(parseOrderStatus(detail.status()), List.of()).stream()
                .map(DomainModels.OrderStatus::getLabel)
                .toList()
        );
    }

    private DomainModels.AdminCustomerRecord toAdminCustomerRecord(
        com.tactilegallery.backend.persistence.entity.AppUserEntity user,
        List<OrderEntity> customerOrders
    ) {
        double totalSpend = customerOrders.stream()
            .mapToDouble(order -> mapper.moneyToDouble(order.getTotalAmount()))
            .sum();
        String lastOrderAt = customerOrders.stream()
            .map(OrderEntity::getCreatedAt)
            .max(LocalDateTime::compareTo)
            .map(mapper::formatDateTime)
            .orElse("");

        return new DomainModels.AdminCustomerRecord(
            user.getExternalId(),
            user.getExternalId(),
            user.getName(),
            user.getEmail(),
            customerOrders.size(),
            totalSpend,
            lastOrderAt,
            user.isEnabled() ? "Active" : "Inactive"
        );
    }

    private String searchable(DomainModels.AdminInventoryItem item) {
        return String.join(" ", item.name(), item.subtitle(), item.category(), item.sku()).toLowerCase();
    }

    private DomainModels.OrderStatus parseOrderStatus(String value) {
        return Optional.ofNullable(value)
            .map(String::trim)
            .filter(text -> !text.isBlank())
            .flatMap(text -> ORDER_TRANSITIONS.keySet().stream()
                .filter(status -> status.getLabel().equalsIgnoreCase(text))
                .findFirst())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown order status: " + value));
    }

    private boolean parseCustomerStatus(String value) {
        String normalized = value == null ? "" : value.trim();
        if ("Active".equalsIgnoreCase(normalized)) {
            return true;
        }
        if ("Inactive".equalsIgnoreCase(normalized)) {
            return false;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown customer status: " + value);
    }

    private void appendTimelineEntry(OrderEntity order, String text) {
        boolean alreadyLastEntry = !order.getTimelineEntries().isEmpty()
            && text.equals(order.getTimelineEntries().get(order.getTimelineEntries().size() - 1).getTimelineText());
        if (alreadyLastEntry) {
            return;
        }

        int nextSortOrder = order.getTimelineEntries().stream()
            .mapToInt(entry -> entry.getSortOrder())
            .max()
            .orElse(0) + 1;

        com.tactilegallery.backend.persistence.entity.OrderTimelineEntryEntity entry =
            new com.tactilegallery.backend.persistence.entity.OrderTimelineEntryEntity();
        entry.setOrder(order);
        entry.setTimelineText(text);
        entry.setSortOrder(nextSortOrder);
        entry.setCreatedAt(LocalDateTime.now());
        order.getTimelineEntries().add(entry);
    }

    private String fulfillmentFor(DomainModels.OrderStatus status) {
        return switch (status) {
            case PAYMENT_REVIEW -> "Awaiting payment review";
            case PROCESSING -> "Assembly queued";
            case READY_TO_SHIP -> "Packed and labeled";
            case SHIPPED -> "In transit";
            case DELIVERED -> "Complete";
            case CANCELED -> "Canceled";
        };
    }

    private String timelineTextFor(DomainModels.OrderStatus status) {
        return switch (status) {
            case PAYMENT_REVIEW -> "Payment under review";
            case PROCESSING -> "Assembly queued";
            case READY_TO_SHIP -> "Ready to ship";
            case SHIPPED -> "Shipment in transit";
            case DELIVERED -> "Delivered";
            case CANCELED -> "Order canceled";
        };
    }

    private void restockOrderItems(OrderEntity order) {
        order.getItems().forEach(item -> {
            ProductEntity product = item.getProduct();
            if (product != null) {
                product.setStock(product.getStock() + item.getQuantity());
            }
        });
    }

    private CategoryEntity resolveCategory(String label) {
        String slug = mapper.toCategorySlug(label);
        return categoryRepository.findBySlug(slug)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category: " + label));
    }

    private void validateSku(ProductEntity existing, String sku) {
        String normalized = sku == null ? "" : sku.trim();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SKU is required.");
        }

        boolean usedByAnother = productRepository.existsBySkuIgnoreCase(normalized)
            && (existing == null || !normalized.equalsIgnoreCase(existing.getSku()));
        if (usedByAnother) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A product with this SKU already exists.");
        }
    }

    private String uniqueSlug(String baseSlug) {
        String candidate = baseSlug.isBlank() ? "new-product" : baseSlug;
        String slug = candidate;
        int counter = 2;
        while (productRepository.existsBySlug(slug)) {
            slug = candidate + "-" + counter++;
        }
        return slug;
    }

    private String slugify(String value) {
        return value == null
            ? ""
            : value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }

    private String clip(String value, int length) {
        return value.length() <= length ? value : value.substring(0, length);
    }

    private BigDecimal parsePrice(String value) {
        return parseBigDecimal(value, "product price");
    }

    private String formatMoney(double value) {
        return String.format(Locale.US, "$%.2f", value);
    }

    private int parseInteger(String value) {
        return parseInteger(value, "product stock");
    }

    private String defaultDescription(DomainModels.AdminDraftProduct draft) {
        return draft.description().isBlank() ? "New gallery item awaiting refinement." : draft.description().trim();
    }

    private String serializeSpecs(ProductEntity product) {
        return product.getSpecs().stream()
            .sorted(Comparator.comparing(ProductSpecEntity::getSortOrder))
            .map(spec -> spec.getSpecLabel() + ": " + spec.getSpecValue())
            .reduce((left, right) -> left + System.lineSeparator() + right)
            .orElse("");
    }

    private List<DomainModels.AdminDraftProductImage> serializeImages(ProductEntity product) {
        List<DomainModels.ImageAsset> source = product.getImages().isEmpty()
            ? List.of(new DomainModels.ImageAsset(product.getImageSrc(), product.getImageAlt()))
            : product.getImages().stream()
                .sorted(Comparator.comparing(ProductImageEntity::getSortOrder))
                .map(image -> new DomainModels.ImageAsset(image.getImageSrc(), image.getImageAlt()))
                .toList();

        List<DomainModels.AdminDraftProductImage> images = new ArrayList<>();
        for (int index = 0; index < source.size(); index++) {
            DomainModels.ImageAsset image = source.get(index);
            images.add(new DomainModels.AdminDraftProductImage(
                "image-" + (index + 1),
                image.src(),
                image.alt()
            ));
        }
        return images;
    }

    private List<DomainModels.AdminDraftProductOption> serializeOptions(ProductEntity product) {
        return product.getOptions().stream()
            .sorted(Comparator.comparing(ProductOptionEntity::getSortOrder))
            .map(option -> new DomainModels.AdminDraftProductOption(
                option.getOptionKey(),
                option.getOptionGroupName(),
                option.getValues().stream()
                    .sorted(Comparator.comparing(ProductOptionValueEntity::getSortOrder))
                    .map(value -> new DomainModels.AdminDraftProductOptionValue(
                        value.getOptionValueKey(),
                        value.getLabel(),
                        value.getPriceDelta() == null || value.getPriceDelta().compareTo(BigDecimal.ZERO) == 0
                            ? ""
                            : value.getPriceDelta().stripTrailingZeros().toPlainString()
                    ))
                    .toList()
            ))
            .toList();
    }

    private List<DomainModels.SpecItem> parseMetadata(String metadata, ProductEntity product) {
        List<DomainModels.SpecItem> specs = new ArrayList<>();
        String normalized = metadata == null ? "" : metadata.replace("\r", "\n");

        for (String rawLine : normalized.lines().toList()) {
            String line = rawLine.trim();
            if (line.isBlank()) {
                continue;
            }

            int separatorIndex = line.indexOf(':');
            if (separatorIndex < 1 || separatorIndex == line.length() - 1) {
                specs.add(new DomainModels.SpecItem(line, "Yes"));
                continue;
            }

            String label = line.substring(0, separatorIndex).trim();
            String value = line.substring(separatorIndex + 1).trim();
            if (!label.isBlank() && !value.isBlank()) {
                specs.add(new DomainModels.SpecItem(label, value));
            }
        }

        if (specs.isEmpty()) {
            return List.of(new DomainModels.SpecItem("Material", product.getMaterial()));
        }

        return specs;
    }

    private List<DomainModels.ProductOption> mapDraftOptions(List<DomainModels.AdminDraftProductOption> options) {
        if (options == null || options.isEmpty()) {
            return List.of();
        }

        List<DomainModels.ProductOption> normalized = new ArrayList<>();
        for (int optionIndex = 0; optionIndex < options.size(); optionIndex++) {
            DomainModels.AdminDraftProductOption option = options.get(optionIndex);
            String group = trimToEmpty(option.group());
            if (group.isBlank()) {
                continue;
            }

            List<DomainModels.ProductOptionValue> values = new ArrayList<>();
            List<DomainModels.AdminDraftProductOptionValue> sourceValues = option.values() == null
                ? List.of()
                : option.values();
            for (int valueIndex = 0; valueIndex < sourceValues.size(); valueIndex++) {
                DomainModels.AdminDraftProductOptionValue value = sourceValues.get(valueIndex);
                String label = trimToEmpty(value.label());
                if (label.isBlank()) {
                    continue;
                }

                values.add(new DomainModels.ProductOptionValue(
                    normalizedKey(value.id(), label, valueIndex + 1),
                    label,
                    parsePriceDelta(value.priceDelta())
                ));
            }

            if (values.isEmpty()) {
                continue;
            }

            normalized.add(new DomainModels.ProductOption(
                normalizedKey(option.id(), group, optionIndex + 1),
                group,
                values
            ));
        }

        return normalized;
    }

    private List<DomainModels.ImageAsset> mapDraftImages(
        List<DomainModels.AdminDraftProductImage> images,
        String productName
    ) {
        if (images == null || images.isEmpty()) {
            return List.of(new DomainModels.ImageAsset(IMAGE_FALLBACK, productName + " preview image"));
        }

        List<DomainModels.ImageAsset> normalized = new ArrayList<>();
        int index = 1;
        for (DomainModels.AdminDraftProductImage image : images) {
            String src = trimToEmpty(image.src());
            if (src.isBlank()) {
                continue;
            }

            String alt = trimToEmpty(image.alt());
            normalized.add(new DomainModels.ImageAsset(
                src,
                alt.isBlank() ? productName + " image " + index : alt
            ));
            index++;
        }

        if (normalized.isEmpty()) {
            return List.of(new DomainModels.ImageAsset(IMAGE_FALLBACK, productName + " preview image"));
        }

        return normalized;
    }

    private void setTags(ProductEntity product, List<String> tags) {
        product.getTags().clear();
        for (String value : tags) {
            ProductTagEntity tag = new ProductTagEntity();
            tag.setProduct(product);
            tag.setTag(value);
            product.getTags().add(tag);
        }
    }

    private void setImages(ProductEntity product, List<DomainModels.ImageAsset> images) {
        product.getImages().clear();
        List<DomainModels.ImageAsset> source = images.isEmpty()
            ? List.of(new DomainModels.ImageAsset(product.getImageSrc(), product.getImageAlt()))
            : images;
        for (int index = 0; index < source.size(); index++) {
            DomainModels.ImageAsset image = source.get(index);
            ProductImageEntity entity = new ProductImageEntity();
            entity.setProduct(product);
            entity.setImageSrc(image.src());
            entity.setImageAlt(image.alt());
            entity.setSortOrder(index + 1);
            product.getImages().add(entity);
        }
    }

    private void setSpecs(ProductEntity product, List<DomainModels.SpecItem> specs) {
        product.getSpecs().clear();
        List<DomainModels.SpecItem> source = specs.isEmpty()
            ? List.of(new DomainModels.SpecItem("Material", product.getMaterial()))
            : specs;
        for (int index = 0; index < source.size(); index++) {
            DomainModels.SpecItem spec = source.get(index);
            ProductSpecEntity entity = new ProductSpecEntity();
            entity.setProduct(product);
            entity.setSpecLabel(spec.label());
            entity.setSpecValue(spec.value());
            entity.setSortOrder(index + 1);
            product.getSpecs().add(entity);
        }
    }

    private void setHighlights(ProductEntity product, List<String> highlights) {
        product.getHighlights().clear();
        List<String> source = highlights.isEmpty() ? List.of("Curated storefront item") : highlights;
        for (int index = 0; index < source.size(); index++) {
            ProductHighlightEntity entity = new ProductHighlightEntity();
            entity.setProduct(product);
            entity.setHighlightText(source.get(index));
            entity.setSortOrder(index + 1);
            product.getHighlights().add(entity);
        }
    }

    private void setOptions(ProductEntity product, List<DomainModels.ProductOption> options) {
        product.getOptions().clear();
        for (int optionIndex = 0; optionIndex < options.size(); optionIndex++) {
            DomainModels.ProductOption option = options.get(optionIndex);
            ProductOptionEntity optionEntity = new ProductOptionEntity();
            optionEntity.setProduct(product);
            optionEntity.setOptionKey(option.id());
            optionEntity.setOptionGroupName(option.group());
            optionEntity.setSortOrder(optionIndex + 1);
            optionEntity.setValues(new ArrayList<>());

            for (int valueIndex = 0; valueIndex < option.values().size(); valueIndex++) {
                DomainModels.ProductOptionValue value = option.values().get(valueIndex);
                ProductOptionValueEntity valueEntity = new ProductOptionValueEntity();
                valueEntity.setProductOption(optionEntity);
                valueEntity.setOptionValueKey(value.id());
                valueEntity.setLabel(value.label());
                valueEntity.setPriceDelta(BigDecimal.valueOf(value.priceDelta()));
                valueEntity.setSortOrder(valueIndex + 1);
                optionEntity.getValues().add(valueEntity);
            }

            product.getOptions().add(optionEntity);
        }
    }

    private double parsePriceDelta(String value) {
        String normalized = trimToEmpty(value);
        if (normalized.isBlank()) {
            return 0;
        }

        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid price delta: " + value
            );
        }
    }

    private BigDecimal parseBigDecimal(String value, String fieldName) {
        String normalized = trimToEmpty(value);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, capitalize(fieldName) + " is required.");
        }

        try {
            return new BigDecimal(normalized);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid " + fieldName + ": " + value
            );
        }
    }

    private int parseInteger(String value, String fieldName) {
        String normalized = trimToEmpty(value);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, capitalize(fieldName) + " is required.");
        }

        try {
            return Integer.parseInt(normalized);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid " + fieldName + ": " + value
            );
        }
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }

    private String normalizedKey(String preferred, String fallback, int index) {
        String candidate = trimToEmpty(preferred);
        if (!candidate.isBlank()) {
            return candidate;
        }

        String slug = slugify(fallback);
        if (!slug.isBlank()) {
            return slug;
        }

        return "option-" + index;
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
