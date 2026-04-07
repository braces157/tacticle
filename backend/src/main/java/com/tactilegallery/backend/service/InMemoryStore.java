package com.tactilegallery.backend.service;

import com.tactilegallery.backend.model.DomainModels;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
public class InMemoryStore {

    public record StoredUser(
        String id,
        String name,
        String email,
        String role,
        String password
    ) {
        DomainModels.AuthUser toAuthUser() {
            return new DomainModels.AuthUser(id, name, email, role);
        }
    }

    private final Map<String, DomainModels.Category> categoriesBySlug = new LinkedHashMap<>();
    private final Map<String, DomainModels.AdminProductRecord> productsBySlug = new LinkedHashMap<>();
    private final Map<String, StoredUser> usersById = new LinkedHashMap<>();
    private final Map<String, DomainModels.AdminOrderDetail> ordersById = new LinkedHashMap<>();
    private final Set<String> featuredProductSlugs = new LinkedHashSet<>();
    private final AtomicInteger orderSequence;
    private final DomainModels.UserProfile defaultProfile;
    private final String adminHeroImage;

    public InMemoryStore() {
        SeedDataFactory.SeedState seedState = SeedDataFactory.create();

        seedState.categories().forEach(category -> categoriesBySlug.put(category.slug(), category));
        seedState.products().forEach(product -> productsBySlug.put(product.slug(), product));
        seedState.users().forEach(user -> usersById.put(user.id(), user));
        seedState.orders().forEach(order -> ordersById.put(order.id(), order));
        featuredProductSlugs.addAll(seedState.featuredProductSlugs());
        orderSequence = new AtomicInteger(seedState.highestOrderNumber());
        defaultProfile = seedState.defaultProfile();
        adminHeroImage = seedState.adminHeroImage();
    }

    public synchronized List<DomainModels.Category> getCategories() {
        return new ArrayList<>(categoriesBySlug.values());
    }

    public synchronized DomainModels.Category findCategory(String slug) {
        return categoriesBySlug.get(slug);
    }

    public synchronized List<DomainModels.AdminProductRecord> getProducts() {
        return new ArrayList<>(productsBySlug.values());
    }

    public synchronized DomainModels.AdminProductRecord findProduct(String slug) {
        return productsBySlug.get(slug);
    }

    public synchronized DomainModels.AdminProductRecord saveProduct(DomainModels.AdminProductRecord product) {
        productsBySlug.put(product.slug(), product);
        return product;
    }

    public synchronized void archiveProduct(String slug) {
        DomainModels.AdminProductRecord existing = productsBySlug.get(slug);
        if (existing != null) {
            productsBySlug.put(
                slug,
                new DomainModels.AdminProductRecord(
                    existing.id(),
                    existing.slug(),
                    existing.categorySlug(),
                    existing.name(),
                    existing.subtitle(),
                    existing.price(),
                    existing.image(),
                    existing.tags(),
                    existing.material(),
                    existing.gallery(),
                    existing.description(),
                    existing.story(),
                    existing.specs(),
                    existing.highlights(),
                    existing.options(),
                    existing.sku(),
                    existing.stock(),
                    existing.visibility(),
                    true
                )
            );
        }
    }

    public synchronized List<DomainModels.AdminOrderDetail> getOrders() {
        return new ArrayList<>(ordersById.values());
    }

    public synchronized DomainModels.AdminOrderDetail findOrder(String orderId) {
        return ordersById.get(orderId);
    }

    public synchronized DomainModels.AdminOrderDetail saveOrder(DomainModels.AdminOrderDetail order) {
        ordersById.put(order.id(), order);
        return order;
    }

    public synchronized StoredUser findUserById(String userId) {
        return usersById.get(userId);
    }

    public synchronized StoredUser findUserByEmail(String email) {
        return usersById.values().stream()
            .filter(user -> user.email().equalsIgnoreCase(email.trim()))
            .findFirst()
            .orElse(null);
    }

    public synchronized StoredUser saveUser(StoredUser user) {
        usersById.put(user.id(), user);
        return user;
    }

    public synchronized void changePassword(String userId, String nextPassword) {
        StoredUser current = usersById.get(userId);
        if (current == null) {
            return;
        }
        usersById.put(
            userId,
            new StoredUser(
                current.id(),
                current.name(),
                current.email(),
                current.role(),
                nextPassword
            )
        );
    }

    public synchronized String nextOrderId() {
        return "TG-" + orderSequence.incrementAndGet();
    }

    public synchronized List<String> getFeaturedProductSlugs() {
        return List.copyOf(featuredProductSlugs);
    }

    public DomainModels.UserProfile getDefaultProfile() {
        return defaultProfile;
    }

    public String getAdminHeroImage() {
        return adminHeroImage;
    }
}
