package com.tactilegallery.backend.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUserService {

    public AuthenticatedUser getCurrentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object principal = authentication.getPrincipal();
        return principal instanceof AuthenticatedUser user ? user : null;
    }

    public AuthenticatedUser getRequiredUser() {
        AuthenticatedUser user = getCurrentUserOrNull();
        if (user != null) {
            return user;
        }

        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
    }

    public void assertCanAccessUser(String userId) {
        AuthenticatedUser currentUser = getRequiredUser();
        if (currentUser.isAdmin() || currentUser.userId().equals(userId)) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this account.");
    }
}
