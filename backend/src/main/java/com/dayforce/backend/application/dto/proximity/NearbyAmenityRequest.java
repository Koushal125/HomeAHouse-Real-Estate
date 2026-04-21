package com.dayforce.backend.application.dto.proximity;

import com.dayforce.backend.domain.entity.enums.AmenityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class NearbyAmenityRequest {

    @NotNull(message = "Amenity type is required")
    private AmenityType type;

    @NotBlank(message = "Amenity name is required")
    private String name;

    @NotBlank(message = "Amenity address is required")
    private String address;

    @Positive(message = "Distance must be positive")
    private double distanceKm;

    private boolean autoFetched;
}
