package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByCustomer_Id(Long customerId);

    Optional<Favorite> findByCustomer_IdAndProperty_PropId(Long customerId, Long propertyId);

    boolean existsByCustomer_IdAndProperty_PropId(Long customerId, Long propertyId);

    @Transactional
    void deleteByCustomer_IdAndProperty_PropId(Long customerId, Long propertyId);
}
