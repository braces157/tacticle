package com.tactilegallery.backend.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.frontend")
public class AppFrontendProperties {

    @NotBlank
    private String baseUrl;
    private String oauthCallbackPath = "/auth/callback";

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getOauthCallbackPath() {
        return oauthCallbackPath;
    }

    public void setOauthCallbackPath(String oauthCallbackPath) {
        this.oauthCallbackPath = oauthCallbackPath;
    }
}
