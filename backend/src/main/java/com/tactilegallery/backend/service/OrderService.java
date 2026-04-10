package com.tactilegallery.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.OrderEntity;
import com.tactilegallery.backend.persistence.entity.OrderItemEntity;
import com.tactilegallery.backend.persistence.entity.OrderTimelineEntryEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionValueEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.OrderRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import com.tactilegallery.backend.security.CurrentUserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    private final AppUserRepository appUserRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final SqlDomainMapper mapper;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;
    private final EmailNotificationSender emailNotificationService;
    private final PromoCodeService promoCodeService;

    public OrderService(
        AppUserRepository appUserRepository,
        ProductRepository productRepository,
        OrderRepository orderRepository,
        SqlDomainMapper mapper,
        ObjectMapper objectMapper,
        CurrentUserService currentUserService,
        EmailNotificationSender emailNotificationService,
        PromoCodeService promoCodeService
    ) {
        this.appUserRepository = appUserRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.mapper = mapper;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
        this.emailNotificationService = emailNotificationService;
        this.promoCodeService = promoCodeService;
    }

    @Transactional(readOnly = true)
    public DomainModels.PromoQuote quotePromo(ApiRequests.PromoQuoteRequest request) {
        PreparedOrder preparedOrder = prepareOrderItems(request.items(), false);
        return promoCodeService.quote(request.promoCode(), preparedOrder.subtotal());
    }

    @Transactional
    public DomainModels.OrderDetail submitOrder(ApiRequests.CheckoutRequest request) {
        AppUserEntity user = appUserRepository.findByExternalId(currentUserService.getRequiredUser().userId())
            .filter(AppUserEntity::isEnabled)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Please sign in before placing an order."
            ));
        PreparedOrder preparedOrder = prepareOrderItems(request.items(), true);
        DomainModels.PromoQuote promoQuote = promoCodeService.redeem(request.promoCode(), preparedOrder.subtotal());

        OrderEntity order = new OrderEntity();
        order.setUser(user);
        order.setCustomerName(request.draft().fullName().isBlank() ? user.getName() : request.draft().fullName().trim());
        order.setCustomerEmail(request.draft().email().isBlank() ? user.getEmail() : request.draft().email().trim().toLowerCase());
        order.setStatus(DomainModels.OrderStatus.PROCESSING.getLabel());
        order.setFulfillment("Assembly queued");
        order.setShippingLine1(request.draft().address());
        order.setShippingCity(request.draft().city());
        order.setShippingPostalCode(request.draft().postalCode());
        order.setShippingCountry(request.draft().country());
        order.setPaymentStatus("Paid");
        order.setCreatedAt(LocalDateTime.now());
        order.setOrderNumber(nextOrderNumber());
        order.setSubtotalAmount(scaleMoney(BigDecimal.valueOf(promoQuote.subtotal())));
        order.setDiscountAmount(scaleMoney(BigDecimal.valueOf(promoQuote.discount())));
        order.setPromoCode(promoQuote.code());
        order.setTotalAmount(scaleMoney(BigDecimal.valueOf(promoQuote.total())));
        order.setItemCount(preparedOrder.itemCount());
        order.setItems(preparedOrder.items().stream()
            .map(preparedItem -> toOrderItem(order, preparedItem.product(), preparedItem.cartItem(), preparedItem.unitPrice()))
            .toList());
        order.setTimelineEntries(new ArrayList<>(List.of(
            timelineEntry(order, "Order placed", 1),
            timelineEntry(order, "Payment confirmed", 2),
            timelineEntry(order, "Assembly queued", 3)
        )));

        if (promoQuote.code() != null) {
            order.getTimelineEntries().add(timelineEntry(order, "Promo applied: " + promoQuote.code(), 4));
        }

        for (PreparedOrderItem preparedItem : preparedOrder.items()) {
            ProductEntity product = preparedItem.product();
            product.setStock(product.getStock() - preparedItem.cartItem().quantity());
        }

        OrderEntity saved = orderRepository.save(order);
        DomainModels.OrderDetail detail = mapper.toOrderDetail(saved);
        emailNotificationService.sendOrderConfirmation(detail);
        return detail;
    }

    private String nextOrderNumber() {
        return "TG-" + orderRepository.nextOrderNumberValue();
    }

    private PreparedOrder prepareOrderItems(List<DomainModels.CartItem> items, boolean enforceStock) {
        List<PreparedOrderItem> preparedItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int itemCount = 0;

        for (DomainModels.CartItem item : items) {
            if (item.quantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1.");
            }

            ProductEntity product = productRepository.findBySlug(item.productSlug())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more products no longer exist."));

            if (product.isArchived() || !"Active".equalsIgnoreCase(product.getVisibility())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, product.getName() + " is no longer available.");
            }

            BigDecimal unitPrice = resolveUnitPrice(product, item.selectedOptions());
            if (enforceStock && product.getStock() < item.quantity()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only " + product.getStock() + " units of " + product.getName() + " remain in stock."
                );
            }

            preparedItems.add(new PreparedOrderItem(product, item, unitPrice));
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(item.quantity())));
            itemCount += item.quantity();
        }

        return new PreparedOrder(preparedItems, scaleMoney(subtotal), itemCount);
    }

    private OrderItemEntity toOrderItem(
        OrderEntity order,
        ProductEntity product,
        DomainModels.CartItem item,
        BigDecimal unitPrice
    ) {
        OrderItemEntity orderItem = new OrderItemEntity();
        orderItem.setOrder(order);
        orderItem.setProduct(product);
        orderItem.setProductSlug(product.getSlug());
        orderItem.setProductName(product.getName());
        orderItem.setImageSrc(product.getImageSrc());
        orderItem.setImageAlt(product.getImageAlt());
        orderItem.setUnitPrice(unitPrice);
        orderItem.setQuantity(item.quantity());
        orderItem.setSelectedOptionsJson(writeOptions(item.selectedOptions()));
        return orderItem;
    }

    private BigDecimal resolveUnitPrice(ProductEntity product, Map<String, String> selectedOptions) {
        BigDecimal unitPrice = product.getPrice();
        Map<String, String> normalizedSelections = selectedOptions == null ? Map.of() : new HashMap<>(selectedOptions);

        for (ProductOptionEntity option : product.getOptions()) {
            String selectedValueLabel = normalizedSelections.remove(option.getOptionGroupName());
            if (selectedValueLabel == null || selectedValueLabel.isBlank()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please choose an option for " + option.getOptionGroupName() + "."
                );
            }

            ProductOptionValueEntity selectedValue = option.getValues().stream()
                .filter(value -> value.getLabel().equalsIgnoreCase(selectedValueLabel.trim()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid selection for " + option.getOptionGroupName() + "."
                ));

            unitPrice = unitPrice.add(selectedValue.getPriceDelta());
        }

        if (!normalizedSelections.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unknown option selection: " + normalizedSelections.keySet().iterator().next()
            );
        }

        return unitPrice;
    }

    private OrderTimelineEntryEntity timelineEntry(OrderEntity order, String text, int sortOrder) {
        OrderTimelineEntryEntity entry = new OrderTimelineEntryEntity();
        entry.setOrder(order);
        entry.setTimelineText(text);
        entry.setSortOrder(sortOrder);
        entry.setCreatedAt(LocalDateTime.now());
        return entry;
    }

    private String writeOptions(Map<String, String> options) {
        try {
            return objectMapper.writeValueAsString(options == null ? Map.of() : options);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store order selections.");
        }
    }

    private BigDecimal scaleMoney(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private record PreparedOrder(
        List<PreparedOrderItem> items,
        BigDecimal subtotal,
        int itemCount
    ) {
    }

    private record PreparedOrderItem(
        ProductEntity product,
        DomainModels.CartItem cartItem,
        BigDecimal unitPrice
    ) {
    }
}
