package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.deal.DealRequest;
import com.dayforce.backend.application.dto.deal.DealResponse;
import com.dayforce.backend.application.service.DealService;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Deals", description = "Deal creation, transaction history, and broker pipeline")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
public class DealController {

    private final DealService dealService;

    @Operation(summary = "Create a deal on a property", description = "Customer initiates a purchase or lease on an AVAILABLE property")
    @ApiResponse(responseCode = "201", description = "Deal created")
    @ApiResponse(responseCode = "400", description = "Property not available")
    @ApiResponse(responseCode = "403", description = "Only customers can create deals")
    @PostMapping("/{propertyId}")
    public ResponseEntity<DealResponse> makeDeal(
            @PathVariable Long propertyId,
            @RequestBody(required = false) DealRequest request,
            Authentication authentication) {

        String customerEmail = authentication.getName();
        DealResponse deal = dealService.createDeal(propertyId, customerEmail, request);

        return new ResponseEntity<>(deal, HttpStatus.CREATED);
    }

    @Operation(summary = "Get my transactions", description = "Returns deals for the authenticated customer with optional filter and sort")
    @ApiResponse(responseCode = "200", description = "Transactions returned")
    @GetMapping("/me/transactions")
    public ResponseEntity<Page<DealResponse>> getMyTransactions(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "dealDate") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        DealStatus dealStatus = parseStatus(status);
        Sort.Direction sortDir = parseDirection(direction);
        return ResponseEntity.ok(
                dealService.getCustomerTransactions(authentication.getName(), dealStatus, sortBy, sortDir, page, size));
    }

    @Operation(summary = "Get broker deal pipeline", description = "Returns all deals for properties managed by the authenticated broker")
    @ApiResponse(responseCode = "200", description = "Pipeline returned")
    @GetMapping("/me/pipeline")
    public ResponseEntity<Page<DealResponse>> getBrokerPipeline(
            Authentication authentication,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "dealDate") String sortBy,
            @RequestParam(required = false, defaultValue = "DESC") String direction,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        DealStatus dealStatus = parseStatus(status);
        Sort.Direction sortDir = parseDirection(direction);
        return ResponseEntity.ok(
                dealService.getBrokerPipeline(authentication.getName(), dealStatus, sortBy, sortDir, page, size));
    }

    @Operation(
        summary = "Advance a deal to the next stage",
        description = "Broker-only. Moves PENDING → UNDER_CONTRACT → CLOSED. " +
                      "The broker must manage the property tied to the deal.")
    @ApiResponse(responseCode = "200", description = "Deal status advanced")
    @ApiResponse(responseCode = "400", description = "Deal is already closed")
    @ApiResponse(responseCode = "403", description = "Not the managing broker")
    @ApiResponse(responseCode = "404", description = "Deal not found")
    @PatchMapping("/{dealId}/advance")
    public ResponseEntity<DealResponse> advanceDeal(
            @PathVariable Long dealId,
            Authentication authentication) {

        DealResponse updated = dealService.advanceDealStatus(dealId, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @Operation(
        summary = "Reject a pending deal",
        description = "Broker-only. Rejects a PENDING deal and restores the property to AVAILABLE.")
    @ApiResponse(responseCode = "200", description = "Deal rejected")
    @ApiResponse(responseCode = "400", description = "Deal is not in PENDING state")
    @ApiResponse(responseCode = "403", description = "Not the managing broker")
    @ApiResponse(responseCode = "404", description = "Deal not found")
    @PatchMapping("/{dealId}/reject")
    public ResponseEntity<DealResponse> rejectDeal(
            @PathVariable Long dealId,
            Authentication authentication) {

        DealResponse updated = dealService.rejectDeal(dealId, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @Operation(summary = "Get the latest deal for a property",
               description = "Returns the most recent deal linked to a property, regardless of status. Useful for showing deal stage on property detail.")
    @ApiResponse(responseCode = "200", description = "Deal returned, or null if none exists")
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<DealResponse> getDealForProperty(
            @PathVariable Long propertyId,
            Authentication authentication) {
        DealResponse deal = dealService.getDealForProperty(propertyId, authentication.getName());
        if (deal == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(deal);
    }

    private DealStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try { return DealStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }

    private Sort.Direction parseDirection(String direction) {
        try { return Sort.Direction.valueOf(direction.toUpperCase()); }
        catch (Exception e) { return Sort.Direction.DESC; }
    }
}