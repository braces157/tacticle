package com.tactilegallery.backend.service;

import com.tactilegallery.backend.persistence.entity.AppUserEntity;
import com.tactilegallery.backend.persistence.repository.AppUserRepository;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PasswordHashUpgradeRunner implements ApplicationRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordHashUpgradeRunner(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<AppUserEntity> users = appUserRepository.findAll();
        for (AppUserEntity user : users) {
            String storedPassword = user.getPasswordHash();
            if (storedPassword != null && !isBcryptHash(storedPassword)) {
                user.setPasswordHash(passwordEncoder.encode(storedPassword));
            }
        }
    }

    private boolean isBcryptHash(String value) {
        return value != null
            && (value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$"));
    }
}
