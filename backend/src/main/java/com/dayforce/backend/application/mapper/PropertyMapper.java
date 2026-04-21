package com.dayforce.backend.application.mapper;

import com.dayforce.backend.application.dto.property.PropertyRequest;
import com.dayforce.backend.application.dto.property.PropertyResponse;
import com.dayforce.backend.application.dto.property.RejectionDetail;
import com.dayforce.backend.application.dto.proximity.NearbyAmenityResponse;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.NearbyAmenity;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.PropertyImage;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.infrastructure.repository.PropertyImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PropertyMapper {

    private final PropertyImageRepository propertyImageRepository;

    // Converts incoming DTO to Database Entity
    public Property toEntity(PropertyRequest request, Broker broker) {
        Property property = new Property();
        property.setTitle(request.getTitle());
        property.setConfiguration(request.getConfiguration());
        property.setPropertyType(request.getPropertyType());
        property.setOfferType(request.getOfferType());
        property.setOfferCost(request.getOfferCost());
        property.setAreaSqft(request.getAreaSqft());
        property.setAreaUnit(request.getAreaUnit());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setFurnished(request.isFurnished());
        property.setStreetName(request.getStreetName());
        property.setAreaName(request.getAreaName());
        property.setLandmark(request.getLandmark());
        property.setLocality(request.getLocality());
        property.setCity(request.getCity());
        property.setStatus(PropertyStatus.AVAILABLE); // Default status on creation [cite: 697]
        property.setBroker(broker);
        attachAmenities(request, property);
        return property;
    }

    // Converts Database Entity to outgoing DTO
    public PropertyResponse toResponse(Property property) {
        List<RejectionDetail> history = property.getRejections() != null ?
                property.getRejections().stream().map(r -> RejectionDetail.builder()
                        .brokerName(r.getBroker().getBroName())
                        .reason(r.getReason())
                        .rejectedAt(r.getRejectedAt())
                        .build()
                ).toList() : new ArrayList<>();

        List<NearbyAmenityResponse> amenities = property.getNearbyAmenities() != null ?
                property.getNearbyAmenities().stream().map(a -> NearbyAmenityResponse.builder()
                        .id(a.getId())
                        .type(a.getType())
                        .name(a.getName())
                        .address(a.getAddress())
                        .distanceKm(a.getDistanceKm())
                        .autoFetched(a.isAutoFetched())
                        .build()
                ).toList() : new ArrayList<>();

        List<String> imageUrls = propertyImageRepository
                .findByProperty_PropIdOrderByDisplayOrderAsc(property.getPropId())
                .stream()
                .map(PropertyImage::getImageUrl)
                .toList();

        return PropertyResponse.builder()
                .propId(property.getPropId())
                .title(property.getTitle())
                .configuration(property.getConfiguration())
                .propertyType(property.getPropertyType())
                .offerType(property.getOfferType())
                .status(property.getStatus())
                .offerCost(property.getOfferCost())
                .areaSqft(property.getAreaSqft())
                .areaUnit(property.getAreaUnit())
                .bedrooms(property.getBedrooms())
                .bathrooms(property.getBathrooms())
                .furnished(property.isFurnished())
                .streetName(property.getStreetName())
                .areaName(property.getAreaName())
                .landmark(property.getLandmark())
                .locality(property.getLocality())
                .city(property.getCity())
                .latitude(property.getLatitude())
                .longitude(property.getLongitude())
                .viewCount(property.getViewCount())
                .brokerId(property.getBroker() != null ? property.getBroker().getId() : null)
                .brokerName(property.getBroker() != null ? property.getBroker().getBroName() : null)
                .ownerId(property.getOwner() != null ? property.getOwner().getId() : null)
                .ownerName(property.getOwner() != null ? property.getOwner().getCustName() : null)
                .rejectionHistory(history)
                .imageUrls(imageUrls)
                .nearbyAmenities(amenities)
                .build();
    }

    public Property toEntity(PropertyRequest request, Customer owner) {
        Property property = new Property();
        property.setTitle(request.getTitle());
        property.setConfiguration(request.getConfiguration());
        property.setPropertyType(request.getPropertyType());
        property.setOfferType(request.getOfferType());
        property.setOfferCost(request.getOfferCost());
        property.setAreaSqft(request.getAreaSqft());
        property.setAreaUnit(request.getAreaUnit());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setFurnished(request.isFurnished());
        property.setStreetName(request.getStreetName());
        property.setAreaName(request.getAreaName());
        property.setLandmark(request.getLandmark());
        property.setLocality(request.getLocality());
        property.setCity(request.getCity());
//        property.setImageUrl(request.getImageUrl());

        property.setStatus(PropertyStatus.PENDING); // STRICT DEFAULT
        property.setOwner(owner); // Assign the customer
        property.setBroker(null); // No broker has claimed it yet!
    attachAmenities(request, property);
        return property;
    }

    /** Maps amenity DTOs from the request and attaches them (with back-reference) to the property. */
    public void attachAmenities(PropertyRequest request, Property property) {
        if (request.getNearbyAmenities() == null) return;
        property.getNearbyAmenities().clear();
        for (var req : request.getNearbyAmenities()) {
            NearbyAmenity amenity = new NearbyAmenity();
            amenity.setType(req.getType());
            amenity.setName(req.getName());
            amenity.setAddress(req.getAddress());
            amenity.setDistanceKm(req.getDistanceKm());
            amenity.setAutoFetched(req.isAutoFetched());
            amenity.setProperty(property);
            property.getNearbyAmenities().add(amenity);
        }
    }
}
