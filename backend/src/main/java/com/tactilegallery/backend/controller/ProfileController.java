package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.security.CurrentUserService;
import com.tactilegallery.backend.service.ProfileService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users/{userId}")
public class ProfileController {

    private final ProfileService profileService;
    private final CurrentUserService currentUserService;

    public ProfileController(ProfileService profileService, CurrentUserService currentUserService) {
        this.profileService = profileService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/profile")
    public DomainModels.UserProfile getProfile(@PathVariable String userId) {
        currentUserService.assertCanAccessUser(userId);
        DomainModels.UserProfile profile = profileService.getProfile(userId);
        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found.");
        }
        return profile;
    }

    @PutMapping("/profile")
    public DomainModels.UserProfile updateProfile(
        @PathVariable String userId,
        @Valid @RequestBody ApiRequests.UpdateProfileRequest request
    ) {
        currentUserService.assertCanAccessUser(userId);
        return profileService.updateProfile(userId, request);
    }

    @GetMapping("/orders")
    public List<DomainModels.OrderSummary> getOrders(@PathVariable String userId) {
        currentUserService.assertCanAccessUser(userId);
        return profileService.getOrders(userId);
    }

    @GetMapping("/orders/{orderId}")
    public DomainModels.OrderDetail getOrderDetail(
        @PathVariable String userId,
        @PathVariable String orderId
    ) {
        currentUserService.assertCanAccessUser(userId);
        DomainModels.OrderDetail orderDetail = profileService.getOrderDetail(userId, orderId);
        if (orderDetail == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found.");
        }
        return orderDetail;
    }
}
