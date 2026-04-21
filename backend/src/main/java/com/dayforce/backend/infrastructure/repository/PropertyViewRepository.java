package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.PropertyView;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PropertyViewRepository extends JpaRepository<PropertyView, Long> {

    Optional<PropertyView> findByCustomer_IdAndProperty_PropId(Long customerId, Long propertyId);

    /** Returns the customer's most recently viewed non-deleted properties, newest first. */
    @Query("SELECT pv FROM PropertyView pv WHERE pv.customer.id = :customerId AND pv.property.isDeleted = false ORDER BY pv.viewedAt DESC")
    List<PropertyView> findRecentByCustomerId(@Param("customerId") Long customerId, Pageable pageable);
}
