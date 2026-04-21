package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.sitevisit.SiteVisitRequest;
import com.dayforce.backend.application.dto.sitevisit.SiteVisitResponse;
import com.dayforce.backend.application.dto.sitevisit.VisitStatusUpdateRequest;
import com.dayforce.backend.application.service.SiteVisitService;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.GlobalExceptionHandler;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.enums.VisitStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SiteVisitControllerTest {

    @Mock private SiteVisitService siteVisitService;

    @InjectMocks private SiteVisitController siteVisitController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        mockMvc = MockMvcBuilders
                .standaloneSetup(siteVisitController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ── helper ────────────────────────────────────────────────────────────────

    private SiteVisitResponse sampleResponse(Long id, VisitStatus status) {
        SiteVisitResponse r = new SiteVisitResponse();
        r.setId(id);
        r.setPropertyId(100L);
        r.setPropertyTitle("Sunrise Apartments");
        r.setPropertyCity("Bangalore");
        r.setBrokerName("Test Broker");
        r.setCustomerName("Test Customer");
        r.setVisitDateTime(LocalDateTime.now().plusDays(2));
        r.setStatus(status);
        return r;
    }

    private Authentication auth(String email) {
        Authentication a = mock(Authentication.class);
        when(a.getName()).thenReturn(email);
        return a;
    }

    // ── POST /{propertyId} ────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/site-visits/{propertyId} — returns 201 with visit response")
    void requestVisit_returns201() throws Exception {
        when(siteVisitService.requestVisit(eq(100L), any(SiteVisitRequest.class), eq("customer@test.com")))
                .thenReturn(sampleResponse(1L, VisitStatus.REQUESTED));

        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(3));

        mockMvc.perform(post("/api/site-visits/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .principal(auth("customer@test.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("REQUESTED"));
    }

    @Test
    @DisplayName("POST /api/site-visits/{propertyId} — returns 400 when duplicate active visit")
    void requestVisit_returns400WhenDuplicate() throws Exception {
        when(siteVisitService.requestVisit(eq(100L), any(), eq("customer@test.com")))
                .thenThrow(new IllegalStateException("You already have an active visit request for this property."));

        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(3));

        mockMvc.perform(post("/api/site-visits/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .principal(auth("customer@test.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("You already have an active visit request for this property."));
    }

    @Test
    @DisplayName("POST /api/site-visits/{propertyId} — returns 403 when caller is a Broker")
    void requestVisit_returns403ForBroker() throws Exception {
        when(siteVisitService.requestVisit(eq(100L), any(), eq("broker@test.com")))
                .thenThrow(new AccessDeniedException("Only Customers can schedule site visits."));

        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(3));

        mockMvc.perform(post("/api/site-visits/100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .principal(auth("broker@test.com")))
                .andExpect(status().isForbidden());
    }

    // ── GET /me ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/site-visits/me — returns customer visit list")
    void getMyVisits_returnsList() throws Exception {
        when(siteVisitService.getMyVisits("customer@test.com"))
                .thenReturn(List.of(
                        sampleResponse(1L, VisitStatus.REQUESTED),
                        sampleResponse(2L, VisitStatus.CONFIRMED)));

        mockMvc.perform(get("/api/site-visits/me")
                        .principal(auth("customer@test.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("GET /api/site-visits/me — returns empty list when customer has no visits")
    void getMyVisits_returnsEmptyList() throws Exception {
        when(siteVisitService.getMyVisits("customer@test.com")).thenReturn(List.of());

        mockMvc.perform(get("/api/site-visits/me")
                        .principal(auth("customer@test.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ── DELETE /{visitId} ─────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/site-visits/{visitId} — returns 204 on successful cancel")
    void cancelVisit_returns204() throws Exception {
        doNothing().when(siteVisitService).cancelVisit(5L, "customer@test.com");

        mockMvc.perform(delete("/api/site-visits/5")
                        .principal(auth("customer@test.com")))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/site-visits/{visitId} — returns 404 when visit not found")
    void cancelVisit_returns404WhenNotFound() throws Exception {
        doThrow(new ResourceNotFoundException("Site visit not found"))
                .when(siteVisitService).cancelVisit(999L, "customer@test.com");

        mockMvc.perform(delete("/api/site-visits/999")
                        .principal(auth("customer@test.com")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Site visit not found"));
    }

    @Test
    @DisplayName("DELETE /api/site-visits/{visitId} — returns 400 when visit is already COMPLETED")
    void cancelVisit_returns400ForTerminalVisit() throws Exception {
        doThrow(new IllegalStateException("Cannot cancel a visit that is already completed."))
                .when(siteVisitService).cancelVisit(7L, "customer@test.com");

        mockMvc.perform(delete("/api/site-visits/7")
                        .principal(auth("customer@test.com")))
                .andExpect(status().isBadRequest());
    }

    // ── GET /broker/requests ──────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/site-visits/broker/requests — returns broker visit list")
    void getBrokerVisitRequests_returnsList() throws Exception {
        when(siteVisitService.getBrokerVisitRequests("broker@test.com"))
                .thenReturn(List.of(sampleResponse(10L, VisitStatus.REQUESTED)));

        mockMvc.perform(get("/api/site-visits/broker/requests")
                        .principal(auth("broker@test.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].propertyTitle").value("Sunrise Apartments"));
    }

    @Test
    @DisplayName("GET /api/site-visits/broker/requests — returns 403 when caller is a Customer")
    void getBrokerVisitRequests_returns403ForCustomer() throws Exception {
        when(siteVisitService.getBrokerVisitRequests("customer@test.com"))
                .thenThrow(new AccessDeniedException("Only Brokers can access this resource."));

        mockMvc.perform(get("/api/site-visits/broker/requests")
                        .principal(auth("customer@test.com")))
                .andExpect(status().isForbidden());
    }

    // ── PATCH /{visitId}/status ───────────────────────────────────────────────

    @Test
    @DisplayName("PATCH /api/site-visits/{visitId}/status — broker confirms a visit (200)")
    void updateVisitStatus_confirmsVisit() throws Exception {
        SiteVisitResponse confirmed = sampleResponse(10L, VisitStatus.CONFIRMED);
        when(siteVisitService.updateVisitStatus(eq(10L), any(VisitStatusUpdateRequest.class), eq("broker@test.com")))
                .thenReturn(confirmed);

        mockMvc.perform(patch("/api/site-visits/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}")
                        .principal(auth("broker@test.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("PATCH /api/site-visits/{visitId}/status — returns 400 on invalid transition")
    void updateVisitStatus_returns400OnInvalidTransition() throws Exception {
        when(siteVisitService.updateVisitStatus(eq(10L), any(), eq("broker@test.com")))
                .thenThrow(new IllegalStateException("Cannot transition visit from COMPLETED to CANCELLED."));

        mockMvc.perform(patch("/api/site-visits/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CANCELLED\"}")
                        .principal(auth("broker@test.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot transition visit from COMPLETED to CANCELLED."));
    }

    @Test
    @DisplayName("PATCH /api/site-visits/{visitId}/status — returns 403 when broker doesn't own visit")
    void updateVisitStatus_returns403WhenNotOwner() throws Exception {
        when(siteVisitService.updateVisitStatus(eq(10L), any(), eq("other@test.com")))
                .thenThrow(new AccessDeniedException("You do not have permission to update this visit."));

        mockMvc.perform(patch("/api/site-visits/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}")
                        .principal(auth("other@test.com")))
                .andExpect(status().isForbidden());
    }
}
