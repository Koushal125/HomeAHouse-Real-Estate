package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.SiteVisit;
import com.dayforce.backend.domain.entity.enums.VisitStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {

    List<SiteVisit> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);

    List<SiteVisit> findByBroker_IdOrderByVisitDateTimeAsc(Long brokerId);

    /** Prevents a customer from creating duplicate active (non-terminal) visits for the same property. */
    boolean existsByCustomer_IdAndProperty_PropIdAndStatusIn(Long customerId, Long propertyId, List<VisitStatus> statuses);

    /** Bulk-cancels all REQUESTED and CONFIRMED visits for the given property. */
    @Modifying
    @Query("UPDATE SiteVisit sv SET sv.status = com.dayforce.backend.domain.entity.enums.VisitStatus.CANCELLED " +
           "WHERE sv.property.propId = :propId " +
           "AND sv.status IN (com.dayforce.backend.domain.entity.enums.VisitStatus.REQUESTED, " +
           "                  com.dayforce.backend.domain.entity.enums.VisitStatus.CONFIRMED)")
    void cancelActiveVisitsForProperty(@Param("propId") Long propId);
}
