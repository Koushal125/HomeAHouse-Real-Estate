package com.dayforce.backend.application.dto.user;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BrokerMetricsResponse {
    private int activeListingsCount;
    private int dealsClosedCount;
    private int newSubmissionsCount;
    private double totalRevenueAmount;
}
