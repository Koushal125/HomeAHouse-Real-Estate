package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.sitevisit.SiteVisitRequest;
import com.dayforce.backend.application.dto.sitevisit.SiteVisitResponse;
import com.dayforce.backend.application.dto.sitevisit.VisitStatusUpdateRequest;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.SiteVisit;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.VisitStatus;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.SiteVisitRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SiteVisitServiceTest {

    @Mock private SiteVisitRepository siteVisitRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private SiteVisitService siteVisitService;

    private Customer customer;
    private Broker broker;
    private Property availableProperty;

    @BeforeEach
    void setUp() {
        broker = new Broker();
        broker.setId(10L);
        broker.setBroName("Test Broker");
        broker.setEmail("broker@test.com");

        customer = new Customer();
        customer.setId(1L);
        customer.setEmail("customer@test.com");
        customer.setCustName("Test Customer");

        availableProperty = new Property();
        availableProperty.setPropId(100L);
        availableProperty.setTitle("Sunrise Apartments");
        availableProperty.setCity("Bangalore");
        availableProperty.setStatus(PropertyStatus.AVAILABLE);
        availableProperty.setDeleted(false);
        availableProperty.setBroker(broker);
    }

    // ── requestVisit ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("requestVisit: succeeds for a Customer on an AVAILABLE property")
    void requestVisit_success() {
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(2));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(availableProperty));
        when(siteVisitRepository.existsByCustomer_IdAndProperty_PropIdAndStatusIn(
                any(), any(), any())).thenReturn(false);

        SiteVisit saved = new SiteVisit();
        saved.setId(55L);
        saved.setCustomer(customer);
        saved.setProperty(availableProperty);
        saved.setBroker(broker);
        saved.setVisitDateTime(req.getVisitDateTime());
        saved.setStatus(VisitStatus.REQUESTED);
        when(siteVisitRepository.save(any(SiteVisit.class))).thenReturn(saved);

        SiteVisitResponse response = siteVisitService.requestVisit(100L, req, "customer@test.com");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(55L);
        verify(siteVisitRepository).save(any(SiteVisit.class));
    }

    @Test
    @DisplayName("requestVisit: throws AccessDeniedException when caller is not a Customer")
    void requestVisit_throwsWhenNotCustomer() {
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(1));

        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));

        assertThatThrownBy(() ->
                siteVisitService.requestVisit(100L, req, "broker@test.com"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only Customers");
    }

    @Test
    @DisplayName("requestVisit: throws IllegalArgumentException when property is not AVAILABLE")
    void requestVisit_throwsWhenPropertyNotAvailable() {
        availableProperty.setStatus(PropertyStatus.RESERVED);
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(2));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(availableProperty));

        assertThatThrownBy(() ->
                siteVisitService.requestVisit(100L, req, "customer@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("available");
    }

    @Test
    @DisplayName("requestVisit: throws IllegalArgumentException when property is soft-deleted")
    void requestVisit_throwsWhenPropertyDeleted() {
        availableProperty.setDeleted(true);
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(2));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(availableProperty));

        assertThatThrownBy(() ->
                siteVisitService.requestVisit(100L, req, "customer@test.com"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("requestVisit: throws IllegalArgumentException when visitDateTime is not in the future")
    void requestVisit_throwsWhenDateInPast() {
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now(java.time.ZoneOffset.UTC).minusHours(1));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(availableProperty));

        assertThatThrownBy(() ->
                siteVisitService.requestVisit(100L, req, "customer@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("future");
    }

    @Test
    @DisplayName("requestVisit: throws IllegalStateException when duplicate active visit exists")
    void requestVisit_throwsWhenDuplicateActiveVisit() {
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(3));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(availableProperty));
        when(siteVisitRepository.existsByCustomer_IdAndProperty_PropIdAndStatusIn(
                1L, 100L, List.of(VisitStatus.REQUESTED, VisitStatus.CONFIRMED))).thenReturn(true);

        assertThatThrownBy(() ->
                siteVisitService.requestVisit(100L, req, "customer@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("active visit");
    }

    @Test
    @DisplayName("requestVisit: throws IllegalArgumentException when property has no assigned broker")
    void requestVisit_throwsWhenNoBroker() {
        availableProperty.setBroker(null);
        SiteVisitRequest req = new SiteVisitRequest();
        req.setVisitDateTime(LocalDateTime.now().plusDays(2));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(100L)).thenReturn(Optional.of(availableProperty));

        assertThatThrownBy(() ->
                siteVisitService.requestVisit(100L, req, "customer@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("broker");
    }

    // ── getMyVisits ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyVisits: returns list of visits for the authenticated customer")
    void getMyVisits_returnsCustomerVisits() {
        SiteVisit v1 = buildVisit(1L, VisitStatus.REQUESTED);
        SiteVisit v2 = buildVisit(2L, VisitStatus.CONFIRMED);

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(siteVisitRepository.findByCustomer_IdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(v1, v2));

        List<SiteVisitResponse> result = siteVisitService.getMyVisits("customer@test.com");

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(1).getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("getMyVisits: throws AccessDeniedException when caller is not a Customer")
    void getMyVisits_throwsForNonCustomer() {
        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));

        assertThatThrownBy(() -> siteVisitService.getMyVisits("broker@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── cancelVisit ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelVisit: sets status to CANCELLED for a REQUESTED visit")
    void cancelVisit_cancelsRequestedVisit() {
        SiteVisit visit = buildVisit(10L, VisitStatus.REQUESTED);

        when(siteVisitRepository.findById(10L)).thenReturn(Optional.of(visit));

        siteVisitService.cancelVisit(10L, "customer@test.com");

        assertThat(visit.getStatus()).isEqualTo(VisitStatus.CANCELLED);
        verify(siteVisitRepository).save(visit);
    }

    @Test
    @DisplayName("cancelVisit: sets status to CANCELLED for a CONFIRMED visit")
    void cancelVisit_cancelsConfirmedVisit() {
        SiteVisit visit = buildVisit(11L, VisitStatus.CONFIRMED);

        when(siteVisitRepository.findById(11L)).thenReturn(Optional.of(visit));

        siteVisitService.cancelVisit(11L, "customer@test.com");

        assertThat(visit.getStatus()).isEqualTo(VisitStatus.CANCELLED);
    }

    @Test
    @DisplayName("cancelVisit: throws IllegalStateException when visit is already COMPLETED")
    void cancelVisit_throwsForCompletedVisit() {
        SiteVisit visit = buildVisit(12L, VisitStatus.COMPLETED);

        when(siteVisitRepository.findById(12L)).thenReturn(Optional.of(visit));

        assertThatThrownBy(() -> siteVisitService.cancelVisit(12L, "customer@test.com"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("cancelVisit: throws IllegalStateException when visit is already CANCELLED")
    void cancelVisit_throwsForAlreadyCancelledVisit() {
        SiteVisit visit = buildVisit(13L, VisitStatus.CANCELLED);

        when(siteVisitRepository.findById(13L)).thenReturn(Optional.of(visit));

        assertThatThrownBy(() -> siteVisitService.cancelVisit(13L, "customer@test.com"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("cancelVisit: throws AccessDeniedException when caller does not own the visit")
    void cancelVisit_throwsWhenCallerNotOwner() {
        SiteVisit visit = buildVisit(14L, VisitStatus.REQUESTED);

        when(siteVisitRepository.findById(14L)).thenReturn(Optional.of(visit));

        assertThatThrownBy(() -> siteVisitService.cancelVisit(14L, "other@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── updateVisitStatus (broker state machine) ──────────────────────────────

    @Test
    @DisplayName("updateVisitStatus: REQUESTED → CONFIRMED succeeds")
    void updateVisitStatus_requestedToConfirmed() {
        SiteVisit visit = buildBrokerVisit(20L, VisitStatus.REQUESTED);

        when(siteVisitRepository.findById(20L)).thenReturn(Optional.of(visit));
        when(siteVisitRepository.save(any())).thenReturn(visit);

        VisitStatusUpdateRequest req = statusReq(VisitStatus.CONFIRMED);
        SiteVisitResponse response = siteVisitService.updateVisitStatus(20L, req, "broker@test.com");

        assertThat(visit.getStatus()).isEqualTo(VisitStatus.CONFIRMED);
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("updateVisitStatus: REQUESTED → CANCELLED succeeds")
    void updateVisitStatus_requestedToCancelled() {
        SiteVisit visit = buildBrokerVisit(21L, VisitStatus.REQUESTED);

        when(siteVisitRepository.findById(21L)).thenReturn(Optional.of(visit));
        when(siteVisitRepository.save(any())).thenReturn(visit);

        siteVisitService.updateVisitStatus(21L, statusReq(VisitStatus.CANCELLED), "broker@test.com");

        assertThat(visit.getStatus()).isEqualTo(VisitStatus.CANCELLED);
    }

    @Test
    @DisplayName("updateVisitStatus: CONFIRMED → COMPLETED succeeds")
    void updateVisitStatus_confirmedToCompleted() {
        SiteVisit visit = buildBrokerVisit(22L, VisitStatus.CONFIRMED);

        when(siteVisitRepository.findById(22L)).thenReturn(Optional.of(visit));
        when(siteVisitRepository.save(any())).thenReturn(visit);

        siteVisitService.updateVisitStatus(22L, statusReq(VisitStatus.COMPLETED), "broker@test.com");

        assertThat(visit.getStatus()).isEqualTo(VisitStatus.COMPLETED);
    }

    @Test
    @DisplayName("updateVisitStatus: CONFIRMED → CANCELLED succeeds")
    void updateVisitStatus_confirmedToCancelled() {
        SiteVisit visit = buildBrokerVisit(23L, VisitStatus.CONFIRMED);

        when(siteVisitRepository.findById(23L)).thenReturn(Optional.of(visit));
        when(siteVisitRepository.save(any())).thenReturn(visit);

        siteVisitService.updateVisitStatus(23L, statusReq(VisitStatus.CANCELLED), "broker@test.com");

        assertThat(visit.getStatus()).isEqualTo(VisitStatus.CANCELLED);
    }

    @Test
    @DisplayName("updateVisitStatus: COMPLETED → CANCELLED throws IllegalStateException (terminal state)")
    void updateVisitStatus_completedToCancelledThrows() {
        SiteVisit visit = buildBrokerVisit(24L, VisitStatus.COMPLETED);

        when(siteVisitRepository.findById(24L)).thenReturn(Optional.of(visit));

        assertThatThrownBy(() ->
                siteVisitService.updateVisitStatus(24L, statusReq(VisitStatus.CANCELLED), "broker@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot transition");
    }

    @Test
    @DisplayName("updateVisitStatus: throws AccessDeniedException when caller is not the visit's broker")
    void updateVisitStatus_throwsWhenNotOwningBroker() {
        SiteVisit visit = buildBrokerVisit(25L, VisitStatus.REQUESTED);

        when(siteVisitRepository.findById(25L)).thenReturn(Optional.of(visit));

        assertThatThrownBy(() ->
                siteVisitService.updateVisitStatus(25L, statusReq(VisitStatus.CONFIRMED), "other@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("updateVisitStatus: throws ResourceNotFoundException for unknown visit id")
    void updateVisitStatus_throwsWhenVisitNotFound() {
        when(siteVisitRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                siteVisitService.updateVisitStatus(999L, statusReq(VisitStatus.CONFIRMED), "broker@test.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── getBrokerVisitRequests ────────────────────────────────────────────────

    @Test
    @DisplayName("getBrokerVisitRequests: returns list ordered by visitDateTime")
    void getBrokerVisitRequests_returnsOrderedList() {
        SiteVisit v1 = buildBrokerVisit(30L, VisitStatus.REQUESTED);
        SiteVisit v2 = buildBrokerVisit(31L, VisitStatus.CONFIRMED);

        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));
        when(siteVisitRepository.findByBroker_IdOrderByVisitDateTimeAsc(10L))
                .thenReturn(List.of(v1, v2));

        List<SiteVisitResponse> result = siteVisitService.getBrokerVisitRequests("broker@test.com");

        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("getBrokerVisitRequests: throws AccessDeniedException when caller is not a Broker")
    void getBrokerVisitRequests_throwsForNonBroker() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));

        assertThatThrownBy(() -> siteVisitService.getBrokerVisitRequests("customer@test.com"))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private SiteVisit buildVisit(Long id, VisitStatus status) {
        SiteVisit v = new SiteVisit();
        v.setId(id);
        v.setCustomer(customer);
        v.setProperty(availableProperty);
        v.setBroker(broker);
        v.setVisitDateTime(LocalDateTime.now().plusDays(1));
        v.setStatus(status);
        return v;
    }

    private SiteVisit buildBrokerVisit(Long id, VisitStatus status) {
        SiteVisit v = buildVisit(id, status);
        // broker email matches "broker@test.com" for ownership checks
        return v;
    }

    private VisitStatusUpdateRequest statusReq(VisitStatus status) {
        VisitStatusUpdateRequest req = new VisitStatusUpdateRequest();
        req.setStatus(status);
        return req;
    }
}
