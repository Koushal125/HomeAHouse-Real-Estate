package com.dayforce.backend.application.dto.property;

import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FavoriteResponse {
    private Long favoriteId;
    private Long propertyId;
    private String title;
    private String city;
    private String street;
    private PropertyType propertyType;
    private OfferType offerType;
    private PropertyStatus status;
    private double offerCost;
    private double areaSqft;
    private int bedrooms;
    private int bathrooms;
    private boolean furnished;
    private String locality;
    private List<String> imageUrls;
}
