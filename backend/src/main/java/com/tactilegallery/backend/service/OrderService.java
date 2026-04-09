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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
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

    public OrderService(
        AppUserRepository appUserRepository,
        ProductRepository productRepository,
        OrderRepository orderRepository,
        SqlDomainMapper mapper,
        ObjectMapper objectMapper,
        CurrentUserService currentUserService
    ) {
        this.appUserRepository = appUserRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.mapper = mapper;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public DomainModels.OrderDetail submitOrder(ApiRequests.CheckoutRequest request) {
        AppUserEntity user = appUserRepository.findByExternalId(currentUserService.getRequiredUser().userId())
            .filter(AppUserEntity::isEnabled)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Please sign in before placing an order."
            ));

        List<ProductEntity> touchedProducts = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        int itemCount = 0;

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

        List<OrderItemEntity> orderItems = new ArrayList<>();
        for (DomainModels.CartItem item : request.items()) {
            if (item.quantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1.");
            }

            ProductEntity product = productRepository.findBySlug(item.productSlug())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more products no longer exist."));

            if (product.isArchived() || !"Active".equalsIgnoreCase(product.getVisibility())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, product.getName() + " is no longer available.");
            }

            BigDecimal unitPrice = resolveUnitPrice(product, item.selectedOptions());
            if (product.getStock() < item.quantity()) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only " + product.getStock() + " units of " + product.getName() + " remain in stock."
                );
            }

            product.setStock(product.getStock() - item.quantity());
            touchedProducts.add(product);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(item.quantity())));
            itemCount += item.quantity();
            orderItems.add(toOrderItem(order, product, item, unitPrice));
        }

        order.setOrderNumber(nextOrderNumber());
        order.setTotalAmount(total);
        order.setItemCount(itemCount);
        order.setItems(orderItems);
        order.setTimelineEntries(new ArrayList<>(List.of(
            timelineEntry(order, "Order placed", 1),
            timelineEntry(order, "Payment confirmed", 2),
            timelineEntry(order, "Assembly queued", 3)
        )));

        OrderEntity saved = orderRepository.save(order);
        touchedProducts.sort(Comparator.comparing(ProductEntity::getId));
        return mapper.toOrderDetail(saved);
    }

    private String nextOrderNumber() {
        return "TG-" + orderRepository.nextOrderNumberValue();
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
}
