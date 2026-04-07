package com.tactilegallery.backend.service;

import com.tactilegallery.backend.config.AppUploadProperties;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ImageUploadService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final AppUploadProperties uploadProperties;

    public ImageUploadService(AppUploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
    }

    public String storeImage(MultipartFile file) {
        validate(file);

        String extension = extensionFor(file);
        String baseName = slugify(removeExtension(file.getOriginalFilename()));
        if (baseName.isBlank()) {
            baseName = "image";
        }

        String filename = baseName + "-" + UUID.randomUUID() + "." + extension;
        Path uploadDirectory = Paths.get(uploadProperties.getPath()).toAbsolutePath().normalize();
        Path destination = uploadDirectory.resolve(filename).normalize();

        if (!destination.startsWith(uploadDirectory)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload target.");
        }

        try {
            Files.createDirectories(uploadDirectory);
            try (InputStream stream = file.getInputStream()) {
                Files.copy(stream, destination, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to store uploaded image.");
        }

        return filename;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image file to upload.");
        }

        if (file.getSize() > uploadProperties.getMaxFileSizeBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image exceeds the upload size limit.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image uploads are supported.");
        }

        String extension = extensionFor(file);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a JPG, PNG, WEBP, or GIF image.");
        }
    }

    private String extensionFor(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded image needs a file extension.");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1)
            .trim()
            .toLowerCase(Locale.ROOT);
        if (extension.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded image needs a file extension.");
        }
        return extension;
    }

    private String removeExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return "";
        }

        int index = filename.lastIndexOf('.');
        return index > 0 ? filename.substring(0, index) : filename;
    }

    private String slugify(String value) {
        String normalized = value == null ? "" : Normalizer.normalize(value, Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{M}+", "");
        return normalized
            .trim()
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-+|-+$", "");
    }
}
