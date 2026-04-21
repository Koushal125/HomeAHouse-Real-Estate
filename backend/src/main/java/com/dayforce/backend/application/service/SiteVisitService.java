package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.sitevisit.SiteVisitRequest;
import com.dayforce.backend.application.dto.sitevisit.SiteVisitResponse;
import com.dayforce.backend.application.dto.sitevisit.VisitStatusUpdateRequest;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.*;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.VisitStatus;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.SiteVisitRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SiteVisitService {

    private final SiteVisitRepository siteVisitRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    /** Customer requests a site visit for an AVAILABLE property. */
    @Transactional
    public SiteVisitResponse requestVisit(Long propertyId, SiteVisitRequest request, String customerEmail) {
        User user = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only Customers can schedule site visits.");
        }

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (property.isDeleted() || property.getStatus() != PropertyStatus.AVAILABLE) {
            throw new IllegalArgumentException("Site visits can only be requested for available properties.");
        }

        if (property.getBroker() == null) {
            throw new IllegalArgumentException("This property does not have an assigned broker yet.");
        }

        // Belt-and-suspenders: verify future date in UTC (annotation already validates, but guard here too)
        if (request.getVisitDateTime() == null || !request.getVisitDateTime().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new IllegalArgumentException("Visit date and time must be in the future.");
        }

        // Block duplicate active visits for the same customer + property
        boolean hasActiveVisit = siteVisitRepository.existsByCustomer_IdAndProperty_PropIdAndStatusIn(
                customer.getId(), propertyId, List.of(VisitStatus.REQUESTED, VisitStatus.CONFIRMED));
        if (hasActiveVisit) {
            throw new IllegalStateException("You already have an active visit request for this property.");
        }

        SiteVisit visit = new SiteVisit();
        visit.setCustomer(customer);
        visit.setProperty(property);
        visit.setBroker(property.getBroker());
        visit.setVisitDateTime(request.getVisitDateTime());
        visit.setNotes(request.getNotes());

        SiteVisit saved = siteVisitRepository.save(visit);
        log.info("Site visit requested: id={} by customer={} for property={}", saved.getId(), customerEmail, propertyId);
        return toResponse(saved);
    }

    /** Customer views their own visit history, newest first. */
    @Transactional(readOnly = true)
    public List<SiteVisitResponse> getMyVisits(String customerEmail) {
        User user = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only Customers can access this resource.");
        }

        return siteVisitRepository.findByCustomer_IdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /** Customer cancels a REQUESTED or CONFIRMED visit. */
    @Transactional
    public void cancelVisit(Long visitId, String customerEmail) {
        SiteVisit visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Site visit not found"));

        if (!visit.getCustomer().getEmail().equals(customerEmail)) {
            throw new AccessDeniedException("You do not have permission to cancel this visit.");
        }

        if (visit.getStatus() == VisitStatus.COMPLETED || visit.getStatus() == VisitStatus.CANCELLED) {
            throw new IllegalStateException("Cannot cancel a visit that is already " + visit.getStatus().name().toLowerCase() + ".");
        }

        visit.setStatus(VisitStatus.CANCELLED);
        siteVisitRepository.save(visit);
        log.info("Site visit cancelled: id={} by customer={}", visitId, customerEmail);
    }

    /** Broker views all visit requests for their properties, ordered by scheduled time. */
    @Transactional(readOnly = true)
    public List<SiteVisitResponse> getBrokerVisitRequests(String brokerEmail) {
        User user = userRepository.findByEmail(brokerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only Brokers can access this resource.");
        }

        return siteVisitRepository.findByBroker_IdOrderByVisitDateTimeAsc(broker.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Broker updates a visit status.
     * Allowed transitions:
     *   REQUESTED  → CONFIRMED | CANCELLED
     *   CONFIRMED  → COMPLETED | CANCELLED
     *   COMPLETED and CANCELLED are terminal.
     */
    @Transactional
    public SiteVisitResponse updateVisitStatus(Long visitId, VisitStatusUpdateRequest request, String brokerEmail) {
        SiteVisit visit = siteVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("Site visit not found"));

        if (!visit.getBroker().getEmail().equals(brokerEmail)) {
            throw new AccessDeniedException("You do not have permission to update this visit.");
        }

        VisitStatus current = visit.getStatus();
        VisitStatus next = request.getStatus();

        boolean validTransition =
                (current == VisitStatus.REQUESTED && (next == VisitStatus.CONFIRMED || next == VisitStatus.CANCELLED)) ||
                (current == VisitStatus.CONFIRMED  && (next == VisitStatus.COMPLETED || next == VisitStatus.CANCELLED));

        if (!validTransition) {
            throw new IllegalStateException(
                    "Cannot transition visit from " + current.name() + " to " + next.name() + ".");
        }

        visit.setStatus(next);
        SiteVisit updated = siteVisitRepository.save(visit);
        log.info("Site visit {} updated: {} → {} by broker={}", visitId, current, next, brokerEmail);
        return toResponse(updated);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private SiteVisitResponse toResponse(SiteVisit visit) {
        SiteVisitResponse dto = new SiteVisitResponse();
        dto.setId(visit.getId());
        dto.setPropertyId(visit.getProperty().getPropId());
        dto.setPropertyTitle(visit.getProperty().getTitle());
        dto.setPropertyCity(visit.getProperty().getCity());
        dto.setBrokerName(visit.getBroker() != null ? visit.getBroker().getBroName() : null);
        dto.setCustomerName(visit.getCustomer() != null ? visit.getCustomer().getCustName() : null);
        dto.setVisitDateTime(visit.getVisitDateTime());
        dto.setStatus(visit.getStatus());
        dto.setNotes(visit.getNotes());
        dto.setCreatedAt(visit.getCreatedAt());
        return dto;
    }
}
