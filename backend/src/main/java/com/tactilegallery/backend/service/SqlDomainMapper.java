package com.tactilegallery.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.CategoryEntity;
import com.tactilegallery.backend.persistence.entity.OrderEntity;
import com.tactilegallery.backend.persistence.entity.OrderItemEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionEntity;
import com.tactilegallery.backend.persistence.entity.ProductReviewEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class SqlDomainMapper {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final TypeReference<Map<String, String>> STRING_MAP = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public SqlDomainMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public DomainModels.Category toCategory(CategoryEntity entity) {
        return new DomainModels.Category(
            String.valueOf(entity.getId()),
            entity.getSlug(),
            entity.getName(),
            entity.getKicker(),
            entity.getHeadline(),
            entity.getDescription(),
            entity.getStory(),
            new DomainModels.ImageAsset(entity.getHeroImageSrc(), entity.getHeroImageAlt())
        );
    }

    public DomainModels.ProductSummary toProductSummary(ProductEntity entity) {
        return new DomainModels.ProductSummary(
            String.valueOf(entity.getId()),
            entity.getSlug(),
            entity.getCategory().getSlug(),
            entity.getName(),
            entity.getSubtitle(),
            moneyToDouble(entity.getPrice()),
            toPrimaryImage(entity),
            entity.getTags().stream().map(tag -> tag.getTag()).toList(),
            entity.getMaterial()
        );
    }

    public DomainModels.ProductDetail toProductDetail(ProductEntity entity) {
        List<DomainModels.ImageAsset> gallery = entity.getImages().isEmpty()
            ? List.of(toPrimaryImage(entity))
            : entity.getImages().stream()
                .map(image -> new DomainModels.ImageAsset(image.getImageSrc(), image.getImageAlt()))
                .toList();

        List<DomainModels.SpecItem> specs = entity.getSpecs().isEmpty()
            ? List.of(new DomainModels.SpecItem("Material", entity.getMaterial()))
            : entity.getSpecs().stream()
                .map(spec -> new DomainModels.SpecItem(spec.getSpecLabel(), spec.getSpecValue()))
                .toList();

        List<String> highlights = entity.getHighlights().isEmpty()
            ? List.of("Curated storefront item")
            : entity.getHighlights().stream()
                .map(highlight -> highlight.getHighlightText())
                .toList();

        return new DomainModels.ProductDetail(
            String.valueOf(entity.getId()),
            entity.getSlug(),
            entity.getCategory().getSlug(),
            entity.getName(),
            entity.getSubtitle(),
            moneyToDouble(entity.getPrice()),
            toPrimaryImage(entity),
            entity.getTags().stream().map(tag -> tag.getTag()).toList(),
            entity.getMaterial(),
            gallery,
            entity.getDescription(),
            entity.getStory(),
            specs,
            highlights,
            entity.getOptions().stream().map(this::toProductOption).toList()
        );
    }

    public DomainModels.AdminProductRecord toAdminProductRecord(ProductEntity entity) {
        DomainModels.ProductDetail detail = toProductDetail(entity);
        return new DomainModels.AdminProductRecord(
            detail.id(),
            detail.slug(),
            detail.categorySlug(),
            detail.name(),
            detail.subtitle(),
            detail.price(),
            detail.image(),
            detail.tags(),
            detail.material(),
            detail.gallery(),
            detail.description(),
            detail.story(),
            detail.specs(),
            detail.highlights(),
            detail.options(),
            entity.getSku(),
            entity.getStock(),
            entity.getVisibility(),
            entity.isArchived()
        );
    }

    public DomainModels.AdminInventoryItem toAdminInventoryItem(ProductEntity entity) {
        return new DomainModels.AdminInventoryItem(
            String.valueOf(entity.getId()),
            entity.getSlug(),
            entity.getName(),
            entity.getSubtitle(),
            toCategoryLabel(entity.getCategory().getSlug()),
            entity.getSku(),
            moneyToDouble(entity.getPrice()),
            entity.getStock(),
            toInventoryStatus(entity.getStock()).getLabel(),
            toPrimaryImage(entity)
        );
    }

    public DomainModels.AuthUser toAuthUser(AppUserEntity entity) {
        return new DomainModels.AuthUser(
            entity.getExternalId(),
            entity.getName(),
            entity.getEmail(),
            entity.getRole()
        );
    }

    public DomainModels.UserProfile toUserProfile(AppUserEntity entity) {
        List<String> preferences = entity.getProfile() == null
            ? List.of()
            : entity.getProfile().getPreferences().stream()
                .map(preference -> preference.getPreferenceText())
                .toList();

        return new DomainModels.UserProfile(
            entity.getExternalId(),
            entity.getName(),
            entity.getEmail(),
            entity.getProfile() == null ? "Bangkok, Thailand" : entity.getProfile().getLocation(),
            entity.getProfile() == null ? "" : safeText(entity.getProfile().getPhone()),
            entity.getProfile() == null ? "Gallery Member" : entity.getProfile().getMembership(),
            preferences,
            new DomainModels.ShippingAddress(
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getShippingLine1()),
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getShippingCity()),
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getShippingPostalCode()),
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getShippingCountry())
            ),
            new DomainModels.ShippingAddress(
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getBillingLine1()),
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getBillingCity()),
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getBillingPostalCode()),
                entity.getProfile() == null ? "" : safeText(entity.getProfile().getBillingCountry())
            )
        );
    }

    public DomainModels.OrderSummary toOrderSummary(OrderEntity entity) {
        return new DomainModels.OrderSummary(
            entity.getOrderNumber(),
            entity.getUser() == null ? null : entity.getUser().getExternalId(),
            entity.getCustomerName(),
            entity.getCustomerEmail(),
            formatDateTime(entity.getCreatedAt()),
            entity.getStatus(),
            moneyToDouble(entity.getTotalAmount()),
            entity.getItemCount()
        );
    }

    public DomainModels.OrderDetail toOrderDetail(OrderEntity entity) {
        DomainModels.AdminOrderDetail adminOrderDetail = toAdminOrderDetail(entity);
        return new DomainModels.OrderDetail(
            adminOrderDetail.id(),
            adminOrderDetail.userId(),
            adminOrderDetail.customerName(),
            adminOrderDetail.customerEmail(),
            adminOrderDetail.createdAt(),
            adminOrderDetail.status(),
            adminOrderDetail.total(),
            adminOrderDetail.itemCount(),
            adminOrderDetail.items(),
            adminOrderDetail.shippingAddress(),
            adminOrderDetail.paymentStatus(),
            adminOrderDetail.fulfillment(),
            adminOrderDetail.timeline()
        );
    }

    public DomainModels.AdminOrderRecord toAdminOrderRecord(OrderEntity entity) {
        return new DomainModels.AdminOrderRecord(
            entity.getOrderNumber(),
            entity.getUser() == null ? null : entity.getUser().getExternalId(),
            entity.getCustomerName(),
            entity.getCustomerEmail(),
            formatDateTime(entity.getCreatedAt()),
            entity.getStatus(),
            moneyToDouble(entity.getTotalAmount()),
            entity.getItemCount(),
            entity.getFulfillment()
        );
    }

    public DomainModels.AdminOrderDetail toAdminOrderDetail(OrderEntity entity) {
        return new DomainModels.AdminOrderDetail(
            entity.getOrderNumber(),
            entity.getUser() == null ? null : entity.getUser().getExternalId(),
            entity.getCustomerName(),
            entity.getCustomerEmail(),
            formatDateTime(entity.getCreatedAt()),
            entity.getStatus(),
            moneyToDouble(entity.getTotalAmount()),
            entity.getItemCount(),
            entity.getFulfillment(),
            new DomainModels.ShippingAddress(
                entity.getShippingLine1(),
                entity.getShippingCity(),
                entity.getShippingPostalCode(),
                entity.getShippingCountry()
            ),
            entity.getPaymentStatus(),
            entity.getTimelineEntries().stream()
                .map(timelineEntry -> timelineEntry.getTimelineText())
                .toList(),
            entity.getItems().stream().map(this::toCartItem).toList(),
            List.of()
        );
    }

    public DomainModels.CartItem toCartItem(OrderItemEntity entity) {
        return new DomainModels.CartItem(
            String.valueOf(entity.getId()),
            entity.getProductSlug(),
            entity.getProductName(),
            new DomainModels.ImageAsset(entity.getImageSrc(), entity.getImageAlt()),
            moneyToDouble(entity.getUnitPrice()),
            entity.getQuantity(),
            parseOptions(entity.getSelectedOptionsJson())
        );
    }

    public DomainModels.ProductReview toProductReview(ProductReviewEntity entity) {
        return new DomainModels.ProductReview(
            String.valueOf(entity.getId()),
            entity.getProduct().getSlug(),
            entity.getProduct().getName(),
            entity.getUser().getName(),
            entity.getRating(),
            entity.getComment(),
            entity.getStatus(),
            formatDateTime(entity.getCreatedAt()),
            entity.getAdminNote()
        );
    }

    public String toCategoryLabel(String slug) {
        return switch (slug) {
            case "custom-parts" -> "Custom Parts";
            case "accessories" -> "Accessories";
            default -> "Keyboards";
        };
    }

    public String toCategorySlug(String label) {
        String normalized = label == null ? "" : label.trim().toLowerCase();
        if ("custom parts".equals(normalized)) {
            return "custom-parts";
        }
        return normalized.isBlank() ? "keyboards" : normalized;
    }

    public DomainModels.InventoryStatus toInventoryStatus(int stock) {
        if (stock <= 0) {
            return DomainModels.InventoryStatus.OUT_OF_STOCK;
        }
        if (stock <= 5) {
            return DomainModels.InventoryStatus.LOW_STOCK;
        }
        return DomainModels.InventoryStatus.IN_STOCK;
    }

    public String formatDateTime(LocalDateTime value) {
        return value == null ? "" : value.format(DATE_TIME_FORMATTER);
    }

    public double moneyToDouble(BigDecimal value) {
        return value == null ? 0 : value.doubleValue();
    }

    private DomainModels.ImageAsset toPrimaryImage(ProductEntity entity) {
        return new DomainModels.ImageAsset(entity.getImageSrc(), entity.getImageAlt());
    }

    private DomainModels.ProductOption toProductOption(ProductOptionEntity entity) {
        return new DomainModels.ProductOption(
            entity.getOptionKey(),
            entity.getOptionGroupName(),
            entity.getValues().stream()
                .map(value -> new DomainModels.ProductOptionValue(
                    value.getOptionValueKey(),
                    value.getLabel(),
                    moneyToDouble(value.getPriceDelta())
                ))
                .toList()
        );
    }

    private Map<String, String> parseOptions(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }

        try {
            return objectMapper.readValue(json, STRING_MAP);
        } catch (JsonProcessingException exception) {
            return Map.of();
        }
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }
}
