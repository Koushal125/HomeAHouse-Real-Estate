package com.dayforce.backend.domain.entity;

import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long propId;

    private String title;
    private String configuration; // e.g., 2BHK, 3BHK

    @Enumerated(EnumType.STRING)
    private OfferType offerType;

    @Enumerated(EnumType.STRING)
    private PropertyStatus status = PropertyStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    private PropertyType propertyType;

    private double offerCost;
    private double areaSqft;
    private String areaUnit;
    private int bedrooms;
    private int bathrooms;
    private boolean furnished;

    // Location Fields
    @Column(name = "address")
    private String streetName;
    @Column(name = "street")
    private String areaName;
    private String landmark;
    private String locality;
    private String city;

    // Geocoded coordinates (auto-populated from Nominatim on save)
    private Double latitude;
    private Double longitude;

    // View tracking
    private int viewCount = 0;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id")
    private Broker broker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private Customer owner; // For when a customer buys the property

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PropertyRejection> rejections = new ArrayList<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NearbyAmenity> nearbyAmenities = new ArrayList<>();

    private boolean isDeleted = false; // Soft delete field
}