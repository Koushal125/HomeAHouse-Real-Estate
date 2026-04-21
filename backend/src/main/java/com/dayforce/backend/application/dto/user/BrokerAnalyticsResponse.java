package com.dayforce.backend.application.dto.user;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class BrokerAnalyticsResponse {

    private int totalViews;
    private double totalRevenue;
    private int activeListings;

    private List<PropertyViewStat> topPropertiesByViews;
    private Map<String, Long> propertyTypeBreakdown;

    private long dealsPending;
    private long dealsUnderContract;
    private long dealsClosed;

    @Data
    @Builder
    public static class PropertyViewStat {
        private Long propId;
        private String title;
        private int viewCount;
        private String city;
    }
}
