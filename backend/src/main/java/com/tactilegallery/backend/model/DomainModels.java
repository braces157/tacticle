package com.tactilegallery.backend.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public final class DomainModels {

    private DomainModels() {
    }

    public enum InventoryStatus {
        IN_STOCK("In Stock"),
        LOW_STOCK("Low Stock"),
        OUT_OF_STOCK("Out of Stock");

        private final String label;

        InventoryStatus(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    public enum OrderStatus {
        PAYMENT_REVIEW("Payment Review"),
        PROCESSING("Processing"),
        READY_TO_SHIP("Ready to Ship"),
        SHIPPED("Shipped"),
        DELIVERED("Delivered"),
        CANCELED("Canceled");

        private final String label;

        OrderStatus(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    public record ImageAsset(
        @NotBlank String src,
        @NotBlank String alt
    ) {
    }

    public record SpecItem(
        @NotBlank String label,
        @NotBlank String value
    ) {
    }

    public record Category(
        @NotBlank String id,
        @NotBlank String slug,
        @NotBlank String name,
        @NotBlank String kicker,
        @NotBlank String headline,
        @NotBlank String description,
        @NotBlank String story,
        @Valid @NotNull ImageAsset heroImage
    ) {
    }

    public record ProductOptionValue(
        @NotBlank String id,
        @NotBlank String label,
        double priceDelta
    ) {
    }

    public record ProductOption(
        @NotBlank String id,
        @NotBlank String group,
        @NotEmpty List<@Valid ProductOptionValue> values
    ) {
    }

    public record ProductSummary(
        @NotBlank String id,
        @NotBlank String slug,
        @NotBlank String categorySlug,
        @NotBlank String name,
        @NotBlank String subtitle,
        double price,
        @Valid @NotNull ImageAsset image,
        @NotEmpty List<String> tags,
        @NotBlank String material
    ) {
    }

    public record ProductDetail(
        @NotBlank String id,
        @NotBlank String slug,
        @NotBlank String categorySlug,
        @NotBlank String name,
        @NotBlank String subtitle,
        double price,
        @Valid @NotNull ImageAsset image,
        @NotEmpty List<String> tags,
        @NotBlank String material,
        @NotEmpty List<@Valid ImageAsset> gallery,
        @NotBlank String description,
        @NotBlank String story,
        @NotEmpty List<@Valid SpecItem> specs,
        @NotEmpty List<String> highlights,
        @NotNull List<@Valid ProductOption> options
    ) {
    }

    public record ProductReview(
        @NotBlank String id,
        @NotBlank String productSlug,
        @NotBlank String productName,
        @NotBlank String authorName,
        int rating,
        @NotBlank String comment,
        @NotBlank String status,
        @NotBlank String createdAt,
        String adminNote
    ) {
    }

    public record ReviewEligibility(
        boolean canSubmit,
        boolean hasPurchased,
        boolean alreadyReviewed,
        @NotBlank String reason
    ) {
    }

    public record CartItem(
        @NotBlank String id,
        @NotBlank String productSlug,
        @NotBlank String productName,
        @Valid @NotNull ImageAsset image,
        double price,
        @Min(1) int quantity,
        @NotNull Map<String, String> selectedOptions
    ) {
    }

    public record CheckoutDraft(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String address,
        @NotBlank String city,
        @NotBlank String postalCode,
        @NotBlank String country,
        @NotBlank String paymentMethod,
        String notes
    ) {
    }

    public record ShippingAddress(
        @NotBlank String line1,
        @NotBlank String city,
        @NotBlank String postalCode,
        @NotBlank String country
    ) {
    }

    public record PromoQuote(
        String code,
        String description,
        double subtotal,
        double discount,
        double total
    ) {
    }

    public record AuthUser(
        @NotBlank String id,
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String role
    ) {
    }

    public record AuthSession(
        @NotBlank String token,
        @Valid @NotNull AuthUser user
    ) {
    }

    public record UserProfile(
        @NotBlank String userId,
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String location,
        String phone,
        @NotBlank String membership,
        @NotEmpty List<String> preferences,
        @Valid @NotNull ShippingAddress shippingAddress,
        @Valid @NotNull ShippingAddress billingAddress
    ) {
    }

    public record OrderSummary(
        @NotBlank String id,
        String userId,
        @NotBlank String customerName,
        @NotBlank @Email String customerEmail,
        @NotBlank String createdAt,
        @NotBlank String status,
        double subtotal,
        double discount,
        double total,
        int itemCount,
        String promoCode
    ) {
    }

    public record OrderDetail(
        @NotBlank String id,
        String userId,
        @NotBlank String customerName,
        @NotBlank @Email String customerEmail,
        @NotBlank String createdAt,
        @NotBlank String status,
        double subtotal,
        double discount,
        double total,
        int itemCount,
        String promoCode,
        @NotEmpty List<@Valid CartItem> items,
        @Valid @NotNull ShippingAddress shippingAddress,
        @NotBlank String paymentStatus,
        @NotBlank String fulfillment,
        @NotEmpty List<String> timeline
    ) {
    }

    public record AdminInventoryItem(
        @NotBlank String productId,
        @NotBlank String productSlug,
        @NotBlank String name,
        @NotBlank String subtitle,
        @NotBlank String category,
        @NotBlank String sku,
        double price,
        int stock,
        @NotBlank String status,
        @Valid @NotNull ImageAsset image
    ) {
    }

    public record AdminDashboardMetric(
        @NotBlank String label,
        @NotBlank String value,
        @NotBlank String delta,
        @NotBlank String tone
    ) {
    }

    public record AdminDraftProduct(
        @NotBlank String name,
        @NotBlank String category,
        @NotBlank String sku,
        @NotBlank String price,
        @NotBlank String stock,
        @NotBlank String description,
        String metadata,
        @NotBlank String status,
        @NotNull List<@Valid AdminDraftProductImage> images,
        @NotNull List<@Valid AdminDraftProductOption> options
    ) {
    }

    public record AdminDraftProductImage(
        String id,
        String src,
        String alt
    ) {
    }

    public record AdminDraftProductOption(
        String id,
        String group,
        @NotNull List<@Valid AdminDraftProductOptionValue> values
    ) {
    }

    public record AdminDraftProductOptionValue(
        String id,
        String label,
        String priceDelta
    ) {
    }

    public record AdminOrderRecord(
        @NotBlank String id,
        String userId,
        @NotBlank String customerName,
        @NotBlank @Email String customerEmail,
        @NotBlank String createdAt,
        @NotBlank String status,
        double subtotal,
        double discount,
        double total,
        int itemCount,
        @NotBlank String fulfillment,
        String promoCode
    ) {
    }

    public record AdminOrderDetail(
        @NotBlank String id,
        String userId,
        @NotBlank String customerName,
        @NotBlank @Email String customerEmail,
        @NotBlank String createdAt,
        @NotBlank String status,
        double subtotal,
        double discount,
        double total,
        int itemCount,
        String promoCode,
        @NotBlank String fulfillment,
        @Valid @NotNull ShippingAddress shippingAddress,
        @NotBlank String paymentStatus,
        @NotEmpty List<String> timeline,
        @NotEmpty List<@Valid CartItem> items,
        @NotNull List<@NotBlank String> allowedNextStatuses
    ) {
    }

    public record AdminCustomerRecord(
        @NotBlank String id,
        String accountId,
        @NotBlank String name,
        @NotBlank @Email String email,
        int orderCount,
        double totalSpend,
        @NotBlank String lastOrderAt,
        @NotBlank String status
    ) {
    }

    public record AdminProductRecord(
        @NotBlank String id,
        @NotBlank String slug,
        @NotBlank String categorySlug,
        @NotBlank String name,
        @NotBlank String subtitle,
        double price,
        @Valid @NotNull ImageAsset image,
        @NotEmpty List<String> tags,
        @NotBlank String material,
        @NotEmpty List<@Valid ImageAsset> gallery,
        @NotBlank String description,
        @NotBlank String story,
        @NotEmpty List<@Valid SpecItem> specs,
        @NotEmpty List<String> highlights,
        @NotNull List<@Valid ProductOption> options,
        @NotBlank String sku,
        int stock,
        @NotBlank String visibility,
        boolean archived
    ) {
    }

    public record AdminPromoCode(
        @NotBlank String id,
        @NotBlank String code,
        @NotBlank String description,
        @NotBlank String discountType,
        double discountValue,
        double minimumSubtotal,
        Integer usageLimit,
        int usageCount,
        boolean active,
        String startsAt,
        String endsAt,
        @NotBlank String createdAt,
        @NotBlank String updatedAt
    ) {
    }

    public record ReviewSubmission(
        @Min(1) @Max(5) int rating,
        @NotBlank String comment
    ) {
    }

    public record AdminReviewDecision(
        String note
    ) {
    }

    public record SalesPoint(
        @NotBlank String month,
        int value
    ) {
    }

    public record LowStockAlert(
        @NotBlank String name,
        int stock,
        int percent,
        @NotBlank String status
    ) {
    }

    public record ChatThreadSummary(
        @NotBlank String id,
        @NotBlank String status,
        @NotBlank String subject,
        @NotBlank String createdAt,
        @NotBlank String updatedAt,
        String lastMessageAt,
        String lastMessagePreview,
        String lastMessageSenderRole,
        @NotBlank String customerId,
        @NotBlank String customerName,
        @NotBlank @Email String customerEmail,
        String productSlug,
        String productName
    ) {
    }

    public record ChatMessage(
        @NotBlank String id,
        @NotBlank String threadId,
        @NotBlank String senderId,
        @NotBlank String senderName,
        @NotBlank String senderRole,
        @NotBlank String body,
        @NotBlank String createdAt
    ) {
    }

    public record ChatThreadDetail(
        @Valid @NotNull ChatThreadSummary thread,
        @NotNull List<@Valid ChatMessage> messages
    ) {
    }
}
