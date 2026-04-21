package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.user.BrokerAnalyticsResponse;
import com.dayforce.backend.application.dto.user.BrokerMetricsResponse;
import com.dayforce.backend.application.dto.user.CustomerMetricsResponse;
import com.dayforce.backend.application.dto.user.PasswordChangeRequest;
import com.dayforce.backend.application.dto.user.UserProfileResponse;
import com.dayforce.backend.application.dto.user.UserProfileUpdateRequest;
import com.dayforce.backend.application.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Users", description = "Profile and metrics endpoints")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current user profile")
    @ApiResponse(responseCode = "200", description = "Profile returned")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getCurrentUserProfile(email));
    }

    @Operation(summary = "Update current user profile")
    @ApiResponse(responseCode = "200", description = "Profile updated")
    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateProfile(email, request));
    }

    @Operation(summary = "Change password")
    @ApiResponse(responseCode = "200", description = "Password changed")
    @ApiResponse(responseCode = "400", description = "Passwords do not match or incorrect current password")
    @PutMapping("/me/password")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody PasswordChangeRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok("Password updated successfully.");
    }

    @Operation(summary = "Get customer metrics", description = "Returns owned properties, rentals, saved count and total deals")
    @ApiResponse(responseCode = "200", description = "Metrics returned")
    @GetMapping("/me/metrics")
    public ResponseEntity<CustomerMetricsResponse> getCustomerMetrics(Authentication authentication) {
        return ResponseEntity.ok(userService.getCustomerMetrics(authentication.getName()));
    }

    @Operation(summary = "Get broker metrics", description = "Returns active listings, closed deals, submissions and revenue")
    @ApiResponse(responseCode = "200", description = "Metrics returned")
    @GetMapping("/me/broker-metrics")
    public ResponseEntity<BrokerMetricsResponse> getBrokerMetrics(Authentication authentication) {
        return ResponseEntity.ok(userService.getBrokerMetrics(authentication.getName()));
    }

    @Operation(summary = "Get broker analytics", description = "Returns view stats, type breakdown and deal funnel for the broker's portfolio")
    @ApiResponse(responseCode = "200", description = "Analytics returned")
    @GetMapping("/me/analytics")
    public ResponseEntity<BrokerAnalyticsResponse> getBrokerAnalytics(Authentication authentication) {
        return ResponseEntity.ok(userService.getBrokerAnalytics(authentication.getName()));
    }
}