package com.dayforce.backend.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks which properties a customer has viewed.
 * One row per customer–property pair; viewedAt is updated on every revisit.
 */
@Entity
@Table(name = "property_views", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"customer_id", "property_id"})
})
@Data
@NoArgsConstructor
public class PropertyView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    /**
     * Updated on every view — acts as "last seen" timestamp.
     * The @UpdateTimestamp / manual set approach lets us upsert naturally.
     */
    @Column(nullable = false)
    private LocalDateTime viewedAt = LocalDateTime.now();
}
