package com.tactilegallery.backend;

import com.tactilegallery.backend.config.AppCorsProperties;
import com.tactilegallery.backend.config.AppFrontendProperties;
import com.tactilegallery.backend.config.AppJwtProperties;
import com.tactilegallery.backend.config.AppMailProperties;
import com.tactilegallery.backend.config.AppAuthProperties;
import com.tactilegallery.backend.config.AppUploadProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
    AppAuthProperties.class,
    AppCorsProperties.class,
    AppFrontendProperties.class,
    AppJwtProperties.class,
    AppMailProperties.class,
    AppUploadProperties.class
})
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
