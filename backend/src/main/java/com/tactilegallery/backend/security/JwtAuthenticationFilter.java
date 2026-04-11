package com.tactilegallery.backend.security;

import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final AuthCookieService authCookieService;

    public JwtAuthenticationFilter(
        JwtService jwtService,
        AppUserRepository appUserRepository,
        AuthCookieService authCookieService
    ) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
        this.authCookieService = authCookieService;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String token = resolveToken(request);
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            JwtService.ParsedToken parsedToken = jwtService.parseToken(token);
            AuthenticatedUser tokenUser = parsedToken.user();
            AppUserEntity user = appUserRepository.findByExternalId(tokenUser.userId())
                .filter(AppUserEntity::isEnabled)
                .orElse(null);

            if (user != null && user.getTokenVersion() == parsedToken.tokenVersion()) {
                AuthenticatedUser authenticatedUser =
                    new AuthenticatedUser(user.getExternalId(), user.getEmail(), user.getRole());
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        authenticatedUser,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase(Locale.ROOT)))
                    );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                SecurityContextHolder.clearContext();
            }
        } catch (JwtException ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
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
