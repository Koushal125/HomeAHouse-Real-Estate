package com.dayforce.backend.application.dto.proximity;

import com.dayforce.backend.domain.entity.enums.AmenityType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NearbyAmenityResponse {
    private Long id;
    private AmenityType type;
    private String name;
    private String address;
    private double distanceKm;
    private boolean autoFetched;
}
