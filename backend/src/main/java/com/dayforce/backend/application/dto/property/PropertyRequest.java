package com.dayforce.backend.application.dto.property;

import com.dayforce.backend.application.dto.proximity.NearbyAmenityRequest;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class PropertyRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Configuration is required (e.g., 2BHK)")
    private String configuration;

    @NotNull(message = "Property type is required")
    private PropertyType propertyType;

    @NotNull(message = "Offer type is required")
    private OfferType offerType;

    @Positive(message = "Cost must be strictly positive")
    private double offerCost;

    @PositiveOrZero(message = "Area cannot be negative")
    private double areaSqft;

    @NotBlank(message = "Area unit is required")
    private String areaUnit;

    @Min(value = 0, message = "Bedrooms cannot be negative")
    private int bedrooms;

    @Min(value = 0, message = "Bathrooms cannot be negative")
    private int bathrooms;

    private boolean furnished;

    private static final Set<PropertyType> RESIDENTIAL_TYPES =
            Set.of(PropertyType.FLAT, PropertyType.APARTMENT, PropertyType.HOUSE, PropertyType.VILLA);

    @AssertTrue(message = "Residential properties (Flat, Apartment, House, Villa) must have at least 1 bedroom")
    private boolean isBedroomsValidForType() {
        if (propertyType == null || !RESIDENTIAL_TYPES.contains(propertyType)) return true;
        return bedrooms >= 1;
    }

    @AssertTrue(message = "Residential properties (Flat, Apartment, House, Villa) must have at least 1 bathroom")
    private boolean isBathroomsValidForType() {
        if (propertyType == null || !RESIDENTIAL_TYPES.contains(propertyType)) return true;
        return bathrooms >= 1;
    }

    @NotBlank(message = "Street name is required")
    private String streetName;

    private String areaName;

    private String landmark;

    private String locality;

    @NotBlank(message = "City is required")
    private String city;

    // Optional manual coordinate override; if null, auto-geocoded on save
    private Double latitude;
    private Double longitude;

    @Valid
    private List<NearbyAmenityRequest> nearbyAmenities;
}