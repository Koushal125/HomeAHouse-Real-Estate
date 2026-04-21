package com.dayforce.backend.domain.entity;

import com.dayforce.backend.domain.entity.enums.DealStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;

@Entity
@Table(name = "deals")
@Data
@NoArgsConstructor
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dealId;

    @CreationTimestamp
    private LocalDate dealDate;
    @Enumerated(EnumType.STRING) private DealStatus status = DealStatus.PENDING;

    private double dealCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    // Rental specific fields (Premium feature support)
    private LocalDate startDate;
    private LocalDate endDate;
}