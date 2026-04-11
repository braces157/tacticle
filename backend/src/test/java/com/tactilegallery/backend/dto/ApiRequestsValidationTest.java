package com.tactilegallery.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.tactilegallery.backend.model.DomainModels;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ApiRequestsValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void checkoutRequestRequiresDraft() {
        ApiRequests.CheckoutRequest request = new ApiRequests.CheckoutRequest(
            null,
            List.of(new DomainModels.CartItem(
                "cart-1",
                "tactile-core-65",
                "Tactile Core-65",
                new DomainModels.ImageAsset("https://example.com/product.png", "Product image"),
                420,
                1,
                Map.of("Plate Material", "FR4")
            )),
            null
        );

        assertThat(validator.validate(request))
            .extracting(violation -> violation.getPropertyPath().toString())
            .contains("draft");
    }
}
