package com.dayforce.backend.application.dto.property;

import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PropertyStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private PropertyStatus status;

    private String reason;
}