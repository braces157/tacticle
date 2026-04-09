package com.tactilegallery.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.OrderEntity;
import com.tactilegallery.backend.persistence.entity.OrderItemEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionEntity;
import com.tactilegallery.backend.persistence.entity.ProductOptionValueEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.OrderRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import com.tactilegallery.backend.security.AuthenticatedUser;
import com.tactilegallery.backend.security.CurrentUserService;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    private CurrentUserService currentUserService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        currentUserService = new CurrentUserService();
        orderService = new OrderService(
            appUserRepository,
            productRepository,
            orderRepository,
            new SqlDomainMapper(new ObjectMapper()),
            new ObjectMapper(),
            currentUserService
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void submitOrderUsesCanonicalProductPricing() {
        AppUserEntity user = enabledUser();
        ProductEntity product = productWithOptionPricing();
        ApiRequests.CheckoutRequest request = checkoutRequest(1.00, 2, Map.of("Plate Material", "Brass"));

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberValue()).thenReturn(2099L);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authenticate(user);
        DomainModels.OrderDetail detail = orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());
        verify(orderRepository).nextOrderNumberValue();

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("TG-2099", savedOrder.getOrderNumber());
        assertEquals(2, savedOrder.getItemCount());
        assertEquals(0, product.getStock());
        assertEquals(0, savedOrder.getTotalAmount().compareTo(BigDecimal.valueOf(900)));
        assertEquals(1, savedOrder.getItems().size());

        OrderItemEntity savedItem = savedOrder.getItems().get(0);
        assertEquals(2, savedItem.getQuantity());
        assertEquals(0, savedItem.getUnitPrice().compareTo(BigDecimal.valueOf(450)));
        assertEquals(900.0, detail.total(), 0.0001);
    }

    @Test
    void submitOrderUsesAuthenticatedIdentityWhenDraftFieldsAreBlank() {
        AppUserEntity user = enabledUser();
        ProductEntity product = productWithOptionPricing();
        ApiRequests.CheckoutRequest request = checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass"));
        request = new ApiRequests.CheckoutRequest(
            new DomainModels.CheckoutDraft(
                " ",
                " ",
                "49 Charoen Nakhon Rd",
                "Bangkok",
                "10600",
                "Thailand",
                "Card",
                null
            ),
            request.items()
        );

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberValue()).thenReturn(2099L);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authenticate(user);
        orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());
        verify(orderRepository).nextOrderNumberValue();

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("Atelier Member", savedOrder.getCustomerName());
        assertEquals("member@tactile.gallery", savedOrder.getCustomerEmail());
    }

    private AppUserEntity enabledUser() {
        AppUserEntity user = new AppUserEntity();
        user.setId(1L);
        user.setExternalId("user-atelier");
        user.setName("Atelier Member");
        user.setEmail("member@tactile.gallery");
        user.setPasswordHash("hash");
        user.setRole("customer");
        user.setEnabled(true);
        return user;
    }

    private ProductEntity productWithOptionPricing() {
        ProductEntity product = new ProductEntity();
        product.setId(10L);
        product.setSlug("tactile-core-65");
        product.setName("Tactile Core-65");
        product.setSubtitle("A quiet 65% frame balanced for marbly, low-register acoustics.");
        product.setDescription("Description");
        product.setStory("Story");
        product.setMaterial("CNC aluminum");
        product.setPrice(BigDecimal.valueOf(420));
        product.setImageSrc("https://example.com/product.png");
        product.setImageAlt("Product image");
        product.setSku("KB-TC-065");
        product.setStock(2);
        product.setVisibility("Active");
        product.setArchived(false);
        product.setFeatured(false);
        product.setCreatedAt(java.time.LocalDateTime.now());
        product.setUpdatedAt(java.time.LocalDateTime.now());

        ProductOptionEntity option = new ProductOptionEntity();
        option.setId(11L);
        option.setProduct(product);
        option.setOptionKey("plate");
        option.setOptionGroupName("Plate Material");
        option.setSortOrder(1);
        option.setValues(new ArrayList<>());

        ProductOptionValueEntity fr4 = new ProductOptionValueEntity();
        fr4.setId(12L);
        fr4.setProductOption(option);
        fr4.setOptionValueKey("fr4");
        fr4.setLabel("FR4");
        fr4.setPriceDelta(BigDecimal.ZERO);
        fr4.setSortOrder(1);

        ProductOptionValueEntity brass = new ProductOptionValueEntity();
        brass.setId(13L);
        brass.setProductOption(option);
        brass.setOptionValueKey("brass");
        brass.setLabel("Brass");
        brass.setPriceDelta(BigDecimal.valueOf(30));
        brass.setSortOrder(2);

        option.getValues().add(fr4);
        option.getValues().add(brass);
        product.setOptions(List.of(option));
        return product;
    }

    private ApiRequests.CheckoutRequest checkoutRequest(double price, int quantity, Map<String, String> selectedOptions) {
        DomainModels.CheckoutDraft draft = new DomainModels.CheckoutDraft(
            "Quoc Le Phan Phu",
            "member@tactile.gallery",
            "49 Charoen Nakhon Rd",
            "Bangkok",
            "10600",
            "Thailand",
            "Card",
            null
        );

        DomainModels.CartItem cartItem = new DomainModels.CartItem(
            "cart-1",
            "tactile-core-65",
            "Tactile Core-65",
            new DomainModels.ImageAsset("https://example.com/product.png", "Product image"),
            price,
            quantity,
            selectedOptions
        );

        return new ApiRequests.CheckoutRequest(draft, List.of(cartItem));
    }

    private void authenticate(AppUserEntity user) {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken(
                new AuthenticatedUser(user.getExternalId(), user.getEmail(), user.getRole()),
                "n/a",
                List.of()
            )
        );
    }
}
