package com.dayforce.backend.domain.entity;

import com.dayforce.backend.domain.entity.enums.AmenityType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "nearby_amenities")
@Data
@NoArgsConstructor
public class NearbyAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AmenityType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private double distanceKm;

    /** true = populated by the auto-fetch; false = entered manually by broker */
    private boolean autoFetched;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;
}
