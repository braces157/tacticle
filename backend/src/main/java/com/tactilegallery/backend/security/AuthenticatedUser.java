package com.tactilegallery.backend.security;

public record AuthenticatedUser(
    String userId,
    String email,
    String role
) {

    public boolean isAdmin() {
        return "admin".equalsIgnoreCase(role);
    }
}
