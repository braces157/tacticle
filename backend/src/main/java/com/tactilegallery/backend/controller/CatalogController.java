package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.service.CatalogService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    public List<DomainModels.Category> listCategories() {
        return catalogService.listCategories();
    }

    @GetMapping("/categories/{slug}")
    public DomainModels.Category getCategory(@PathVariable String slug) {
        DomainModels.Category category = catalogService.getCategory(slug);
        if (category == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found.");
        }
        return category;
    }

    @GetMapping("/products/featured")
    public List<DomainModels.ProductSummary> listFeaturedProducts() {
        return catalogService.listFeaturedProducts();
    }

    @GetMapping("/products")
    public List<DomainModels.ProductSummary> listProductsByCategory(
        @RequestParam("category") String categorySlug
    ) {
        return catalogService.listProductsByCategory(categorySlug);
    }

    @GetMapping("/products/{slug}")
    public DomainModels.ProductDetail getProduct(@PathVariable String slug) {
        DomainModels.ProductDetail product = catalogService.getProduct(slug);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found.");
        }
        return product;
    }

    @GetMapping("/products/{slug}/related")
    public List<DomainModels.ProductSummary> listRelatedProducts(@PathVariable String slug) {
        return catalogService.listRelatedProducts(slug);
    }

    @GetMapping("/products/{slug}/reviews")
    public List<DomainModels.ProductReview> listApprovedReviews(@PathVariable String slug) {
        return catalogService.listApprovedReviews(slug);
    }

    @GetMapping("/products/{slug}/review-eligibility")
    public DomainModels.ReviewEligibility getReviewEligibility(@PathVariable String slug) {
        return catalogService.getReviewEligibility(slug);
    }

    @PostMapping("/products/{slug}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public DomainModels.ProductReview submitReview(
        @PathVariable String slug,
        @Valid @RequestBody DomainModels.ReviewSubmission submission
    ) {
        return catalogService.submitReview(slug, submission);
    }

    @GetMapping("/search/products")
    public List<DomainModels.ProductSummary> searchProducts(@RequestParam("q") String query) {
        return catalogService.searchProducts(query);
    }
}
