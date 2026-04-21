package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    List<PropertyImage> findByProperty_PropIdOrderByDisplayOrderAsc(Long propertyId);
}
