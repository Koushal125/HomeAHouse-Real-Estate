package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {
    // Find properties owned by a specific customer
    List<Property> findByOwner_Id(Long ownerId);

    // Find non-deleted properties submitted by a specific customer
    List<Property> findByOwner_IdAndIsDeletedFalse(Long ownerId);

    // Find properties managed by a specific broker (excluding soft-deleted)
    List<Property> findByBroker_IdAndIsDeletedFalse(Long brokerId);

    // Find soft-deleted properties for a specific broker
    List<Property> findByBroker_IdAndIsDeletedTrue(Long brokerId);

    // Find all active properties
    List<Property> findByStatusAndIsDeletedFalse(PropertyStatus status);

    // Atomically increment view count — runs in its own transaction
    @Modifying
    @Transactional
    @Query("UPDATE Property p SET p.viewCount = p.viewCount + 1 WHERE p.propId = :id")
    void incrementViewCount(@Param("id") Long id);

    // Top-N properties for a broker ordered by most-viewed (for analytics)
    List<Property> findByBroker_IdAndIsDeletedFalseOrderByViewCountDesc(Long brokerId, Pageable pageable);

    // Property-type breakdown for a broker (for analytics pie chart)
    @Query("SELECT p.propertyType, COUNT(p) FROM Property p WHERE p.broker.id = :brokerId AND p.isDeleted = false GROUP BY p.propertyType")
    List<Object[]> countByPropertyTypeForBroker(@Param("brokerId") Long brokerId);

    // Total view count sum for all of a broker’s listings (for analytics KPI)
    @Query("SELECT COALESCE(SUM(p.viewCount), 0) FROM Property p WHERE p.broker.id = :brokerId AND p.isDeleted = false")
    int sumViewCountByBroker(@Param("brokerId") Long brokerId);
    // ── Recommendation queries ────────────────────────────────────────────────

    /**
     * Favorites-based recommendation: returns AVAILABLE non-deleted properties
     * that match the customer's preferred city or property type, ordered by popularity.
     * Excludes properties the customer already has in their favorites.
     */
    @Query("SELECT p FROM Property p WHERE p.status = :status AND p.isDeleted = false " +
           "AND (p.city = :city OR p.propertyType = :type) " +
           "AND p.propId NOT IN :excludeIds " +
           "ORDER BY p.viewCount DESC")
    List<Property> findRecommendedByPreferences(
            @Param("status") com.dayforce.backend.domain.entity.enums.PropertyStatus status,
            @Param("city") String city,
            @Param("type") com.dayforce.backend.domain.entity.enums.PropertyType type,
            @Param("excludeIds") List<Long> excludeIds,
            Pageable pageable);

    /** Popularity fallback: most-viewed AVAILABLE properties, optionally excluding given IDs. */
    @Query("SELECT p FROM Property p WHERE p.status = :status AND p.isDeleted = false " +
           "AND p.propId NOT IN :excludeIds " +
           "ORDER BY p.viewCount DESC")
    List<Property> findPopularExcluding(
            @Param("status") com.dayforce.backend.domain.entity.enums.PropertyStatus status,
            @Param("excludeIds") List<Long> excludeIds,
            Pageable pageable);}
