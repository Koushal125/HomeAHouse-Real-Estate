package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.sitevisit.SiteVisitRequest;
import com.dayforce.backend.application.dto.sitevisit.SiteVisitResponse;
import com.dayforce.backend.application.dto.sitevisit.VisitStatusUpdateRequest;
import com.dayforce.backend.application.service.SiteVisitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/site-visits")
@RequiredArgsConstructor
public class SiteVisitController {

    private final SiteVisitService siteVisitService;

    /** Customer: request a site visit for a given property. */
    @PostMapping("/{propertyId}")
    public ResponseEntity<SiteVisitResponse> requestVisit(
            @PathVariable Long propertyId,
            @Valid @RequestBody SiteVisitRequest request,
            Authentication authentication) {
        return new ResponseEntity<>(
                siteVisitService.requestVisit(propertyId, request, authentication.getName()),
                HttpStatus.CREATED);
    }

    /** Customer: list all of their own visit requests. */
    @GetMapping("/me")
    public ResponseEntity<List<SiteVisitResponse>> getMyVisits(Authentication authentication) {
        return ResponseEntity.ok(siteVisitService.getMyVisits(authentication.getName()));
    }

    /** Customer: cancel a REQUESTED or CONFIRMED visit. */
    @DeleteMapping("/{visitId}")
    public ResponseEntity<Void> cancelVisit(
            @PathVariable Long visitId,
            Authentication authentication) {
        siteVisitService.cancelVisit(visitId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /** Broker: list all visit requests across their properties. */
    @GetMapping("/broker/requests")
    public ResponseEntity<List<SiteVisitResponse>> getBrokerVisitRequests(Authentication authentication) {
        return ResponseEntity.ok(siteVisitService.getBrokerVisitRequests(authentication.getName()));
    }

    /** Broker: update the status of a visit (confirm / complete / cancel). */
    @PatchMapping("/{visitId}/status")
    public ResponseEntity<SiteVisitResponse> updateVisitStatus(
            @PathVariable Long visitId,
            @Valid @RequestBody VisitStatusUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                siteVisitService.updateVisitStatus(visitId, request, authentication.getName()));
    }
}
