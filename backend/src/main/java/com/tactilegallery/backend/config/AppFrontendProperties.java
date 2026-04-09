package com.tactilegallery.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.frontend")
public class AppFrontendProperties {

    private String baseUrl = "http://localhost:5173";
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
