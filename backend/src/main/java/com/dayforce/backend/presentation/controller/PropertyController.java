package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.PropertyCriteria;
import com.dayforce.backend.application.dto.property.PropertyRequest;
import com.dayforce.backend.application.dto.property.PropertyResponse;
import com.dayforce.backend.application.dto.property.PropertyStatusUpdateRequest;
import com.dayforce.backend.application.service.PropertyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;

    @PostMapping
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody PropertyRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return new ResponseEntity<>(propertyService.createProperty(request, email), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody PropertyRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(propertyService.updateProperty(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication.getName();
        propertyService.deleteProperty(id, email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertyResponse> getProperty(
            @PathVariable Long id,
            Authentication authentication) {
        String email = (authentication != null) ? authentication.getName() : null;
        return ResponseEntity.ok(propertyService.getPropertyDetails(id, email));
    }

    @GetMapping
    public ResponseEntity<Page<PropertyResponse>> listAllActiveProperties(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLon) {
        return ResponseEntity.ok(propertyService.listAllActiveProperties(page, size, userLat, userLon));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<PropertyResponse>> searchProperties(@ModelAttribute PropertyCriteria criteria) {
        return ResponseEntity.ok(propertyService.searchProperties(criteria));
    }

    @GetMapping("/me/managed")
    public ResponseEntity<List<PropertyResponse>> getManagedProperties(Authentication authentication)
    {
        return  ResponseEntity.ok(propertyService.getManagedProperties(authentication.getName()));
    }

    @GetMapping("/me/deleted")
    public ResponseEntity<List<PropertyResponse>> getDeletedManagedProperties(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getDeletedManagedProperties(authentication.getName()));
    }
    @PostMapping("/submit")
    public ResponseEntity<PropertyResponse> submitProperty(
            @Valid @RequestBody PropertyRequest request,
            Authentication authentication) {
        return new ResponseEntity<>(propertyService.submitProperty(request, authentication.getName()), HttpStatus.CREATED);
    }

    @GetMapping("/me/submissions")
    public ResponseEntity<List<PropertyResponse>> getMySubmissions(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getMySubmissions(authentication.getName()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PropertyResponse>> getPendingSubmissions(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getPendingSubmissions(authentication.getName()));
    }


    @PutMapping("/{id}/status")
    public ResponseEntity<PropertyResponse> updatePropertyStatus(
            @PathVariable Long id,
            @Valid @RequestBody PropertyStatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(propertyService.updatePropertyStatus(id, request, authentication.getName()));
    }

    /** POST /api/properties/{id}/images — upload one or more images for a property */
    @PostMapping("/{id}/images")
    public ResponseEntity<List<String>> uploadPropertyImages(
            @PathVariable Long id,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {
        List<String> urls = propertyService.uploadImages(id, files, authentication.getName());
        return ResponseEntity.ok(urls);
    }

    /** GET /api/properties/{id}/images — list image URLs for a property */
    @GetMapping("/{id}/images")
    public ResponseEntity<List<String>> getPropertyImages(@PathVariable Long id) {
        return ResponseEntity.ok(propertyService.getPropertyImageUrls(id));
    }

    /** GET /api/properties/me/recently-viewed — last 10 properties viewed by the customer */
    @GetMapping("/me/recently-viewed")
    public ResponseEntity<List<PropertyResponse>> getRecentlyViewed(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getRecentlyViewed(authentication.getName()));
    }

    /** GET /api/properties/recommended — hybrid recommended properties for authenticated user */
    @GetMapping("/recommended")
    public ResponseEntity<List<PropertyResponse>> getRecommended(Authentication authentication) {
        return ResponseEntity.ok(propertyService.getRecommendedProperties(authentication.getName()));
    }
}