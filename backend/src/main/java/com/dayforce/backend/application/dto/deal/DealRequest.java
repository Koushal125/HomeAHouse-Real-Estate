package com.dayforce.backend.application.dto.deal;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDate;

/**
 * Optional request body for POST /api/deals/{propertyId}.
 * Rental properties may supply startDate and endDate; sale properties may omit the body entirely.
 */
@Data
public class DealRequest {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate endDate;
}
