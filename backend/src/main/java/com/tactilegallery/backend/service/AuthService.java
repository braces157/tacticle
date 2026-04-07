package com.tactilegallery.backend.service;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.entity.UserPreferenceEntity;
import com.tactilegallery.backend.persistence.entity.UserProfileEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.security.CurrentUserService;
import com.tactilegallery.backend.security.JwtService;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final SqlDomainMapper mapper;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthService(
        AppUserRepository appUserRepository,
        SqlDomainMapper mapper,
        JwtService jwtService,
        CurrentUserService currentUserService
    ) {
        this.appUserRepository = appUserRepository;
        this.mapper = mapper;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public DomainModels.AuthUser getCurrentUser() {
        return appUserRepository.findByExternalId(currentUserService.getRequiredUser().userId())
            .filter(AppUserEntity::isEnabled)
            .map(mapper::toAuthUser)
            .orElse(null);
    }

    @Transactional(readOnly = true)
    public DomainModels.AuthSession login(ApiRequests.LoginRequest request) {
        AppUserEntity user = appUserRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!user.isEnabled() || !user.getPasswordHash().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        return new DomainModels.AuthSession(jwtService.issueToken(user), mapper.toAuthUser(user));
    }

    @Transactional
    public DomainModels.AuthSession register(ApiRequests.RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        LocalDateTime now = LocalDateTime.now();
        AppUserEntity user = new AppUserEntity();
        user.setExternalId("user-" + UUID.randomUUID());
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(request.password());
        user.setRole("customer");
        user.setEnabled(true);
        user.setCreatedAt(now);

        UserProfileEntity profile = new UserProfileEntity();
        profile.setUser(user);
        profile.setLocation("Bangkok, Thailand");
        profile.setMembership("Gallery Member");
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);

        profile.setPreferences(new ArrayList<>(List.of(
            preference(profile, "Quiet tactility", 1),
            preference(profile, "Minimal desk setups", 2)
        )));

        user.setProfile(profile);
        AppUserEntity saved = appUserRepository.save(user);
        return new DomainModels.AuthSession(jwtService.issueToken(saved), mapper.toAuthUser(saved));
    }

    @Transactional(readOnly = true)
    public void requestPasswordReset(ApiRequests.PasswordResetRequest request) {
        if (!appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "We couldn't find an account with that email.");
        }
    }

    @Transactional
    public void changePassword(ApiRequests.ChangePasswordRequest request) {
        AppUserEntity user = appUserRepository.findByExternalId(currentUserService.getRequiredUser().userId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "You need to be signed in to change your password."
            ));

        user.setPasswordHash(request.password());
    }

    private UserPreferenceEntity preference(UserProfileEntity profile, String text, int sortOrder) {
        UserPreferenceEntity preference = new UserPreferenceEntity();
        preference.setProfile(profile);
        preference.setPreferenceText(text);
        preference.setSortOrder(sortOrder);
        return preference;
    }
}
