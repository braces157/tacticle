package com.tactilegallery.backend.security;

import com.tactilegallery.backend.config.AppAuthProperties;
import com.tactilegallery.backend.config.AppJwtProperties;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {

    private final AppAuthProperties authProperties;
    private final AppJwtProperties jwtProperties;

    public AuthCookieService(AppAuthProperties authProperties, AppJwtProperties jwtProperties) {
        this.authProperties = authProperties;
        this.jwtProperties = jwtProperties;
    }

    public void writeSessionCookie(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(token, Duration.ofMinutes(jwtProperties.getAccessTokenTtlMinutes())).toString());
    }

    public void clearSessionCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", Duration.ZERO).toString());
    }

    public String getCookieName() {
        return authProperties.getCookieName();
    }

    private ResponseCookie buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from(authProperties.getCookieName(), value)
            .httpOnly(true)
            .secure(authProperties.isCookieSecure())
            .sameSite(authProperties.getCookieSameSite())
            .path("/")
            .maxAge(maxAge)
            .build();
    }
}
