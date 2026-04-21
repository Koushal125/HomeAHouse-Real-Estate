package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.property.PropertyResponse;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.application.dto.user.BrokerAnalyticsResponse;
import com.dayforce.backend.application.dto.user.BrokerMetricsResponse;
import com.dayforce.backend.application.dto.user.CustomerMetricsResponse;
import com.dayforce.backend.application.dto.user.PasswordChangeRequest;
import com.dayforce.backend.application.dto.user.UserProfileResponse;
import com.dayforce.backend.application.dto.user.UserProfileUpdateRequest;
import com.dayforce.backend.application.mapper.PropertyMapper;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.Deal;
import com.dayforce.backend.domain.entity.User;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.infrastructure.repository.DealRepository;
import com.dayforce.backend.infrastructure.repository.FavoriteRepository;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import com.dayforce.backend.infrastructure.specification.DealSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final DealRepository dealRepository;
    private final FavoriteRepository favoriteRepository;
    private final PropertyMapper propertyMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String email) {
        // Fetch the base user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Determine the specific name based on the child entity type
        String name = "";
        List<PropertyResponse> userProperties = new ArrayList<>();

        if (user instanceof Customer customer) {
            name = customer.getCustName();
            userProperties = propertyRepository.findByOwner_IdAndIsDeletedFalse(customer.getId())
                    .stream()
                    .map(propertyMapper::toResponse)
                    .collect(Collectors.toList());
        } else if (user instanceof Broker broker) {
            name = broker.getBroName();
            userProperties = propertyRepository.findByBroker_IdAndIsDeletedFalse(broker.getId())
                    .stream()
                    .map(propertyMapper::toResponse)
                    .collect(Collectors.toList());
        }

        // Map entity to DTO
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(name)
                .email(user.getEmail())
                .mobile(user.getMobile())
                .city(user.getCity())
                .role(user.getRole())
                .premiumEnabled(user.isPremiumEnabled())
                .properties(userProperties)
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UserProfileUpdateRequest request)
    {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Update base User fields
        user.setMobile(request.getMobile());
        user.setCity(request.getCity());

        // Update role-specific fields
        if (user instanceof Customer customer) {
            customer.setCustName(request.getName());
        } else if (user instanceof Broker broker) {
            broker.setBroName(request.getName());
        }

        userRepository.save(user);

        return getCurrentUserProfile(email);
    }

    @Transactional
    public void changePassword(String email, PasswordChangeRequest request)
    {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if(!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
        {
            throw new AccessDeniedException("Incorrect current password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AccessDeniedException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public CustomerMetricsResponse getCustomerMetrics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Not a customer account.");
        }

        List<com.dayforce.backend.domain.entity.Property> owned =
                propertyRepository.findByOwner_IdAndIsDeletedFalse(customer.getId());

        int activeRentals = (int) owned.stream()
                .filter(p -> p.getStatus() == PropertyStatus.RENTED)
                .count();

        List<Deal> deals = dealRepository.findAll(DealSpecification.byCustomerId(customer.getId()));

        int savedListings = favoriteRepository.findByCustomer_Id(customer.getId()).size();

        return CustomerMetricsResponse.builder()
                .ownedPropertiesCount(owned.size())
                .activeRentalsCount(activeRentals)
                .savedListingsCount(savedListings)
                .totalDealsCount(deals.size())
                .build();
    }

    @Transactional(readOnly = true)
    public BrokerMetricsResponse getBrokerMetrics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Not a broker account.");
        }

        List<com.dayforce.backend.domain.entity.Property> managed =
                propertyRepository.findByBroker_IdAndIsDeletedFalse(broker.getId());

        int activeListings = (int) managed.stream()
                .filter(p -> p.getStatus() == PropertyStatus.AVAILABLE)
                .count();

        int newSubmissions = (int) managed.stream()
                .filter(p -> p.getStatus() == PropertyStatus.PENDING)
                .count();

        List<Deal> allDeals = dealRepository.findAll(DealSpecification.byBrokerId(broker.getId()));

        int dealsClosed = (int) allDeals.stream()
                .filter(d -> d.getStatus() == DealStatus.CLOSED)
                .count();

        double totalRevenue = allDeals.stream()
                .filter(d -> d.getStatus() == DealStatus.CLOSED)
                .mapToDouble(Deal::getDealCost)
                .sum();

        return BrokerMetricsResponse.builder()
                .activeListingsCount(activeListings)
                .dealsClosedCount(dealsClosed)
                .newSubmissionsCount(newSubmissions)
                .totalRevenueAmount(totalRevenue)
                .build();
    }

    @Transactional(readOnly = true)
    public BrokerAnalyticsResponse getBrokerAnalytics(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Not a broker account.");
        }

        // KPI: total views across all listings
        int totalViews = propertyRepository.sumViewCountByBroker(broker.getId());

        // KPI: revenue from closed deals
        List<Deal> allDeals = dealRepository.findAll(DealSpecification.byBrokerId(broker.getId()));
        double totalRevenue = allDeals.stream()
                .filter(d -> d.getStatus() == DealStatus.CLOSED)
                .mapToDouble(Deal::getDealCost)
                .sum();

        // KPI: active listings
        int activeListings = (int) propertyRepository
                .findByBroker_IdAndIsDeletedFalse(broker.getId()).stream()
                .filter(p -> p.getStatus() == PropertyStatus.AVAILABLE)
                .count();

        // Top 10 properties by view count
        List<BrokerAnalyticsResponse.PropertyViewStat> topViewed = propertyRepository
                .findByBroker_IdAndIsDeletedFalseOrderByViewCountDesc(broker.getId(), PageRequest.of(0, 10))
                .stream()
                .map(p -> BrokerAnalyticsResponse.PropertyViewStat.builder()
                        .propId(p.getPropId())
                        .title(p.getTitle())
                        .viewCount(p.getViewCount())
                        .city(p.getCity())
                        .build())
                .collect(Collectors.toList());

        // Property type breakdown
        Map<String, Long> typeBreakdown = new LinkedHashMap<>();
        for (Object[] row : propertyRepository.countByPropertyTypeForBroker(broker.getId())) {
            typeBreakdown.put(row[0].toString(), (Long) row[1]);
        }

        // Deal counts by status
        long dealsPending      = dealRepository.countByProperty_Broker_IdAndStatus(broker.getId(), DealStatus.PENDING);
        long dealsUnderContract = dealRepository.countByProperty_Broker_IdAndStatus(broker.getId(), DealStatus.UNDER_CONTRACT);
        long dealsClosed       = dealRepository.countByProperty_Broker_IdAndStatus(broker.getId(), DealStatus.CLOSED);

        return BrokerAnalyticsResponse.builder()
                .totalViews(totalViews)
                .totalRevenue(totalRevenue)
                .activeListings(activeListings)
                .topPropertiesByViews(topViewed)
                .propertyTypeBreakdown(typeBreakdown)
                .dealsPending(dealsPending)
                .dealsUnderContract(dealsUnderContract)
                .dealsClosed(dealsClosed)
                .build();
    }
}

