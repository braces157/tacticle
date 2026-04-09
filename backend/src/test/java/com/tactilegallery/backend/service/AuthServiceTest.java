package com.tactilegallery.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.config.AppJwtProperties;
import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.security.CurrentUserService;
import com.tactilegallery.backend.security.JwtService;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.mockito.Mockito.verify;

class AuthServiceTest {

    private final AppUserRepository appUserRepository = mock(AppUserRepository.class);
    private final EmailNotificationSender emailNotificationService = mock(EmailNotificationSender.class);
    private final SqlDomainMapper mapper = new SqlDomainMapper(new ObjectMapper());
    private final JwtService jwtService = new JwtService(jwtProperties());
    private final CurrentUserService currentUserService = new CurrentUserService();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final AuthService authService = new AuthService(
        appUserRepository,
        mapper,
        jwtService,
        currentUserService,
        passwordEncoder,
        emailNotificationService
    );

    @Test
    void registerHashesPasswordsBeforeSaving() {
        when(appUserRepository.existsByEmailIgnoreCase("member@example.com")).thenReturn(false);
        when(appUserRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        DomainModels.AuthSession session = authService.register(
            new ApiRequests.RegisterRequest("Quốc Lê Phan Phú", "member@example.com", "secret123")
        );

        assertThat(session.token()).isNotBlank();
        assertThat(session.user().email()).isEqualTo("member@example.com");

        AppUserEntity savedUser = captureSavedUser();
        assertThat(savedUser.getName()).isEqualTo("Quốc Lê Phan Phú");
        assertThat(savedUser.getEmail()).isEqualTo("member@example.com");
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("secret123");
        assertThat(passwordEncoder.matches("secret123", savedUser.getPasswordHash())).isTrue();
        assertThat(savedUser.getProfile()).isNotNull();
        assertThat(savedUser.getProfile().getMembership()).isEqualTo("Gallery Member");
        verify(emailNotificationService).sendRegistrationConfirmation(savedUser);
    }

    @Test
    void loginUpgradesLegacyPlaintextPasswordOnSuccess() {
        AppUserEntity user = enabledUser("user-1", "Atelier Member", "member@example.com", "legacy-secret");
        when(appUserRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(user));

        DomainModels.AuthSession session = authService.login(
            new ApiRequests.LoginRequest("member@example.com", "legacy-secret")
        );

        assertThat(session.token()).isNotBlank();
        assertThat(user.getPasswordHash()).isNotEqualTo("legacy-secret");
        assertThat(passwordEncoder.matches("legacy-secret", user.getPasswordHash())).isTrue();
    }

    @Test
    void loginWithGoogleCreatesANewBcryptPassword() {
        when(appUserRepository.findByEmailIgnoreCase("new.member@example.com")).thenReturn(Optional.empty());
        when(appUserRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        DomainModels.AuthSession session = authService.loginWithGoogle(
            "new.member@example.com",
            "Quốc Lê Phan Phú"
        );

        assertThat(session.token()).isNotBlank();
        AppUserEntity savedUser = captureSavedUser();
        assertThat(savedUser.getEmail()).isEqualTo("new.member@example.com");
        assertThat(savedUser.getPasswordHash()).startsWith("$2");
        assertThat(savedUser.getProfile()).isNotNull();
    }

    private AppUserEntity captureSavedUser() {
        return org.mockito.Mockito.mockingDetails(appUserRepository).getInvocations().stream()
            .filter(invocation -> "save".equals(invocation.getMethod().getName()))
            .findFirst()
            .map(invocation -> (AppUserEntity) invocation.getArguments()[0])
            .orElseThrow();
    }

    private AppJwtProperties jwtProperties() {
        AppJwtProperties properties = new AppJwtProperties();
        properties.setSecret("test-secret-test-secret-test-secret-123456");
        properties.setIssuer("tactile-gallery-backend");
        properties.setAccessTokenTtlMinutes(60);
        return properties;
    }

    private AppUserEntity enabledUser(String externalId, String name, String email, String passwordHash) {
        AppUserEntity user = new AppUserEntity();
        user.setExternalId(externalId);
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setRole("customer");
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }
}
