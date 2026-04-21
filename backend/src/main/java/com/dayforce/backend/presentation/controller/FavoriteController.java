package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.property.FavoriteResponse;
import com.dayforce.backend.application.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Favorites", description = "Save and manage favorite properties")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /** POST /api/favorites/{propertyId} — save a property */
    @PostMapping("/{propertyId}")
    public ResponseEntity<Void> addFavorite(
            @PathVariable Long propertyId,
            Authentication authentication) {
        favoriteService.addFavorite(authentication.getName(), propertyId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** DELETE /api/favorites/{propertyId} — unsave a property */
    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long propertyId,
            Authentication authentication) {
        favoriteService.removeFavorite(authentication.getName(), propertyId);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/favorites — list all saved properties */
    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> getFavorites(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.getFavorites(authentication.getName()));
    }

    /** GET /api/favorites/{propertyId}/check — check if a property is saved */
    @GetMapping("/{propertyId}/check")
    public ResponseEntity<Map<String, Boolean>> checkFavorite(
            @PathVariable Long propertyId,
            Authentication authentication) {
        boolean saved = favoriteService.isFavorited(authentication.getName(), propertyId);
        return ResponseEntity.ok(Map.of("saved", saved));
    }
}
