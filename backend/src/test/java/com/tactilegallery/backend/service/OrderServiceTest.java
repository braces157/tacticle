package com.tactilegallery.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import com.tactilegallery.backend.persistence.repository.PromoCodeRepository;
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
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EmailNotificationSender emailNotificationService;

    private PromoCodeService promoCodeService;

    private DomainModels.PromoQuote nextPromoQuote;

    private CurrentUserService currentUserService;

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        currentUserService = new CurrentUserService();
        promoCodeService = new PromoCodeServiceStub();
        orderService = new OrderService(
            appUserRepository,
            productRepository,
            orderRepository,
            new SqlDomainMapper(new ObjectMapper()),
            new ObjectMapper(),
            currentUserService,
            emailNotificationService,
            promoCodeService
        );
        nextPromoQuote = null;
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
        nextPromoQuote = noPromoQuote(900.0);

        authenticate(user);
        DomainModels.OrderDetail detail = orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());
        verify(orderRepository).nextOrderNumberValue();

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("TG-2099", savedOrder.getOrderNumber());
        assertEquals(2, savedOrder.getItemCount());
        assertEquals(0, product.getStock());
        assertEquals(0, savedOrder.getSubtotalAmount().compareTo(BigDecimal.valueOf(900)));
        assertEquals(0, savedOrder.getDiscountAmount().compareTo(BigDecimal.ZERO));
        assertEquals(0, savedOrder.getTotalAmount().compareTo(BigDecimal.valueOf(963.00)));
        assertEquals(1, savedOrder.getItems().size());

        OrderItemEntity savedItem = savedOrder.getItems().get(0);
        assertEquals(2, savedItem.getQuantity());
        assertEquals(0, savedItem.getUnitPrice().compareTo(BigDecimal.valueOf(450)));
        assertEquals(963.0, detail.total(), 0.0001);
        verify(emailNotificationService).sendOrderConfirmation(detail);
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
            request.items(),
            null
        );

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberValue()).thenReturn(2099L);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        nextPromoQuote = noPromoQuote(450.0);

        authenticate(user);
        orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());
        verify(orderRepository).nextOrderNumberValue();

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("Atelier Member", savedOrder.getCustomerName());
        assertEquals("member@tactile.gallery", savedOrder.getCustomerEmail());
    }

    @Test
    void submitOrderPersistsPromoDiscounts() {
        AppUserEntity user = enabledUser();
        ProductEntity product = productWithOptionPricing();
        ApiRequests.CheckoutRequest request = new ApiRequests.CheckoutRequest(
            checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass")).draft(),
            checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass")).items(),
            "QUIET50"
        );

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberValue()).thenReturn(2100L);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        nextPromoQuote = new DomainModels.PromoQuote("QUIET50", "$50 off orders above $400", 450.0, 50.0, 400.0);

        authenticate(user);
        DomainModels.OrderDetail detail = orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("QUIET50", savedOrder.getPromoCode());
        assertEquals(0, savedOrder.getSubtotalAmount().compareTo(BigDecimal.valueOf(450)));
        assertEquals(0, savedOrder.getDiscountAmount().compareTo(BigDecimal.valueOf(50)));
        assertEquals(0, savedOrder.getTotalAmount().compareTo(BigDecimal.valueOf(446.00)));
        assertEquals(450.0, detail.subtotal(), 0.0001);
        assertEquals(50.0, detail.discount(), 0.0001);
        assertEquals(446.0, detail.total(), 0.0001);
        assertEquals("QUIET50", detail.promoCode());
    }

    @Test
    void submitOrderMarksVietQrOrdersForPaymentReview() {
        AppUserEntity user = enabledUser();
        ProductEntity product = productWithOptionPricing();
        ApiRequests.CheckoutRequest request = checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass"));
        request = new ApiRequests.CheckoutRequest(
            new DomainModels.CheckoutDraft(
                request.draft().fullName(),
                request.draft().email(),
                request.draft().address(),
                request.draft().city(),
                request.draft().postalCode(),
                request.draft().country(),
                "VietQR / Standard courier / VCB 1042361535",
                request.draft().notes()
            ),
            request.items(),
            null
        );

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberValue()).thenReturn(2101L);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        nextPromoQuote = noPromoQuote(450.0);

        authenticate(user);
        DomainModels.OrderDetail detail = orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("Payment Review", savedOrder.getStatus());
        assertEquals("Awaiting payment review", savedOrder.getFulfillment());
        assertEquals("Awaiting VietQR transfer", savedOrder.getPaymentStatus());
        assertEquals(499.5, detail.total(), 0.0001);
        assertEquals(List.of("Order placed", "Awaiting VietQR transfer", "Awaiting payment review"), detail.timeline());
    }

    @Test
    void submitOrderMarksPayOnDeliveryOrdersForPaymentReview() {
        AppUserEntity user = enabledUser();
        ProductEntity product = productWithOptionPricing();
        ApiRequests.CheckoutRequest request = checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass"));
        request = new ApiRequests.CheckoutRequest(
            new DomainModels.CheckoutDraft(
                request.draft().fullName(),
                request.draft().email(),
                request.draft().address(),
                request.draft().city(),
                request.draft().postalCode(),
                request.draft().country(),
                "Pay on delivery / Standard shipping",
                request.draft().notes()
            ),
            request.items(),
            null
        );

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));
        when(orderRepository.nextOrderNumberValue()).thenReturn(2102L);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        nextPromoQuote = noPromoQuote(450.0);

        authenticate(user);
        DomainModels.OrderDetail detail = orderService.submitOrder(request);

        ArgumentCaptor<OrderEntity> orderCaptor = ArgumentCaptor.forClass(OrderEntity.class);
        verify(orderRepository).save(orderCaptor.capture());

        OrderEntity savedOrder = orderCaptor.getValue();
        assertEquals("Payment Review", savedOrder.getStatus());
        assertEquals("Awaiting payment review", savedOrder.getFulfillment());
        assertEquals("Payment due on delivery", savedOrder.getPaymentStatus());
        assertEquals(0, savedOrder.getTotalAmount().compareTo(BigDecimal.valueOf(499.50)));
        assertEquals(List.of("Order placed", "Payment due on delivery", "Awaiting payment review"), detail.timeline());
    }

    @Test
    void submitOrderRejectsDuplicateCartLinesThatExceedStock() {
        AppUserEntity user = enabledUser();
        ProductEntity product = productWithOptionPricing();
        product.setStock(1);
        ApiRequests.CheckoutRequest request = new ApiRequests.CheckoutRequest(
            checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass")).draft(),
            List.of(
                checkoutRequest(420.00, 1, Map.of("Plate Material", "Brass")).items().get(0),
                new DomainModels.CartItem(
                    "cart-2",
                    "tactile-core-65",
                    "Tactile Core-65",
                    new DomainModels.ImageAsset("https://example.com/product.png", "Product image"),
                    420.00,
                    1,
                    Map.of("Plate Material", "Brass")
                )
            ),
            null
        );

        when(appUserRepository.findByExternalId(user.getExternalId())).thenReturn(Optional.of(user));
        when(productRepository.findBySlug(product.getSlug())).thenReturn(Optional.of(product));

        authenticate(user);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> orderService.submitOrder(request));
        assertEquals(400, exception.getStatusCode().value());
        assertEquals("Only 1 units of Tactile Core-65 remain in stock.", exception.getReason());
        verify(orderRepository, never()).save(any(OrderEntity.class));
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

        return new ApiRequests.CheckoutRequest(draft, List.of(cartItem), null);
    }

    private DomainModels.PromoQuote noPromoQuote(double subtotal) {
        return new DomainModels.PromoQuote(null, null, subtotal, 0.0, subtotal);
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

    private class PromoCodeServiceStub extends PromoCodeService {

        private PromoCodeServiceStub() {
            super((PromoCodeRepository) null);
        }

        @Override
        public DomainModels.PromoQuote quote(String promoCode, BigDecimal subtotal) {
            return nextPromoQuote != null ? nextPromoQuote : noPromoQuote(subtotal.doubleValue());
        }

        @Override
        public DomainModels.PromoQuote redeem(String promoCode, BigDecimal subtotal) {
            return nextPromoQuote != null ? nextPromoQuote : noPromoQuote(subtotal.doubleValue());
        }
    }
}
