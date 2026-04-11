package com.tactilegallery.backend.security;

import com.tactilegallery.backend.config.AppJwtProperties;
import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final AppJwtProperties jwtProperties;
    private final SecretKey signingKey;

    public JwtService(AppJwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.signingKey = createSigningKey(jwtProperties.getSecret());
    }

    public String issueToken(AppUserEntity user) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(jwtProperties.getAccessTokenTtlMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
            .subject(user.getExternalId())
            .issuer(jwtProperties.getIssuer())
            .issuedAt(Date.from(issuedAt))
            .expiration(Date.from(expiresAt))
            .claim("email", user.getEmail())
            .claim("role", user.getRole())
            .claim("ver", user.getTokenVersion())
            .signWith(signingKey)
            .compact();
    }

    public ParsedToken parseToken(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();

        Integer tokenVersion = claims.get("ver", Integer.class);
        if (tokenVersion == null) {
            throw new JwtException("Token version is missing.");
        }

        return new ParsedToken(
            new AuthenticatedUser(
                claims.getSubject(),
                claims.get("email", String.class),
                claims.get("role", String.class)
            ),
            tokenVersion
        );
    }

    private SecretKey createSigningKey(String secret) {
        try {
            return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        } catch (RuntimeException ignored) {
            return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        }
    }

    public record ParsedToken(
        AuthenticatedUser user,
        int tokenVersion
    ) {
    }
}
