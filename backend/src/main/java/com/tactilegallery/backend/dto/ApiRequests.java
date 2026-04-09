package com.tactilegallery.backend.dto;

import com.tactilegallery.backend.model.DomainModels;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class ApiRequests {

    private ApiRequests() {
    }

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {
    }

    public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 4) String password
    ) {
    }

    public record PasswordResetRequest(
        @NotBlank @Email String email
    ) {
    }

    public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 4) String password
    ) {
    }

    public record CheckoutRequest(
        @Valid DomainModels.CheckoutDraft draft,
        @Valid @NotEmpty List<DomainModels.CartItem> items
    ) {
    }

    public record UpdateProfileRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank String location,
        String phone,
        @NotBlank String membership,
        @NotEmpty List<@NotBlank String> preferences,
        @Valid @NotNull DomainModels.ShippingAddress shippingAddress,
        @Valid @NotNull DomainModels.ShippingAddress billingAddress
    ) {
    }

    public record UpdateOrderStatusRequest(
        @NotBlank String status
    ) {
    }

    public record UpdateCustomerStatusRequest(
        @NotBlank String status
    ) {
    }
}
