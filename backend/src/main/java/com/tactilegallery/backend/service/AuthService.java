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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final SqlDomainMapper mapper;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;
    private final PasswordEncoder passwordEncoder;
    private final EmailNotificationSender emailNotificationService;

    public AuthService(
        AppUserRepository appUserRepository,
        SqlDomainMapper mapper,
        JwtService jwtService,
        CurrentUserService currentUserService,
        PasswordEncoder passwordEncoder,
        EmailNotificationSender emailNotificationService
    ) {
        this.appUserRepository = appUserRepository;
        this.mapper = mapper;
        this.jwtService = jwtService;
        this.currentUserService = currentUserService;
        this.passwordEncoder = passwordEncoder;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional(readOnly = true)
    public DomainModels.AuthUser getCurrentUser() {
        return appUserRepository.findByExternalId(currentUserService.getRequiredUser().userId())
            .filter(AppUserEntity::isEnabled)
            .map(mapper::toAuthUser)
            .orElse(null);
    }

    @Transactional
    public DomainModels.AuthSession login(ApiRequests.LoginRequest request) {
        AppUserEntity user = appUserRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if (!passwordMatches(user, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if (!isBcryptHash(user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return new DomainModels.AuthSession(jwtService.issueToken(user), mapper.toAuthUser(user));
    }

    @Transactional
    public DomainModels.AuthSession register(ApiRequests.RegisterRequest request) {
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }

        AppUserEntity saved = appUserRepository.save(newUser(
            request.name().trim(),
            request.email().trim().toLowerCase(),
            passwordEncoder.encode(request.password())
        ));
        emailNotificationService.sendRegistrationConfirmation(saved);
        return new DomainModels.AuthSession(jwtService.issueToken(saved), mapper.toAuthUser(saved));
    }

    @Transactional
    public DomainModels.AuthSession loginWithGoogle(String email, String name) {
        String normalizedEmail = email.trim().toLowerCase();
        AppUserEntity user = appUserRepository.findByEmailIgnoreCase(normalizedEmail)
            .map(existing -> updateOAuthUser(existing, name))
            .orElseGet(() -> appUserRepository.save(newUser(
                name.trim(),
                normalizedEmail,
                passwordEncoder.encode(UUID.randomUUID().toString())
            )));

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "This account is disabled.");
        }

        return new DomainModels.AuthSession(jwtService.issueToken(user), mapper.toAuthUser(user));
    }

    private AppUserEntity newUser(String name, String email, String passwordHash) {
        LocalDateTime now = LocalDateTime.now();
        AppUserEntity user = new AppUserEntity();
        user.setExternalId("user-" + UUID.randomUUID());
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
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
        return user;
    }

    private AppUserEntity updateOAuthUser(AppUserEntity user, String name) {
        if (!name.isBlank()) {
            user.setName(name.trim());
        }
        return user;
    }

    @Transactional(readOnly = true)
    public void requestPasswordReset(ApiRequests.PasswordResetRequest request) {
        appUserRepository.existsByEmailIgnoreCase(request.email());
    }

    @Transactional
    public void changePassword(ApiRequests.ChangePasswordRequest request) {
        AppUserEntity user = appUserRepository.findByExternalId(currentUserService.getRequiredUser().userId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "You need to be signed in to change your password."
            ));

        if (!passwordMatches(user, request.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.password()));
    }

    private UserPreferenceEntity preference(UserProfileEntity profile, String text, int sortOrder) {
        UserPreferenceEntity preference = new UserPreferenceEntity();
        preference.setProfile(profile);
        preference.setPreferenceText(text);
        preference.setSortOrder(sortOrder);
        return preference;
    }

    private boolean passwordMatches(AppUserEntity user, String rawPassword) {
        String storedPassword = user.getPasswordHash();
        return isBcryptHash(storedPassword)
            ? passwordEncoder.matches(rawPassword, storedPassword)
            : storedPassword.equals(rawPassword);
    }

    private boolean isBcryptHash(String value) {
        return value != null
            && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }
}
