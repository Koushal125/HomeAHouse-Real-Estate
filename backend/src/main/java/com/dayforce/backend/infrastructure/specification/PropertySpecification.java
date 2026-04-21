package com.dayforce.backend.infrastructure.specification;

import com.dayforce.backend.application.dto.PropertyCriteria;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;


public class PropertySpecification {

    public static Specification<Property> getPropertiesByCriteria(PropertyCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. ALWAYS filter to only show properties that are AVAILABLE and not deleted
            predicates.add(criteriaBuilder.equal(root.get("status"), PropertyStatus.AVAILABLE));
            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            // 2. Conditionally add filters only if the user provided them

            // Global free-text search: title OR city OR areaName OR landmark
            if (criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
                String pattern = "%" + criteria.getQuery().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")),    pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("city")),     pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("areaName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("landmark")), pattern)
                ));
            }

            if (criteria.getTitle() != null && !criteria.getTitle().isEmpty()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("title")),
                        "%" + criteria.getTitle().toLowerCase() + "%"
                ));
            }

            if (criteria.getCity() != null && !criteria.getCity().isEmpty()) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("city")), criteria.getCity().toLowerCase()));
            }

            if (criteria.getConfig() != null && !criteria.getConfig().isEmpty()) {
                // Using 'like' for partial matches (e.g., searching "2BHK" finds "Luxury 2BHK")
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("configuration")), "%" + criteria.getConfig().toLowerCase() + "%"));
            }

            if (criteria.getOffer() != null) {
                predicates.add(criteriaBuilder.equal(root.get("offerType"), criteria.getOffer()));
            }

            if (criteria.getPropertyType() != null) {
                predicates.add(criteriaBuilder.equal(root.get("propertyType"), criteria.getPropertyType()));
            }

            // 3. Handle Price Ranges
            if (criteria.getMinCost() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("offerCost"), criteria.getMinCost()));
            }
            if (criteria.getMaxCost() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("offerCost"), criteria.getMaxCost()));
            }

            // 4. Handle Premium Fields
            if (criteria.getBedrooms() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("bedrooms"), criteria.getBedrooms()));
            }
            if (criteria.getFurnished() != null) {
                predicates.add(criteriaBuilder.equal(root.get("furnished"), criteria.getFurnished()));
            }

            // Combine all predicates with AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}