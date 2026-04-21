package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.PropertyCriteria;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.application.dto.property.PropertyRequest;
import com.dayforce.backend.application.dto.property.PropertyResponse;
import com.dayforce.backend.application.dto.property.PropertyStatusUpdateRequest;
import com.dayforce.backend.application.mapper.PropertyMapper;
import com.dayforce.backend.domain.entity.*;
import com.dayforce.backend.domain.entity.enums.AmenityType;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import com.dayforce.backend.infrastructure.repository.BrokerRepository;
import com.dayforce.backend.infrastructure.repository.CustomerRepository;
import com.dayforce.backend.infrastructure.repository.DealRepository;
import com.dayforce.backend.infrastructure.repository.FavoriteRepository;
import com.dayforce.backend.infrastructure.repository.PropertyImageRepository;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.PropertyViewRepository;
import com.dayforce.backend.infrastructure.repository.SiteVisitRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import com.dayforce.backend.infrastructure.specification.PropertySpecification;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Expression;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyMapper propertyMapper;
    private final BrokerRepository brokerRepository;
    private final PropertyImageRepository propertyImageRepository;
    private final ImageStorageService imageStorageService;
    private final ProximityService proximityService;
    private final DealRepository dealRepository;
    private final PropertyViewRepository propertyViewRepository;
    private final CustomerRepository customerRepository;
    private final SiteVisitRepository siteVisitRepository;
    private final FavoriteRepository favoriteRepository;

    @Transactional
    public PropertyResponse createProperty(PropertyRequest request, String userEmail) {
        // 1. Fetch user and validate broker role
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only Brokers can create properties.");
        }

        // 2. Validate all three amenity types are present
        validateAmenities(request);

        // 3. Map and Save [cite: 695-698]
        Property property = propertyMapper.toEntity(request, broker);
        applyCoordinates(property, request);
        Property savedProperty = propertyRepository.save(property);
        log.info("Property created: id={} by broker={}", savedProperty.getPropId(), broker.getId());

        // 4. Return DTO [cite: 699]
        return propertyMapper.toResponse(savedProperty);
    }

    @Transactional
    public PropertyResponse updateProperty(Long propId, PropertyRequest request, String userEmail) {
        Property property = propertyRepository.findById(propId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        // Validate Ownership
        if (!property.getBroker().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You do not have permission to edit this property.");
        }

        // Validate all three amenity types are present
        validateAmenities(request);

        // Update allowed fields [cite: 706]
        property.setTitle(request.getTitle());
        property.setConfiguration(request.getConfiguration());
        property.setPropertyType(request.getPropertyType());
        property.setOfferType(request.getOfferType());
        property.setOfferCost(request.getOfferCost());
        property.setAreaSqft(request.getAreaSqft());
        property.setAreaUnit(request.getAreaUnit());
        property.setBedrooms(request.getBedrooms());
        property.setBathrooms(request.getBathrooms());
        property.setFurnished(request.isFurnished());
        property.setStreetName(request.getStreetName());
        property.setAreaName(request.getAreaName());
        property.setLandmark(request.getLandmark());
        property.setLocality(request.getLocality());
        property.setCity(request.getCity());

        // Replace amenities
        propertyMapper.attachAmenities(request, property);

        applyCoordinates(property, request);
        Property updatedProperty = propertyRepository.save(property);
        return propertyMapper.toResponse(updatedProperty);
    }

    @Transactional
    public void deleteProperty(Long propId, String userEmail) {
        Property property = propertyRepository.findById(propId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        // Verify broker authorization [cite: 715]
        if (!property.getBroker().getEmail().equals(userEmail)) {
            throw new AccessDeniedException("You do not have permission to delete this property.");
        }

        // Prevent soft-delete if any active (non-CLOSED) deals exist
        if (dealRepository.existsByProperty_PropIdAndStatusNot(propId, DealStatus.CLOSED)) {
            throw new IllegalArgumentException("Cannot delete this property: it has one or more active deals. Please wait until all deals are closed.");
        }

        // Cancel any active (REQUESTED / CONFIRMED) site visits for this property
        siteVisitRepository.cancelActiveVisitsForProperty(propId);

        // Mark deleted (Soft Delete) [cite: 716]
        property.setDeleted(true);
        propertyRepository.save(property);
        log.info("Property soft-deleted: id={} by broker={}", propId, userEmail);
    }

    // Public/Customer Methods
    public PropertyResponse getPropertyDetails(Long propId, String userEmail) {
        Property property = propertyRepository.findById(propId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (property.isDeleted()) {
            throw new IllegalArgumentException("Property is no longer available.");
        }

        // Increment view count atomically (fire-and-forget; does not block the response)
        propertyRepository.incrementViewCount(propId);

        // Record view history for authenticated customers (fire-and-forget)
        try {
            recordPropertyView(propId, userEmail, property);
        } catch (Exception e) {
            log.warn("Failed to record property view for user={}: {}", userEmail, e.getMessage());
        }

        return propertyMapper.toResponse(property);
    }

    /**
     * Upserts a PropertyView row for the given customer.
     * If the customer already viewed the property, updates viewedAt to now.
     */
    private void recordPropertyView(Long propId, String userEmail, Property property) {
        if (userEmail == null) return;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (!(user instanceof Customer customer)) return;

        propertyViewRepository.findByCustomer_IdAndProperty_PropId(customer.getId(), propId)
                .ifPresentOrElse(
                        existing -> {
                            existing.setViewedAt(LocalDateTime.now());
                            propertyViewRepository.save(existing);
                        },
                        () -> {
                            PropertyView view = new PropertyView();
                            view.setCustomer(customer);
                            view.setProperty(property);
                            view.setViewedAt(LocalDateTime.now());
                            propertyViewRepository.save(view);
                        }
                );
    }

    /** Returns the last 10 properties the customer has viewed (most recent first). */
    @Transactional(readOnly = true)
    public List<PropertyResponse> getRecentlyViewed(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only Customers can access recently viewed properties.");
        }
        return propertyViewRepository
                .findRecentByCustomerId(customer.getId(), PageRequest.of(0, 10))
                .stream()
                .map(pv -> propertyMapper.toResponse(pv.getProperty()))
                .collect(Collectors.toList());
    }

    /**
     * Hybrid recommendation engine:
     * 1. If the customer has favorites, infer their preferred city + property type (mode).
     *    Return AVAILABLE properties matching city OR type, excluding already-favorited ones.
     * 2. Fall back to top-8 by view count if no favorites exist or result set is too small.
     */
    @Transactional(readOnly = true)
    public List<PropertyResponse> getRecommendedProperties(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Favorite> favorites = Collections.emptyList();
        if (user instanceof Customer customer) {
            favorites = favoriteRepository.findByCustomer_Id(customer.getId());
        }

        List<Long> excludeIds = favorites.stream()
                .map(f -> f.getProperty().getPropId())
                .collect(Collectors.toList());
        // Always exclude at least one dummy id so the NOT IN clause is valid SQL
        if (excludeIds.isEmpty()) excludeIds = List.of(-1L);

        if (!favorites.isEmpty()) {
            // Find mode city
            String preferredCity = favorites.stream()
                    .map(f -> f.getProperty().getCity())
                    .filter(c -> c != null && !c.isBlank())
                    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("");

            // Find mode property type
            PropertyType preferredType = favorites.stream()
                    .map(f -> f.getProperty().getPropertyType())
                    .filter(t -> t != null)
                    .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);

            if (preferredType != null && !preferredCity.isBlank()) {
                List<Property> results = propertyRepository.findRecommendedByPreferences(
                        PropertyStatus.AVAILABLE, preferredCity, preferredType, excludeIds,
                        PageRequest.of(0, 8));
                if (results.size() >= 2) {
                    return results.stream().map(propertyMapper::toResponse).collect(Collectors.toList());
                }
            }
        }

        // Popularity fallback
        return propertyRepository.findPopularExcluding(
                        PropertyStatus.AVAILABLE, excludeIds, PageRequest.of(0, 8))
                .stream()
                .map(propertyMapper::toResponse)
                .collect(Collectors.toList());
    }

    public Page<PropertyResponse> listAllActiveProperties(int page, int size, Double userLat, Double userLon) {
        Specification<Property> spec = (root, query, cb) ->
                cb.and(
                    cb.equal(root.get("status"), PropertyStatus.AVAILABLE),
                    cb.isFalse(root.get("isDeleted"))
                );
        return executeWithSort(spec, page, size, userLat, userLon);
    }

    // Dynamic Search using Criteria [cite: 743-763]
    public Page<PropertyResponse> searchProperties(PropertyCriteria criteria) {
        Specification<Property> spec = PropertySpecification.getPropertiesByCriteria(criteria);
        return executeWithSort(spec, criteria.getPage(), criteria.getSize(),
                criteria.getUserLat(), criteria.getUserLon());
    }

    /**
     * Executes a property query with proximity-based ordering when user coordinates are supplied,
     * falling back to propId DESC (newest first) when they are not.
     *
     * Proximity ordering uses MySQL's ST_Distance_Sphere function.
     * Properties with null lat/lon coordinates are pushed to the end via COALESCE.
     */
    private Page<PropertyResponse> executeWithSort(Specification<Property> spec,
                                                   int page, int size,
                                                   Double userLat, Double userLon) {
        if (userLat != null && userLon != null) {
            final double lat = userLat;
            final double lon = userLon;
            Specification<Property> withDistanceOrder = (root, query, cb) -> {
                if (!Long.class.equals(query.getResultType())) {
                    // Build ST_Distance_Sphere(POINT(prop.lon, prop.lat), POINT(userLon, userLat))
                    Expression<?> propPoint = cb.function("POINT", Object.class,
                            root.get("longitude"), root.get("latitude"));
                    Expression<?> userPoint = cb.function("POINT", Object.class,
                            cb.literal(lon), cb.literal(lat));
                    Expression<Double> distance = cb.function(
                            "ST_Distance_Sphere", Double.class, propPoint, userPoint);
                    // COALESCE so properties with null coordinates sort last
                    Expression<Double> safeDistance = cb.coalesce(distance, 999_999_999.0);
                    query.orderBy(cb.asc(safeDistance));
                }
                return spec.toPredicate(root, query, cb);
            };
            return propertyRepository.findAll(withDistanceOrder, PageRequest.of(page, size))
                    .map(propertyMapper::toResponse);
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "propId"));
        return propertyRepository.findAll(spec, pageable).map(propertyMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getManagedProperties(String email)
    {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!(user instanceof Broker broker))
        {
            throw new AccessDeniedException("Only Brokers can get properties.");
        }

        return propertyRepository.findByBroker_IdAndIsDeletedFalse(broker.getId())
                .stream()
                .map(propertyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getDeletedManagedProperties(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only Brokers can access this resource.");
        }
        return propertyRepository.findByBroker_IdAndIsDeletedTrue(broker.getId())
                .stream()
                .map(propertyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PropertyResponse submitProperty(PropertyRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only Customers can submit properties for review.");
        }

        validateAmenities(request);

        // Use the new overloaded mapper method
        Property property = propertyMapper.toEntity(request, customer);
        applyCoordinates(property, request);
        Property savedProperty = propertyRepository.save(property);

        return propertyMapper.toResponse(savedProperty);
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getMySubmissions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only Customers can access their submissions.");
        }

        return propertyRepository.findByOwner_IdAndIsDeletedFalse(customer.getId())
                .stream()
                .map(propertyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> getPendingSubmissions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker)) {
            throw new AccessDeniedException("Only Brokers can view pending submissions.");
        }

        // Fetch properties that are PENDING
        return propertyRepository.findByStatusAndIsDeletedFalse(PropertyStatus.PENDING)
                .stream()
                .map(propertyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PropertyResponse updatePropertyStatus(Long propId, PropertyStatusUpdateRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!(user instanceof Broker broker)) {
            throw new AccessDeniedException("Only Brokers can approve or reject properties.");
        }

        Property property = propertyRepository.findById(propId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (property.getStatus() != PropertyStatus.PENDING) {
            throw new IllegalStateException("You can only change the status of PENDING properties.");
        }

        // --- THE CONSENSUS ENGINE ---

        if (request.getStatus() == PropertyStatus.APPROVED) {
            // SCENARIO A: A Broker likes it and claims it!
            property.setStatus(PropertyStatus.AVAILABLE);
            property.setBroker(broker);

        } else if (request.getStatus() == PropertyStatus.REJECTED) {
            // SCENARIO B: A Broker rejects it.
            if (request.getReason() == null || request.getReason().isBlank()) {
                throw new IllegalArgumentException("You must provide a reason when rejecting a property.");
            }

            // 1. Check if this broker already rejected it (prevent spam clicking)
            boolean alreadyRejected = property.getRejections().stream()
                    .anyMatch(r -> r.getBroker().getId().equals(broker.getId()));

            if (alreadyRejected) {
                throw new IllegalStateException("You have already rejected this property.");
            }

            // 2. Record the rejection
            PropertyRejection rejection = new PropertyRejection();
            rejection.setProperty(property);
            rejection.setBroker(broker);
            rejection.setReason(request.getReason());
            property.getRejections().add(rejection);

            // 3. The Consensus Check: Have ALL brokers rejected it?
            long totalBrokersInSystem = brokerRepository.count();
            if (property.getRejections().size() >= totalBrokersInSystem) {
                // The absolute last broker just rejected it. Kill the listing.
                property.setStatus(PropertyStatus.REJECTED);
            } else {
                // Others might still approve it. Keep it PENDING.
                // Note: We don't change the status here!
            }
        }

        Property updatedProperty = propertyRepository.save(property);
        return propertyMapper.toResponse(updatedProperty);
    }

    // ── Image upload / retrieval ─────────────────────────────────────────────

    @Transactional
    public List<String> uploadImages(Long propId, MultipartFile[] files, String brokerEmail) {
        Property property = propertyRepository.findById(propId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (property.getBroker() == null || !property.getBroker().getEmail().equals(brokerEmail)) {
            throw new AccessDeniedException("You do not have permission to upload images for this property.");
        }

        List<String> urls = new java.util.ArrayList<>();
        int nextOrder = propertyImageRepository.findByProperty_PropIdOrderByDisplayOrderAsc(propId).size();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;
            String url = imageStorageService.store(file);
            PropertyImage img = new PropertyImage();
            img.setProperty(property);
            img.setImageUrl(url);
            img.setDisplayOrder(nextOrder++);
            propertyImageRepository.save(img);
            urls.add(url);
        }

        return urls;
    }

    @Transactional(readOnly = true)
    public List<String> getPropertyImageUrls(Long propId) {
        return propertyImageRepository
                .findByProperty_PropIdOrderByDisplayOrderAsc(propId)
                .stream()
                .map(PropertyImage::getImageUrl)
                .collect(Collectors.toList());
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Populates lat/lon on a property using Nominatim geocoding.
     * If the request already carries explicit coordinates those take priority.
     * Geocoding failures are swallowed so they never block the save.
     */
    private void applyCoordinates(Property property, PropertyRequest request) {
        if (request.getLatitude() != null && request.getLongitude() != null) {
            property.setLatitude(request.getLatitude());
            property.setLongitude(request.getLongitude());
            return;
        }
        try {
            Optional<double[]> coords = proximityService.geocodeAddress(
                    request.getStreetName(), request.getAreaName(),
                    request.getLandmark(), request.getLocality(), request.getCity());
            coords.ifPresent(c -> {
                property.setLatitude(c[0]);
                property.setLongitude(c[1]);
            });
        } catch (Exception e) {
            log.warn("Geocoding failed for property '{}' — coordinates will be null: {}",
                    property.getTitle(), e.getMessage());
        }
    }

    /**
     * Validates that the broker has provided at least one amenity for each of
     * the three mandatory types: HOSPITAL, SCHOOL, POLICE_STATION.
     */
    private void validateAmenities(PropertyRequest request) {
        if (request.getNearbyAmenities() == null || request.getNearbyAmenities().isEmpty()) {
            throw new IllegalArgumentException(
                    "You must provide nearby amenities (hospital, school, and police station) before submitting this listing.");
        }
        Set<AmenityType> provided = request.getNearbyAmenities().stream()
                .map(a -> a.getType())
                .collect(Collectors.toSet());
        Set<AmenityType> missing = EnumSet.complementOf(EnumSet.copyOf(provided));
        if (!missing.isEmpty()) {
            String names = missing.stream()
                    .map(t -> t.name().replace('_', ' ').toLowerCase())
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException(
                    "Missing required amenity details for: " + names + ". Please provide the name, address, and distance.");
        }
    }
}


