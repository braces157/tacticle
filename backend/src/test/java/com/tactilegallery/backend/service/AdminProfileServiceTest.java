package com.tactilegallery.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.CategoryEntity;
import com.tactilegallery.backend.persistence.entity.UserProfileEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.CategoryRepository;
import com.tactilegallery.backend.persistence.repository.OrderRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import com.tactilegallery.backend.persistence.repository.ProductReviewRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AdminProfileServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductReviewRepository productReviewRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private AppUserRepository appUserRepository;

    private AdminService adminService;

    private final SqlDomainMapper mapper = new SqlDomainMapper(new ObjectMapper());

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
            productRepository,
            productReviewRepository,
            categoryRepository,
            orderRepository,
            appUserRepository,
            mapper
        );
    }

    @Test
    void createProductRejectsInvalidPriceWithBadRequest() {
        CategoryEntity category = new CategoryEntity();
        category.setSlug("keyboards");

        when(categoryRepository.findBySlug("keyboards")).thenReturn(Optional.of(category));
        when(productRepository.existsBySkuIgnoreCase("SKU-123")).thenReturn(false);
        when(productRepository.existsBySlug("bad-product")).thenReturn(false);

        DomainModels.AdminDraftProduct draft = new DomainModels.AdminDraftProduct(
            "Bad Product",
            "Keyboards",
            "SKU-123",
            "not-a-number",
            "10",
            "Draft description",
            "",
            "Active",
            List.of(),
            List.of()
        );

        ResponseStatusException exception = assertThrows(
            ResponseStatusException.class,
            () -> adminService.createProduct(draft)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(productRepository, never()).save(any());
    }

    @Test
    void updateProfileDoesNotRewriteHistoricalOrders() {
        ProfileService profileService = new ProfileService(appUserRepository, orderRepository, mapper);

        AppUserEntity user = new AppUserEntity();
        user.setExternalId("user-1");
        user.setName("Old Name");
        user.setEmail("old@example.com");
        user.setRole("customer");
        user.setEnabled(true);

        UserProfileEntity profile = new UserProfileEntity();
        profile.setUser(user);
        user.setProfile(profile);

        when(appUserRepository.findWithProfileByExternalId("user-1")).thenReturn(Optional.of(user));
        when(appUserRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        DomainModels.UserProfile profileResult = profileService.updateProfile(
            "user-1",
            new ApiRequests.UpdateProfileRequest(
                "New Name",
                "new@example.com",
                "Bangkok",
                "0123456789",
                "Gallery Member",
                List.of("Minimal"),
                new DomainModels.ShippingAddress("1 Main St", "Bangkok", "10000", "Thailand"),
                new DomainModels.ShippingAddress("1 Main St", "Bangkok", "10000", "Thailand")
            )
        );

        assertEquals("New Name", profileResult.name());
        assertEquals("new@example.com", profileResult.email());
        verifyNoInteractions(orderRepository);
    }
}
