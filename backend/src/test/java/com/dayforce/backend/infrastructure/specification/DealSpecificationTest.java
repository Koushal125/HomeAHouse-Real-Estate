package com.dayforce.backend.infrastructure.specification;

import com.dayforce.backend.domain.entity.Deal;
import com.dayforce.backend.domain.entity.enums.DealStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class DealSpecificationTest {

    /** Verifies that byBrokerId uses LEFT JOINs and never traverses a raw nested path. */
    @Test
    @DisplayName("byBrokerId: uses LEFT JOIN and does not throw when broker is null")
    void byBrokerId_usesLeftJoin_doesNotThrowWhenBrokerIsNull() {
        // Arrange
        @SuppressWarnings("unchecked")
        Root<Deal> root = mock(Root.class);
        @SuppressWarnings("unchecked")
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);

        @SuppressWarnings("unchecked")
        Join<Object, Object> propertyJoin = mock(Join.class);
        @SuppressWarnings("unchecked")
        Join<Object, Object> brokerJoin = mock(Join.class);
        @SuppressWarnings("unchecked")
        Path<Object> idPath = mock(Path.class);

        when(root.join(eq("property"), eq(JoinType.LEFT))).thenReturn(propertyJoin);
        when(propertyJoin.join(eq("broker"), eq(JoinType.LEFT))).thenReturn(brokerJoin);
        when(brokerJoin.get("id")).thenReturn(idPath);
        when(cb.equal(any(), eq(42L))).thenReturn(mock(Predicate.class));

        Specification<Deal> spec = DealSpecification.byBrokerId(42L);

        // Act & Assert — must not throw even if broker is null at data level
        assertThatNoException().isThrownBy(() -> spec.toPredicate(root, query, cb));

        verify(root).join("property", JoinType.LEFT);
        verify(propertyJoin).join("broker", JoinType.LEFT);
    }

    @Test
    @DisplayName("byStatus: creates equality predicate on status field")
    void byStatus_createsEqualityPredicate() {
        @SuppressWarnings("unchecked")
        Root<Deal> root = mock(Root.class);
        @SuppressWarnings("unchecked")
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder cb = mock(CriteriaBuilder.class);

        @SuppressWarnings("unchecked")
        Path<Object> statusPath = mock(Path.class);
        when(root.get("status")).thenReturn(statusPath);
        when(cb.equal(any(), eq(DealStatus.PENDING))).thenReturn(mock(Predicate.class));

        Specification<Deal> spec = DealSpecification.byStatus(DealStatus.PENDING);

        assertThatNoException().isThrownBy(() -> spec.toPredicate(root, query, cb));
        verify(root).get("status");
    }
}
