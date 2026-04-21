package com.dayforce.backend.application.dto.user;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerMetricsResponse {
    private int ownedPropertiesCount;
    private int activeRentalsCount;
    private int savedListingsCount;
    private int totalDealsCount;
}
