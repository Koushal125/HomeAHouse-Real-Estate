package com.dayforce.backend.application.dto.sitevisit;

import com.dayforce.backend.comon.validation.ValidBrokerVisitStatus;
import com.dayforce.backend.domain.entity.enums.VisitStatus;
import jakarta.validation.constraints.NotNull;

public class VisitStatusUpdateRequest {

    @NotNull(message = "Status is required.")
    @ValidBrokerVisitStatus
    private VisitStatus status;

    public VisitStatus getStatus() { return status; }
    public void setStatus(VisitStatus status) { this.status = status; }
}
