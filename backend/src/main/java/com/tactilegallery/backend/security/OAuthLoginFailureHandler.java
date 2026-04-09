package com.tactilegallery.backend.security;

import com.tactilegallery.backend.config.AppFrontendProperties;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriUtils;

@Component
public class OAuthLoginFailureHandler implements AuthenticationFailureHandler {

    private final AppFrontendProperties frontendProperties;

    public OAuthLoginFailureHandler(AppFrontendProperties frontendProperties) {
        this.frontendProperties = frontendProperties;
    }

    @Override
    public void onAuthenticationFailure(
        HttpServletRequest request,
        HttpServletResponse response,
        AuthenticationException exception
    ) throws IOException, ServletException {
        String error = UriUtils.encode(
            "Google sign-in failed. Please try again.",
            StandardCharsets.UTF_8
        );
        response.sendRedirect(frontendLoginUrl() + "?oauthError=" + error);
    }

    private String frontendLoginUrl() {
        return trimTrailingSlash(frontendProperties.getBaseUrl()) + "/login";
    }

    private String trimTrailingSlash(String value) {
        return value != null && value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
