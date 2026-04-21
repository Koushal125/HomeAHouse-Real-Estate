package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.deal.DealRequest;
import com.dayforce.backend.application.dto.deal.DealResponse;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.Deal;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.User;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.infrastructure.repository.DealRepository;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.SiteVisitRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import com.dayforce.backend.infrastructure.specification.DealSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DealService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("dealDate", "dealCost");

    private final DealRepository dealRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final SiteVisitRepository siteVisitRepository;

    @Transactional // Critical: Ensures both the Deal and the Property update happen together
    public DealResponse createDeal(Long propertyId, String userEmail, DealRequest request) {

        // 1. Fetch User and enforce Customer-only access
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only registered Customers can buy or rent properties.");
        }

        // 2. Fetch Property and verify it is available
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (property.isDeleted() || property.getStatus() != PropertyStatus.AVAILABLE) {
            throw new IllegalArgumentException("This property is no longer available.");
        }

        // Prevent a customer from purchasing a property they originally submitted
        if (property.getOwner() != null && property.getOwner().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("You cannot purchase your own property.");
        }

        boolean isRental = property.getOfferType() == OfferType.RENT_LONG_TERM
                || property.getOfferType() == OfferType.RENT_SHORT_TERM;

        // Validate rental dates when required
        if (isRental) {
            if (request == null || request.getStartDate() == null || request.getEndDate() == null) {
                throw new IllegalArgumentException("Start date and end date are required for rental properties.");
            }
            if (!request.getEndDate().isAfter(request.getStartDate())) {
                throw new IllegalArgumentException("End date must be after start date.");
            }
        }

        // 3. Create the Deal
        Deal deal = new Deal();
        deal.setDealDate(LocalDate.now());
        deal.setDealCost(property.getOfferCost());
        deal.setCustomer(customer);
        deal.setProperty(property);
        if (isRental && request != null) {
            deal.setStartDate(request.getStartDate());
            deal.setEndDate(request.getEndDate());
        }

        Deal savedDeal = dealRepository.save(deal);

        log.info("Deal created: id={} customer={} property={} offerType={}",
                savedDeal.getDealId(), customer.getId(), property.getPropId(), property.getOfferType());

        // 4. Reserve the property until the deal is closed
        property.setStatus(PropertyStatus.RESERVED);
        propertyRepository.save(property);
        log.info("Property {} marked RESERVED after deal {} created",
                property.getPropId(), savedDeal.getDealId());

        // 5. Return the mapped DTO
        return mapToDealResponse(savedDeal);
    }
    @Transactional(readOnly = true)
    public Page<DealResponse> getCustomerTransactions(String email, DealStatus status,
                                                      String sortBy, Sort.Direction direction,
                                                      int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only customers have a transaction history.");
        }

        Specification<Deal> spec = DealSpecification.byCustomerId(customer.getId());
        if (status != null) {
            spec = spec.and(DealSpecification.byStatus(status));
        }

        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "dealDate";
        Sort sort = Sort.by(direction != null ? direction : Sort.Direction.DESC, field);
        Pageable pageable = PageRequest.of(page, size, sort);

        return dealRepository.findAll(spec, pageable).map(this::mapToDealResponse);
    }

    // Epic 2: Broker Pipeline Dashboard
    @Transactional(readOnly = true)
    public Page<DealResponse> getBrokerPipeline(String email, DealStatus status,
                                                String sortBy, Sort.Direction direction,
                                                int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only brokers have a deal pipeline.");
        }

        Specification<Deal> spec = DealSpecification.byBrokerId(broker.getId());
        if (status != null) {
            spec = spec.and(DealSpecification.byStatus(status));
        }

        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "dealDate";
        Sort sort = Sort.by(direction != null ? direction : Sort.Direction.DESC, field);
        Pageable pageable = PageRequest.of(page, size, sort);

        return dealRepository.findAll(spec, pageable).map(this::mapToDealResponse);
    }

    // Helper method to keep code DRY (Don't Repeat Yourself)
    private DealResponse mapToDealResponse(Deal deal) {
        return DealResponse.builder()
                .dealId(deal.getDealId())
                .dealDate(deal.getDealDate())
                .propertyId(deal.getProperty().getPropId())
                .propertyTitle(deal.getProperty().getTitle())
                .dealCost(deal.getDealCost())
                .customerName(deal.getCustomer().getCustName())
                .brokerName(deal.getProperty().getBroker() != null ? deal.getProperty().getBroker().getBroName() : null)
                .offerType(deal.getProperty().getOfferType())
                .status(deal.getStatus())
                .startDate(deal.getStartDate())
                .endDate(deal.getEndDate())
                .build();
    }

    /**
     * Advances a deal through the pipeline: PENDING ? UNDER_CONTRACT ? CLOSED.
     * Only the broker who manages the property tied to the deal may call this.
     */
    @Transactional
    public DealResponse advanceDealStatus(Long dealId, String brokerEmail) {
        User user = userRepository.findByEmail(brokerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only brokers can advance deal status.");
        }

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found"));

        // Verify the broker owns the property tied to this deal
        Property property = deal.getProperty();
        if (property.getBroker() == null || !property.getBroker().getId().equals(broker.getId())) {
            throw new AccessDeniedException("You do not manage the property tied to this deal.");
        }

        if (property.isDeleted()) {
            throw new IllegalArgumentException("Cannot advance deal: the associated property has been deleted.");
        }

        // Enforce valid transition: PENDING → UNDER_CONTRACT → CLOSED
        DealStatus current = deal.getStatus();
        DealStatus next = switch (current) {
            case PENDING        -> DealStatus.UNDER_CONTRACT;
            case UNDER_CONTRACT -> DealStatus.CLOSED;
            case CLOSED         -> throw new IllegalArgumentException("This deal is already closed.");
            case REJECTED       -> throw new IllegalArgumentException("This deal has been rejected and cannot be advanced.");
        };

        deal.setStatus(next);
        Deal saved = dealRepository.save(deal);

        // When the deal closes, finalize the property status
        if (next == DealStatus.CLOSED) {
            if (property.getOfferType() == OfferType.SELL) {
                property.setStatus(PropertyStatus.SOLD);
            } else {
                property.setStatus(PropertyStatus.RENTED);
            }
            propertyRepository.save(property);
            log.info("Property {} status set to {} on deal {} closure",
                    property.getPropId(), property.getStatus(), dealId);

            // Cancel any active (REQUESTED / CONFIRMED) site visits for the now-closed property
            siteVisitRepository.cancelActiveVisitsForProperty(property.getPropId());
            log.info("Active site visits cancelled for closed property {}", property.getPropId());
        }

        log.info("Deal {} advanced from {} to {} by broker {}", dealId, current, next, broker.getId());
        return mapToDealResponse(saved);
    }

    /**
     * Rejects a PENDING deal. Only the broker who manages the property may reject it.
     * The property is restored to AVAILABLE so other customers can purchase it.
     */
    @Transactional
    public DealResponse rejectDeal(Long dealId, String brokerEmail) {
        User user = userRepository.findByEmail(brokerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only brokers can reject deals.");
        }

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found"));

        Property property = deal.getProperty();
        if (property.getBroker() == null || !property.getBroker().getId().equals(broker.getId())) {
            throw new AccessDeniedException("You do not manage the property tied to this deal.");
        }

        if (deal.getStatus() != DealStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING deals can be rejected.");
        }

        deal.setStatus(DealStatus.REJECTED);
        Deal saved = dealRepository.save(deal);

        // Restore property to AVAILABLE so other customers can make offers
        property.setStatus(PropertyStatus.AVAILABLE);
        propertyRepository.save(property);

        log.info("Deal {} rejected by broker {}, property {} restored to AVAILABLE",
                dealId, broker.getId(), property.getPropId());

        return mapToDealResponse(saved);
    }

    /**
     * Returns the active (non-closed) deal for a given property, or null if none exists.
     * Only the deal's customer or the property's managing broker may view the deal details.
     * Used by the property detail page to show deal progression.
     */
    @Transactional(readOnly = true)
    public DealResponse getDealForProperty(Long propertyId, String callerEmail) {
        return dealRepository.findFirstByProperty_PropIdOrderByDealIdDesc(propertyId)
                .map(deal -> {
                    String customerEmail = deal.getCustomer().getEmail();
                    Broker broker = deal.getProperty().getBroker();
                    String brokerEmail = broker != null ? broker.getEmail() : null;
                    if (!callerEmail.equals(customerEmail) && !callerEmail.equals(brokerEmail)) {
                        throw new AccessDeniedException("You are not authorised to view this deal.");
                    }
                    return mapToDealResponse(deal);
                })
                .orElse(null);
    }
}

