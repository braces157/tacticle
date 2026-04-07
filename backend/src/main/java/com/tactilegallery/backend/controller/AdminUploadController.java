package com.tactilegallery.backend.controller;

import com.tactilegallery.backend.service.ImageUploadService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/admin/uploads")
public class AdminUploadController {

    private final ImageUploadService imageUploadService;

    public AdminUploadController(ImageUploadService imageUploadService) {
        this.imageUploadService = imageUploadService;
    }

    @PostMapping("/images")
    public Map<String, String> uploadImage(@RequestPart("file") MultipartFile file) {
        String filename = imageUploadService.storeImage(file);
        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
            .path("/uploads/")
            .path(filename)
            .toUriString();

        return Map.of(
            "url", url,
            "filename", filename
        );
    }
}
