package com.tactilegallery.backend.security;

import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriUtils;

@Component
public class OAuthLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final AppFrontendProperties frontendProperties;
    private final AuthCookieService authCookieService;

    public OAuthLoginSuccessHandler(
        AuthService authService,
        AppFrontendProperties frontendProperties,
        AuthCookieService authCookieService
    ) {
        this.authService = authService;
        this.frontendProperties = frontendProperties;
        this.authCookieService = authCookieService;
    }

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request,
        HttpServletResponse response,
        Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        try {
            if (!Boolean.TRUE.equals(oauthUser.getAttribute("email_verified"))) {
                throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Google account email must be verified."
                );
            }

            DomainModels.AuthSession session = authService.loginWithGoogle(
                attribute(oauthUser, "email"),
                attribute(oauthUser, "name")
            );
            authCookieService.writeSessionCookie(response, session.token());
            response.sendRedirect(frontendCallbackUrl());
        } catch (ResponseStatusException exception) {
            String error = UriUtils.encode(exception.getReason(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendLoginUrl() + "?oauthError=" + error);
        }
    }

    private String attribute(OAuth2User oauthUser, String key) {
        Object value = oauthUser.getAttribute(key);
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        throw new ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST,
            "Google account is missing required profile data."
        );
    }

    private String frontendCallbackUrl() {
        String baseUrl = trimTrailingSlash(frontendProperties.getBaseUrl());
        String callbackPath = frontendProperties.getOauthCallbackPath();
        if (callbackPath == null || callbackPath.isBlank()) {
            callbackPath = "/auth/callback";
        }
        return callbackPath.startsWith("/") ? baseUrl + callbackPath : baseUrl + "/" + callbackPath;
    }

    private String frontendLoginUrl() {
        return trimTrailingSlash(frontendProperties.getBaseUrl()) + "/login";
    }

    private String trimTrailingSlash(String value) {
        return value != null && value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
