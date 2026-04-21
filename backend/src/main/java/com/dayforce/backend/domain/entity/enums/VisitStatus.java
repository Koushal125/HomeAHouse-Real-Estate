package com.dayforce.backend.domain.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum VisitStatus {
    REQUESTED,
    CONFIRMED,
    COMPLETED,
    CANCELLED;

    /**
     * Case-insensitive JSON deserialization.
     * Returns null for unknown values so Bean Validation (@NotNull / @ValidBrokerVisitStatus)
     * produces a clear, caller-facing error rather than an opaque 400.
     */
    @JsonCreator
    public static VisitStatus fromValue(String value) {
        if (value == null) return null;
        try {
            return VisitStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
