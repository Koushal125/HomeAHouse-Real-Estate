package com.dayforce.backend.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_MIME_TYPES  = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path uploadDir;
    private final String baseUrl;

    public ImageStorageService(
            @Value("${app.upload.dir:uploads/property-images}") String uploadDirPath,
            @Value("${app.upload.base-url:http://localhost:8080/uploads/property-images}") String baseUrl) throws IOException {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
        this.baseUrl = baseUrl;
        Files.createDirectories(this.uploadDir);
    }

    /**
     * Persists a multipart file to local disk and returns the public URL.
     * Validates MIME type, extension, and filename to prevent OWASP A03 risks.
     */
    public String store(MultipartFile file) {
        // 1. Validate MIME type reported by the client
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPEG, PNG, and WebP images are accepted.");
        }

        String originalName = file.getOriginalFilename();

        // 2. Reject path-traversal attempts in the filename
        if (originalName != null && (originalName.contains("..") || originalName.contains("/"))) {
            throw new IllegalArgumentException("Invalid filename.");
        }

        // 3. Enforce extension allowlist
        String extension = (originalName != null && originalName.contains("."))
                ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
                : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException(
                    "Invalid file extension. Allowed types: jpg, jpeg, png, webp.");
        }

        // 4. Write under a UUID name so the original filename never touches the filesystem
        String filename = UUID.randomUUID() + "." + extension;
        try {
            Path target = this.uploadDir.resolve(filename).normalize();
            // Extra guard: ensure the resolved path stays inside uploadDir
            if (!target.startsWith(this.uploadDir)) {
                throw new IllegalArgumentException("Invalid upload path.");
            }
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return baseUrl + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image: " + filename, e);
        }
    }
}
