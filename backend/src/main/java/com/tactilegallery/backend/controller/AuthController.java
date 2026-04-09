package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.dto.ApiRequests;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.security.AuthCookieService;
import com.tactilegallery.backend.service.AuthService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    public AuthController(AuthService authService, AuthCookieService authCookieService) {
        this.authService = authService;
        this.authCookieService = authCookieService;
    }

    @GetMapping("/me")
    public DomainModels.AuthUser getCurrentUser() {
        return authService.getCurrentUser();
    }

    @PostMapping("/login")
    public DomainModels.AuthUser login(
        @Valid @RequestBody ApiRequests.LoginRequest request,
        HttpServletResponse response
    ) {
        DomainModels.AuthSession session = authService.login(request);
        authCookieService.writeSessionCookie(response, session.token());
        return session.user();
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public DomainModels.AuthUser register(
        @Valid @RequestBody ApiRequests.RegisterRequest request,
        HttpServletResponse response
    ) {
        DomainModels.AuthSession session = authService.register(request);
        authCookieService.writeSessionCookie(response, session.token());
        return session.user();
    }

    @PostMapping("/password-reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestPasswordReset(@Valid @RequestBody ApiRequests.PasswordResetRequest request) {
        authService.requestPasswordReset(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletResponse response) {
        authCookieService.clearSessionCookie(response);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ApiRequests.ChangePasswordRequest request) {
        authService.changePassword(request);
    }
}
