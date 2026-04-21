package com.dayforce.backend.application.dto;

import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import lombok.Data;

@Data
public class PropertyCriteria {
    // Global free-text search (title OR city OR areaName OR landmark)
    private String query;

    // Core Capstone Fields [cite: 72-75]
    private String title;
    private String config;
    private String city;
    private Double minCost;
    private Double maxCost;

    // Adjusted to use the Enums we discussed
    private OfferType offer;
    private PropertyType propertyType;

    // Optional Premium Fields from the Roadmap [cite: 751-754]
    private Integer bedrooms;
    private Boolean furnished;

    // Pagination
    private int page = 0;
    private int size = 20;

    // Optional user location for proximity-based sorting
    private Double userLat;
    private Double userLon;
}