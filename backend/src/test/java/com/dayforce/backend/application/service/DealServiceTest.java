package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.deal.DealRequest;
import com.dayforce.backend.application.dto.deal.DealResponse;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.Deal;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.infrastructure.repository.DealRepository;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private UserRepository userRepository;
    @Mock private SiteVisitRepository siteVisitRepository;

    @InjectMocks private DealService dealService;

    private Customer customer;
    private Broker broker;
    private Property availableProperty;

    @BeforeEach
    void setUp() {
        broker = new Broker();
        broker.setBroName("Test Broker");

        customer = new Customer();
        customer.setCustName("Test Customer");

        availableProperty = new Property();
        availableProperty.setStatus(PropertyStatus.AVAILABLE);
        availableProperty.setOfferType(OfferType.SELL);
        availableProperty.setOfferCost(500000.0);
        availableProperty.setBroker(broker);
    }

    // ── createDeal ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createDeal: succeeds when property is AVAILABLE and user is a Customer")
    void createDeal_success() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(availableProperty));

        Deal savedDeal = new Deal();
        savedDeal.setDealCost(500000.0);
        savedDeal.setCustomer(customer);
        savedDeal.setProperty(availableProperty);
        when(dealRepository.save(any(Deal.class))).thenReturn(savedDeal);

        DealResponse response = dealService.createDeal(1L, "customer@test.com", null);

        assertThat(response).isNotNull();
        assertThat(response.getDealCost()).isEqualTo(500000.0);
        verify(propertyRepository).save(availableProperty);
    }

    @Test
    @DisplayName("createDeal: property status transitions to RESERVED for SELL offer type")
    void createDeal_propertyStatusTransitionsToReservedForSell() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(availableProperty));

        Deal savedDeal = new Deal();
        savedDeal.setCustomer(customer);
        savedDeal.setProperty(availableProperty);
        when(dealRepository.save(any(Deal.class))).thenReturn(savedDeal);

        dealService.createDeal(1L, "customer@test.com", null);

        assertThat(availableProperty.getStatus()).isEqualTo(PropertyStatus.RESERVED);
    }

    @Test
    @DisplayName("createDeal: property status transitions to RESERVED for RENT_LONG_TERM offer type")
    void createDeal_propertyStatusTransitionsToReservedForRent() {
        availableProperty.setOfferType(OfferType.RENT_LONG_TERM);

        DealRequest rentalRequest = new DealRequest();
        rentalRequest.setStartDate(java.time.LocalDate.of(2025, 1, 1));
        rentalRequest.setEndDate(java.time.LocalDate.of(2025, 12, 31));

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(availableProperty));

        Deal savedDeal = new Deal();
        savedDeal.setCustomer(customer);
        savedDeal.setProperty(availableProperty);
        when(dealRepository.save(any(Deal.class))).thenReturn(savedDeal);

        dealService.createDeal(1L, "customer@test.com", rentalRequest);

        assertThat(availableProperty.getStatus()).isEqualTo(PropertyStatus.RESERVED);
    }

    @Test
    @DisplayName("createDeal: throws AccessDeniedException when user is not a Customer")
    void createDeal_throwsWhenNonCustomer() {
        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));

        assertThatThrownBy(() -> dealService.createDeal(1L, "broker@test.com", null))
                .isInstanceOf(com.dayforce.backend.comon.exception.AccessDeniedException.class)
                .hasMessageContaining("Customers");
    }

    @Test
    @DisplayName("createDeal: throws IllegalArgumentException when property is not AVAILABLE")
    void createDeal_throwsWhenPropertyNotAvailable() {
        availableProperty.setStatus(PropertyStatus.SOLD);

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(availableProperty));

        assertThatThrownBy(() -> dealService.createDeal(1L, "customer@test.com", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no longer available");
    }

    @Test
    @DisplayName("createDeal: throws IllegalArgumentException when property does not exist")
    void createDeal_throwsWhenPropertyNotFound() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dealService.createDeal(99L, "customer@test.com", null))
                .isInstanceOf(com.dayforce.backend.comon.exception.ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createDeal: customer cannot purchase their own submitted property")
    void createDeal_throwsWhenCustomerBuysOwnProperty() {
        customer.setId(42L);
        availableProperty.setOwner(customer);

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(1L)).thenReturn(Optional.of(availableProperty));

        assertThatThrownBy(() -> dealService.createDeal(1L, "customer@test.com", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot purchase your own property");
    }

    // ── advanceDealStatus ─────────────────────────────────────────────────────

    @Test
    @DisplayName("advanceDealStatus: PENDING deal advances to UNDER_CONTRACT")
    void advanceDeal_pendingToUnderContract() {
        broker.setId(1L);
        availableProperty.setBroker(broker);

        Deal deal = new Deal();
        deal.setStatus(DealStatus.PENDING);
        deal.setCustomer(customer);
        deal.setProperty(availableProperty);

        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));
        when(dealRepository.findById(10L)).thenReturn(Optional.of(deal));
        when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> inv.getArgument(0));

        DealResponse response = dealService.advanceDealStatus(10L, "broker@test.com");

        assertThat(response.getStatus()).isEqualTo(DealStatus.UNDER_CONTRACT);
    }

    @Test
    @DisplayName("advanceDealStatus: UNDER_CONTRACT deal advances to CLOSED")
    void advanceDeal_underContractToClosed() {
        broker.setId(1L);
        availableProperty.setBroker(broker);

        Deal deal = new Deal();
        deal.setStatus(DealStatus.UNDER_CONTRACT);
        deal.setCustomer(customer);
        deal.setProperty(availableProperty);

        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));
        when(dealRepository.findById(11L)).thenReturn(Optional.of(deal));
        when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> inv.getArgument(0));

        DealResponse response = dealService.advanceDealStatus(11L, "broker@test.com");

        assertThat(response.getStatus()).isEqualTo(DealStatus.CLOSED);
    }

    @Test
    @DisplayName("advanceDealStatus: CLOSED deal throws IllegalArgumentException")
    void advanceDeal_throwsWhenAlreadyClosed() {
        broker.setId(1L);
        availableProperty.setBroker(broker);

        Deal deal = new Deal();
        deal.setStatus(DealStatus.CLOSED);
        deal.setCustomer(customer);
        deal.setProperty(availableProperty);

        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));
        when(dealRepository.findById(12L)).thenReturn(Optional.of(deal));

        assertThatThrownBy(() -> dealService.advanceDealStatus(12L, "broker@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already closed");
    }

    @Test
    @DisplayName("advanceDealStatus: throws AccessDeniedException when broker does not own property")
    void advanceDeal_throwsWhenWrongBroker() {
        broker.setId(1L);
        Broker otherBroker = new Broker();
        otherBroker.setId(99L);
        availableProperty.setBroker(otherBroker);

        Deal deal = new Deal();
        deal.setStatus(DealStatus.PENDING);
        deal.setCustomer(customer);
        deal.setProperty(availableProperty);

        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));
        when(dealRepository.findById(13L)).thenReturn(Optional.of(deal));

        assertThatThrownBy(() -> dealService.advanceDealStatus(13L, "broker@test.com"))
                .isInstanceOf(com.dayforce.backend.comon.exception.AccessDeniedException.class)
                .hasMessageContaining("do not manage");
    }

    @Test
    @DisplayName("advanceDealStatus: throws AccessDeniedException when caller is not a Broker")
    void advanceDeal_throwsWhenCallerIsNotBroker() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));

        assertThatThrownBy(() -> dealService.advanceDealStatus(14L, "customer@test.com"))
                .isInstanceOf(com.dayforce.backend.comon.exception.AccessDeniedException.class)
                .hasMessageContaining("brokers");
    }
}
