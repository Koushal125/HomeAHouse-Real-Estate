package com.dayforce.backend.infrastructure.specification;

import com.dayforce.backend.domain.entity.Deal;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class DealSpecification {

    public static Specification<Deal> byCustomerId(Long customerId) {
        return (root, query, cb) ->
                cb.equal(root.get("customer").get("id"), customerId);
    }

    /**
     * Filters deals by the broker who manages the associated property.
     * Uses a LEFT JOIN instead of nested path access so that deals whose
     * property has no broker assigned (broker IS NULL) are safely excluded
     * rather than causing a NullPointerException or invalid SQL.
     */
    public static Specification<Deal> byBrokerId(Long brokerId) {
        return (root, query, cb) -> {
            Join<Deal, Property> property = root.join("property", JoinType.LEFT);
            return cb.equal(property.join("broker", JoinType.LEFT).get("id"), brokerId);
        };
    }

    public static Specification<Deal> byStatus(DealStatus status) {
        return (root, query, cb) ->
                cb.equal(root.get("status"), status);
    }
}
