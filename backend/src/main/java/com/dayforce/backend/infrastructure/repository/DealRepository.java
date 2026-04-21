package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.Deal;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long>, JpaSpecificationExecutor<Deal> {
    // Finds all deals made by a specific customer
    List<Deal> findByCustomer_Id(Long customerId);

    // The "Magic" Query: Finds all deals associated with properties managed by a specific broker
    List<Deal> findByProperty_Broker_Id(Long brokerId);

    // Latest deal for a property (used to surface deal stage on property detail)
    Optional<Deal> findFirstByProperty_PropIdOrderByDealIdDesc(Long propertyId);

    // Deal count per status for a broker (used by analytics)
    long countByProperty_Broker_IdAndStatus(Long brokerId, DealStatus status);

    // Check if any non-CLOSED deals exist for a property (used before soft-delete)
    boolean existsByProperty_PropIdAndStatusNot(Long propertyId, DealStatus status);
}
