package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.service.AdminService;
import com.tactilegallery.backend.dto.ApiRequests;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard/metrics")
    public List<DomainModels.AdminDashboardMetric> getMetrics() {
        return adminService.getMetrics();
    }

    @GetMapping("/dashboard/sales")
    public List<DomainModels.SalesPoint> getSalesSeries() {
        return adminService.getSalesSeries();
    }

    @GetMapping("/dashboard/low-stock")
    public List<DomainModels.LowStockAlert> getLowStockAlerts() {
        return adminService.getLowStockAlerts();
    }

    @GetMapping("/inventory")
    public List<DomainModels.AdminInventoryItem> getInventory(
        @RequestParam(required = false) String query,
        @RequestParam(required = false) String category,
        @RequestParam(required = false, name = "stockStatus") String stockStatus
    ) {
        return adminService.getInventory(query, category, stockStatus);
    }

    @GetMapping("/products/{slug}")
    public DomainModels.AdminProductRecord getProduct(@PathVariable String slug) {
        DomainModels.AdminProductRecord product = adminService.getProduct(slug);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found.");
        }
        return product;
    }

    @GetMapping("/products/draft")
    public DomainModels.AdminDraftProduct getInitialDraftProduct() {
        return adminService.getInitialDraftProduct();
    }

    @GetMapping("/products/{slug}/draft")
    public DomainModels.AdminDraftProduct getDraftProductFromExisting(@PathVariable String slug) {
        DomainModels.AdminDraftProduct draft = adminService.getDraftProductFromExisting(slug);
        if (draft == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product draft not found.");
        }
        return draft;
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public DomainModels.AdminProductRecord createProduct(
        @Valid @RequestBody DomainModels.AdminDraftProduct draft
    ) {
        return adminService.createProduct(draft);
    }

    @PutMapping("/products/{slug}")
    public DomainModels.AdminProductRecord updateProduct(
        @PathVariable String slug,
        @Valid @RequestBody DomainModels.AdminDraftProduct draft
    ) {
        DomainModels.AdminProductRecord product = adminService.updateProduct(slug, draft);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found.");
        }
        return product;
    }

    @GetMapping("/products/{slug}/reviews")
    public List<DomainModels.ProductReview> getProductReviews(
        @PathVariable String slug,
        @RequestParam(required = false) String status
    ) {
        return adminService.getProductReviews(slug, status);
    }

    @GetMapping("/reviews")
    public List<DomainModels.ProductReview> getReviews(@RequestParam(required = false) String status) {
        return adminService.getReviews(status);
    }

    @PostMapping("/reviews/{reviewId}/approve")
    public DomainModels.ProductReview approveReview(
        @PathVariable Long reviewId,
        @RequestBody(required = false) DomainModels.AdminReviewDecision decision
    ) {
        return adminService.moderateReview(reviewId, "Approved", decision == null ? null : decision.note());
    }

    @PostMapping("/reviews/{reviewId}/reject")
    public DomainModels.ProductReview rejectReview(
        @PathVariable Long reviewId,
        @RequestBody(required = false) DomainModels.AdminReviewDecision decision
    ) {
        return adminService.moderateReview(reviewId, "Rejected", decision == null ? null : decision.note());
    }

    @DeleteMapping("/products/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archiveProduct(@PathVariable String slug) {
        adminService.archiveProduct(slug);
    }

    @GetMapping("/hero-image")
    public Map<String, String> getHeroImage() {
        return Map.of("src", adminService.getHeroImage());
    }

    @GetMapping("/orders")
    public List<DomainModels.AdminOrderRecord> getOrders() {
        return adminService.getOrders();
    }

    @GetMapping("/orders/{orderId}")
    public DomainModels.AdminOrderDetail getOrderDetail(@PathVariable String orderId) {
        DomainModels.AdminOrderDetail order = adminService.getOrderDetail(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found.");
        }
        return order;
    }

    @PutMapping("/orders/{orderId}/status")
    public DomainModels.AdminOrderDetail updateOrderStatus(
        @PathVariable String orderId,
        @Valid @RequestBody ApiRequests.UpdateOrderStatusRequest request
    ) {
        return adminService.updateOrderStatus(orderId, request.status());
    }

    @GetMapping("/customers")
    public List<DomainModels.AdminCustomerRecord> getCustomers() {
        return adminService.getCustomers();
    }

    @PutMapping("/customers/{customerId}/status")
    public DomainModels.AdminCustomerRecord updateCustomerStatus(
        @PathVariable String customerId,
        @Valid @RequestBody ApiRequests.UpdateCustomerStatusRequest request
    ) {
        return adminService.updateCustomerStatus(customerId, request.status());
    }

    @PostMapping("/shipping/describe")
    public Map<String, String> describeShippingAddress(
        @Valid @RequestBody DomainModels.ShippingAddress address
    ) {
        return Map.of("label", adminService.describeShippingAddress(address));
    }
}
