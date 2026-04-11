package com.tactilegallery.backend.security;

import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

@Component
public class WebSocketAuthHandshakeInterceptor implements HandshakeInterceptor {

    public static final String AUTH_USER_ATTRIBUTE = "chat.authenticatedUser";

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final AuthCookieService authCookieService;

    public WebSocketAuthHandshakeInterceptor(
        JwtService jwtService,
        AppUserRepository appUserRepository,
        AuthCookieService authCookieService
    ) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
        this.authCookieService = authCookieService;
    }

    @Override
    public boolean beforeHandshake(
        ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        String token = resolveToken(servletRequest.getServletRequest());
        if (token == null || token.isBlank()) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            JwtService.ParsedToken parsedToken = jwtService.parseToken(token);
            AuthenticatedUser tokenUser = parsedToken.user();
            AppUserEntity user = appUserRepository.findByExternalId(tokenUser.userId())
                .filter(AppUserEntity::isEnabled)
                .orElse(null);

            if (user == null || user.getTokenVersion() != parsedToken.tokenVersion()) {
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            AuthenticatedUser authenticatedUser =
                new AuthenticatedUser(user.getExternalId(), user.getEmail(), user.getRole());
            attributes.put(AUTH_USER_ATTRIBUTE, authenticatedUser);
            attributes.put(
                UsernamePasswordAuthenticationToken.class.getName(),
                new UsernamePasswordAuthenticationToken(
                    authenticatedUser,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase(Locale.ROOT)))
                )
            );
            return true;
        } catch (JwtException exception) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(
        ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Exception exception
    ) {
    }

    private String resolveToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7).trim();
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (authCookieService.getCookieName().equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
