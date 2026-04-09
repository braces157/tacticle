package com.tactilegallery.backend.service;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.UserPreferenceEntity;
import com.tactilegallery.backend.persistence.entity.UserProfileEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.persistence.repository.OrderRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ProfileService {

    private final AppUserRepository appUserRepository;
    private final OrderRepository orderRepository;
    private final SqlDomainMapper mapper;

    public ProfileService(
        AppUserRepository appUserRepository,
        OrderRepository orderRepository,
        SqlDomainMapper mapper
    ) {
        this.appUserRepository = appUserRepository;
        this.orderRepository = orderRepository;
        this.mapper = mapper;
    }

    public DomainModels.UserProfile getProfile(String userId) {
        return appUserRepository.findWithProfileByExternalId(userId)
            .map(mapper::toUserProfile)
            .orElse(null);
    }

    @Transactional
    public DomainModels.UserProfile updateProfile(String userId, ApiRequests.UpdateProfileRequest request) {
        AppUserEntity user = appUserRepository.findWithProfileByExternalId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found."));

        String nextEmail = request.email().trim().toLowerCase();
        if (!nextEmail.equalsIgnoreCase(user.getEmail()) && appUserRepository.existsByEmailIgnoreCase(nextEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        user.setName(request.name().trim());
        user.setEmail(nextEmail);

        LocalDateTime now = LocalDateTime.now();
        UserProfileEntity profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfileEntity();
            profile.setUser(user);
            profile.setCreatedAt(now);
            profile.setPreferences(new ArrayList<>());
            user.setProfile(profile);
        }

        profile.setLocation(request.location().trim());
        profile.setPhone(trimToEmpty(request.phone()));
        profile.setMembership(request.membership().trim());
        profile.setShippingLine1(request.shippingAddress().line1().trim());
        profile.setShippingCity(request.shippingAddress().city().trim());
        profile.setShippingPostalCode(request.shippingAddress().postalCode().trim());
        profile.setShippingCountry(request.shippingAddress().country().trim());
        profile.setBillingLine1(request.billingAddress().line1().trim());
        profile.setBillingCity(request.billingAddress().city().trim());
        profile.setBillingPostalCode(request.billingAddress().postalCode().trim());
        profile.setBillingCountry(request.billingAddress().country().trim());
        profile.setUpdatedAt(now);

        profile.getPreferences().clear();
        for (int index = 0; index < request.preferences().size(); index++) {
            UserPreferenceEntity preference = new UserPreferenceEntity();
            preference.setProfile(profile);
            preference.setPreferenceText(request.preferences().get(index).trim());
            preference.setSortOrder(index + 1);
            profile.getPreferences().add(preference);
        }

        return mapper.toUserProfile(user);
    }

    public List<DomainModels.OrderSummary> getOrders(String userId) {
        return orderRepository.findByUser_ExternalIdOrderByCreatedAtDesc(userId).stream()
            .map(mapper::toOrderSummary)
            .toList();
    }

    public DomainModels.OrderDetail getOrderDetail(String userId, String orderId) {
        return orderRepository.findByOrderNumber(orderId)
            .filter(order -> order.getUser() != null && userId.equals(order.getUser().getExternalId()))
            .map(mapper::toOrderDetail)
            .orElse(null);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
