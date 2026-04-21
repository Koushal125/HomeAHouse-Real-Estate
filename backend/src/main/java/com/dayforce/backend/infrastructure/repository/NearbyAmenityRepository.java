package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.NearbyAmenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NearbyAmenityRepository extends JpaRepository<NearbyAmenity, Long> {
}
