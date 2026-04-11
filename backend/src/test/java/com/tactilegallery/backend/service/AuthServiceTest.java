package com.tactilegallery.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.config.AppJwtProperties;
import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import com.tactilegallery.backend.security.AuthenticatedUser;
import com.tactilegallery.backend.security.CurrentUserService;
import com.tactilegallery.backend.security.JwtService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

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
    void loginRejectsLegacyPlaintextPasswords() {
        AppUserEntity user = enabledUser("user-1", "Atelier Member", "member@example.com", "legacy-secret");
        when(appUserRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new ApiRequests.LoginRequest("member@example.com", "legacy-secret")))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
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

    @Test
    void logoutCurrentUserRevokesExistingTokens() {
        AppUserEntity user = enabledUser(
            "user-1",
            "Atelier Member",
            "member@example.com",
            passwordEncoder.encode("secret123")
        );
        when(appUserRepository.findByExternalId("user-1")).thenReturn(Optional.of(user));

        String issuedToken = jwtService.issueToken(user);
        authenticate(user);
        authService.logoutCurrentUser();

        assertThat(user.getTokenVersion()).isEqualTo(1);
        assertThat(jwtService.parseToken(issuedToken).tokenVersion()).isZero();
    }

    @Test
    void changePasswordRevokesExistingTokens() {
        AppUserEntity user = enabledUser(
            "user-1",
            "Atelier Member",
            "member@example.com",
            passwordEncoder.encode("secret123")
        );
        when(appUserRepository.findByExternalId("user-1")).thenReturn(Optional.of(user));

        String issuedToken = jwtService.issueToken(user);
        authenticate(user);
        authService.changePassword(new ApiRequests.ChangePasswordRequest("secret123", "new-secret123"));

        assertThat(user.getTokenVersion()).isEqualTo(1);
        assertThat(passwordEncoder.matches("new-secret123", user.getPasswordHash())).isTrue();
        assertThat(jwtService.parseToken(issuedToken).tokenVersion()).isZero();
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
        user.setTokenVersion(0);
        user.setCreatedAt(LocalDateTime.now());
        return user;
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
}
