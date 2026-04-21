package com.dayforce.backend.application.dto.deal;

import com.dayforce.backend.domain.entity.enums.DealStatus;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
@JsonPropertyOrder({
        "dealId",
        "dealDate",
        "propertyId",
        "propertyTitle",
        "dealCost",
        "customerName",
        "brokerName",
        "offerType",
        "status",
        "startDate",
        "endDate"
})
public class DealResponse {
    private Long dealId;
    private LocalDate dealDate;
    private Long propertyId;
    private String propertyTitle;
    private Double dealCost;
    private String customerName;
    private String brokerName;
    private OfferType offerType;
    private DealStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
}