package com.tactilegallery.backend.service;

import com.tactilegallery.backend.config.CacheNames;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.ProductEntity;
import com.tactilegallery.backend.persistence.entity.ProductReviewEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.CategoryRepository;
import com.tactilegallery.backend.persistence.repository.OrderRepository;
import com.tactilegallery.backend.persistence.repository.ProductRepository;
import com.tactilegallery.backend.persistence.repository.ProductReviewRepository;
import com.tactilegallery.backend.security.AuthenticatedUser;
import com.tactilegallery.backend.security.CurrentUserService;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.time.LocalDateTime;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private static final Set<String> GENERIC_TAGS = Set.of(
        "Imported",
        "Keyboard",
        "Accessory",
        "Part",
        "Switch",
        "Color",
        "Expanded Catalog",
        "Studio Edition",
        "Edition",
        "Weight Color",
        "Bottom Material",
        "Flex Cut PCB",
        "Print Method",
        "Size",
        "Plate Material",
        "Physical Layout"
    );

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;
    private final AppUserRepository appUserRepository;
    private final OrderRepository orderRepository;
    private final SqlDomainMapper mapper;
    private final CurrentUserService currentUserService;

    public CatalogService(
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        ProductReviewRepository productReviewRepository,
        AppUserRepository appUserRepository,
        OrderRepository orderRepository,
        SqlDomainMapper mapper,
        CurrentUserService currentUserService
    ) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.productReviewRepository = productReviewRepository;
        this.appUserRepository = appUserRepository;
        this.orderRepository = orderRepository;
        this.mapper = mapper;
        this.currentUserService = currentUserService;
    }

    @Cacheable(CacheNames.CATEGORIES)
    public List<DomainModels.Category> listCategories() {
        return categoryRepository.findAll().stream()
            .map(mapper::toCategory)
            .toList();
    }

    @Cacheable(value = CacheNames.CATEGORY_BY_SLUG, key = "#slug", unless = "#result == null")
    public DomainModels.Category getCategory(String slug) {
        return categoryRepository.findBySlug(slug)
            .map(mapper::toCategory)
            .orElse(null);
    }

    @Cacheable(CacheNames.FEATURED_PRODUCTS)
    public List<DomainModels.ProductSummary> listFeaturedProducts() {
        return activeProducts().stream()
            .filter(ProductEntity::isFeatured)
            .map(mapper::toProductSummary)
            .toList();
    }

    @Cacheable(value = CacheNames.PRODUCTS_BY_CATEGORY, key = "#slug")
    public List<DomainModels.ProductSummary> listProductsByCategory(String slug) {
        return activeProducts().stream()
            .filter(product -> product.getCategory().getSlug().equals(slug))
            .map(mapper::toProductSummary)
            .toList();
    }

    @Cacheable(value = CacheNames.PRODUCT_DETAILS, key = "#slug", unless = "#result == null")
    public DomainModels.ProductDetail getProduct(String slug) {
        return productRepository.findBySlug(slug)
            .filter(this::isActive)
            .map(mapper::toProductDetail)
            .orElse(null);
    }

    @Cacheable(value = CacheNames.RELATED_PRODUCTS, key = "#slug")
    public List<DomainModels.ProductSummary> listRelatedProducts(String slug) {
        ProductEntity current = productRepository.findBySlug(slug).orElse(null);
        if (current == null) {
            return List.of();
        }

        return activeProducts().stream()
            .filter(product -> !product.getSlug().equals(slug))
            .filter(product -> product.getCategory().getSlug().equals(current.getCategory().getSlug()))
            .map(product -> new RelatedProduct(product, similarityScore(current, product)))
            .filter(related -> related.score() > 0)
            .sorted(Comparator
                .comparingInt(RelatedProduct::score)
                .reversed()
                .thenComparing(related -> related.product().getId()))
            .limit(3)
            .map(RelatedProduct::product)
            .map(mapper::toProductSummary)
            .toList();
    }

    @Cacheable(value = CacheNames.PRODUCT_SEARCH, key = "#query == null ? '' : #query.trim().toLowerCase()")
    public List<DomainModels.ProductSummary> searchProducts(String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase();
        if (normalized.isBlank()) {
            return List.of();
        }

        return activeProducts().stream()
            .filter(product -> searchable(product).contains(normalized))
            .map(mapper::toProductSummary)
            .toList();
    }

    @Cacheable(value = CacheNames.APPROVED_REVIEWS, key = "#slug")
    public List<DomainModels.ProductReview> listApprovedReviews(String slug) {
        return productReviewRepository.findByProduct_SlugAndStatusOrderByCreatedAtDesc(slug, "Approved").stream()
            .map(mapper::toProductReview)
            .toList();
    }

    public DomainModels.ReviewEligibility getReviewEligibility(String slug) {
        ProductEntity product = productRepository.findBySlug(slug)
            .filter(this::isActive)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
        AuthenticatedUser currentUser = currentUserService.getCurrentUserOrNull();
        if (currentUser == null) {
            return new DomainModels.ReviewEligibility(false, false, false, "Sign in to review this product.");
        }

        boolean hasPurchased = orderRepository.hasPurchasedProduct(currentUser.userId(), product.getSlug());
        boolean alreadyReviewed = productReviewRepository.existsByProduct_SlugAndUser_ExternalId(
            product.getSlug(),
            currentUser.userId()
        );

        if (!hasPurchased) {
            return new DomainModels.ReviewEligibility(
                false,
                false,
                alreadyReviewed,
                "Only customers who bought this product can review it."
            );
        }

        if (alreadyReviewed) {
            return new DomainModels.ReviewEligibility(
                false,
                true,
                true,
                "You have already reviewed this product."
            );
        }

        return new DomainModels.ReviewEligibility(true, true, false, "You can submit one review for this product.");
    }

    @Transactional
    public DomainModels.ProductReview submitReview(String slug, DomainModels.ReviewSubmission submission) {
        ProductEntity product = productRepository.findBySlug(slug)
            .filter(this::isActive)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
        AuthenticatedUser currentUser = currentUserService.getRequiredUser();
        AppUserEntity user = appUserRepository.findByExternalId(currentUser.userId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));

        if (!orderRepository.hasPurchasedProduct(currentUser.userId(), product.getSlug())) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Only customers who bought this product can review it."
            );
        }
        if (productReviewRepository.existsByProduct_SlugAndUser_ExternalId(product.getSlug(), currentUser.userId())) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "You have already reviewed this product."
            );
        }

        ProductReviewEntity review = new ProductReviewEntity();
        LocalDateTime now = LocalDateTime.now();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(submission.rating());
        review.setComment(submission.comment().trim());
        review.setStatus("Pending");
        review.setCreatedAt(now);
        review.setUpdatedAt(now);

        return mapper.toProductReview(productReviewRepository.save(review));
    }

    private List<ProductEntity> activeProducts() {
        return productRepository.findAllByOrderByIdAsc().stream()
            .filter(this::isActive)
            .toList();
    }

    private boolean isActive(ProductEntity entity) {
        return !entity.isArchived() && "Active".equalsIgnoreCase(entity.getVisibility());
    }

    private String searchable(ProductEntity entity) {
        return String.join(
            " ",
            entity.getName(),
            entity.getSubtitle(),
            entity.getDescription(),
            entity.getMaterial(),
            String.join(" ", entity.getTags().stream().map(tag -> tag.getTag()).toList())
        ).toLowerCase();
    }

    private int similarityScore(ProductEntity current, ProductEntity candidate) {
        int score = 0;

        if (normalizedBrand(current).equals(normalizedBrand(candidate))) {
            score += 120;
        }
        if (normalizedMaterial(current).equals(normalizedMaterial(candidate))) {
            score += 35;
        }
        if (hasSameFormFactor(current, candidate)) {
            score += 70;
        }

        Set<String> currentKeywords = keywords(current);
        Set<String> candidateKeywords = keywords(candidate);
        int sharedKeywords = 0;
        for (String keyword : currentKeywords) {
            if (candidateKeywords.contains(keyword)) {
                sharedKeywords++;
            }
        }
        score += sharedKeywords * 14;

        return score;
    }

    private boolean hasSameFormFactor(ProductEntity left, ProductEntity right) {
        return !formFactors(left).isEmpty() && formFactors(left).equals(formFactors(right));
    }

    private Set<String> formFactors(ProductEntity entity) {
        String haystack = searchable(entity);
        LinkedHashSet<String> factors = new LinkedHashSet<>();
        if (haystack.contains("60%")) {
            factors.add("60%");
        }
        if (haystack.contains("65%")) {
            factors.add("65%");
        }
        if (haystack.contains("75%")) {
            factors.add("75%");
        }
        if (haystack.contains("96%")) {
            factors.add("96%");
        }
        if (haystack.contains("98%")) {
            factors.add("98%");
        }
        if (haystack.contains("tkl") || haystack.contains("tenkeyless")) {
            factors.add("tkl");
        }
        if (haystack.contains("alice")) {
            factors.add("alice");
        }
        if (haystack.contains("split")) {
            factors.add("split");
        }
        if (haystack.contains("full size") || haystack.contains("104-key")) {
            factors.add("full-size");
        }
        return factors;
    }

    private String normalizedBrand(ProductEntity entity) {
        return entity.getTags().stream()
            .map(tag -> tag.getTag())
            .filter(tag -> !GENERIC_TAGS.contains(tag))
            .filter(tag -> !tag.matches(".*(%|TKL).*"))
            .findFirst()
            .orElseGet(() -> firstWord(entity.getName()))
            .toLowerCase(Locale.US);
    }

    private String normalizedMaterial(ProductEntity entity) {
        return entity.getMaterial() == null ? "" : entity.getMaterial().trim().toLowerCase(Locale.US);
    }

    private Set<String> keywords(ProductEntity entity) {
        return Arrays.stream(
                (entity.getName() + " " + entity.getSubtitle())
                    .toLowerCase(Locale.US)
                    .replaceAll("[^a-z0-9%]+", " ")
                    .split("\\s+")
            )
            .filter(token -> token.length() >= 3 || token.contains("%"))
            .filter(token -> !Set.of("the", "and", "with", "for", "rgb", "kit", "hotswap", "wireless").contains(token))
            .collect(LinkedHashSet::new, Set::add, Set::addAll);
    }

    private String firstWord(String value) {
        String trimmed = value == null ? "" : value.trim();
        int firstSpace = trimmed.indexOf(' ');
        return firstSpace < 0 ? trimmed : trimmed.substring(0, firstSpace);
    }

    private record RelatedProduct(ProductEntity product, int score) {
    }
}
