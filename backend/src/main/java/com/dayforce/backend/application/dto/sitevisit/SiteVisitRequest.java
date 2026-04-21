package com.dayforce.backend.application.dto.sitevisit;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class SiteVisitRequest {

    @NotNull(message = "Visit date and time is required.")
    @Future(message = "Visit must be scheduled in the future.")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime visitDateTime;

    @Size(max = 500, message = "Notes must not exceed 500 characters.")
    private String notes;

    public LocalDateTime getVisitDateTime() { return visitDateTime; }
    public void setVisitDateTime(LocalDateTime visitDateTime) { this.visitDateTime = visitDateTime; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
