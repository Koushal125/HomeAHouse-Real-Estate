package com.dayforce.backend.application.dto.property;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RejectionDetail
{
    private String brokerName;
    private String reason;
    private LocalDateTime rejectedAt;
}
