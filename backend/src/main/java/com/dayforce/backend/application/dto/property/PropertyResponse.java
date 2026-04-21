package com.dayforce.backend.application.dto.property;

import com.dayforce.backend.application.dto.proximity.NearbyAmenityResponse;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@JsonPropertyOrder({
        "propId",
        "title",
        "configuration",
        "propertyType",
        "offerType",
        "status",
        "offerCost",
        "areaSqft",
        "areaUnit",
        "bedrooms",
        "bathrooms",
        "furnished",
        "streetName",
        "areaName",
        "landmark",
        "locality",
        "city",
        "latitude",
        "longitude",
        "viewCount",
        "brokerId",
        "brokerName",
        "ownerId",
        "ownerName",
        "imageUrls",
        "nearbyAmenities"
})
public class PropertyResponse {
    private Long propId;
    private String title;
    private String configuration;
    private PropertyType propertyType;
    private OfferType offerType;
    private PropertyStatus status;
    private double offerCost;
    private double areaSqft;
    private String areaUnit;
    private int bedrooms;
    private int bathrooms;
    private boolean furnished;
    private String streetName;
    private String areaName;
    private String landmark;
    private String locality;
    private String city;
    private Double latitude;
    private Double longitude;
    private int viewCount;

    private Long brokerId;
    private String brokerName;
    private Long ownerId;
    private String ownerName;
    private List<RejectionDetail> rejectionHistory;
    private List<String> imageUrls;
    private List<NearbyAmenityResponse> nearbyAmenities;
}