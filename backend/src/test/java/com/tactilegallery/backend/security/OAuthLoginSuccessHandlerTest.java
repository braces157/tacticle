package com.tactilegallery.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.tactilegallery.backend.config.AppAuthProperties;
import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.config.AppJwtProperties;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.service.AuthService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.authentication.TestingAuthenticationToken;

class OAuthLoginSuccessHandlerTest {

    @Test
    void redirectsToFrontendCallbackAndSetsCookie() throws Exception {
        StubAuthService authService = new StubAuthService(
            new DomainModels.AuthSession(
                "abc+/=",
                new DomainModels.AuthUser("user-1", "Quốc Lê Phan Phú", "member@example.com", "customer")
            )
        );
        AppFrontendProperties frontendProperties = new AppFrontendProperties();
        frontendProperties.setBaseUrl("http://localhost:5173/");
        frontendProperties.setOauthCallbackPath("/auth/callback");
        OAuthLoginSuccessHandler handler = new OAuthLoginSuccessHandler(
            authService,
            frontendProperties,
            authCookieService()
        );

        OAuth2User oauthUser = new DefaultOAuth2User(
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            Map.of(
                "email", "member@example.com",
                "name", "Quốc Lê Phan Phú",
                "email_verified", true
            ),
            "email"
        );
        Authentication authentication = new TestingAuthenticationToken(oauthUser, "n/a");

        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

        assertThat(response.getRedirectedUrl()).isEqualTo("http://localhost:5173/auth/callback");
        assertThat(response.getHeader("Set-Cookie")).contains("tg_session=abc+/=");
        assertThat(response.getHeader("Set-Cookie")).contains("HttpOnly");
        assertThat(authService.email).isEqualTo("member@example.com");
        assertThat(authService.name).isEqualTo("Quốc Lê Phan Phú");
    }

    @Test
    void redirectsToLoginWhenGoogleProfileDataIsMissing() throws Exception {
        StubAuthService authService = new StubAuthService(
            new DomainModels.AuthSession(
                "unused",
                new DomainModels.AuthUser("user-1", "Atelier Member", "member@example.com", "customer")
            )
        );
        AppFrontendProperties frontendProperties = new AppFrontendProperties();
        frontendProperties.setBaseUrl("http://localhost:5173");
        OAuthLoginSuccessHandler handler = new OAuthLoginSuccessHandler(
            authService,
            frontendProperties,
            authCookieService()
        );

        OAuth2User oauthUser = new DefaultOAuth2User(
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            Map.of(
                "name", "Atelier Member",
                "email_verified", true
            ),
            "name"
        );
        Authentication authentication = new TestingAuthenticationToken(oauthUser, "n/a");

        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

        assertThat(response.getRedirectedUrl())
            .isEqualTo("http://localhost:5173/login?oauthError=Google%20account%20is%20missing%20required%20profile%20data.");
    }

    @Test
    void redirectsToLoginWhenGoogleEmailIsNotVerified() throws Exception {
        StubAuthService authService = new StubAuthService(
            new DomainModels.AuthSession(
                "unused",
                new DomainModels.AuthUser("user-1", "Atelier Member", "member@example.com", "customer")
            )
        );
        AppFrontendProperties frontendProperties = new AppFrontendProperties();
        frontendProperties.setBaseUrl("http://localhost:5173");
        OAuthLoginSuccessHandler handler = new OAuthLoginSuccessHandler(
            authService,
            frontendProperties,
            authCookieService()
        );

        OAuth2User oauthUser = new DefaultOAuth2User(
            List.of(new SimpleGrantedAuthority("ROLE_USER")),
            Map.of(
                "email", "member@example.com",
                "name", "Atelier Member",
                "email_verified", false
            ),
            "email"
        );
        Authentication authentication = new TestingAuthenticationToken(oauthUser, "n/a");

        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), response, authentication);

        assertThat(response.getRedirectedUrl())
            .isEqualTo("http://localhost:5173/login?oauthError=Google%20account%20email%20must%20be%20verified.");
    }

    private AuthCookieService authCookieService() {
        AppAuthProperties authProperties = new AppAuthProperties();
        authProperties.setCookieName("tg_session");
        authProperties.setCookieSameSite("Lax");

        AppJwtProperties jwtProperties = new AppJwtProperties();
        jwtProperties.setAccessTokenTtlMinutes(60);

        return new AuthCookieService(authProperties, jwtProperties);
    }

    private static final class StubAuthService extends AuthService {
        private final DomainModels.AuthSession session;
        private String email;
        private String name;

        private StubAuthService(DomainModels.AuthSession session) {
            super(null, null, null, null, null);
            this.session = session;
        }

        @Override
        public DomainModels.AuthSession loginWithGoogle(String email, String name) {
            this.email = email;
            this.name = name;
            return session;
        }
    }
}
