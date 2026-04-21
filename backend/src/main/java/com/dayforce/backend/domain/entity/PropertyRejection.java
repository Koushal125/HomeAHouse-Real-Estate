package com.dayforce.backend.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "property_rejections")
@Getter
@Setter
public class PropertyRejection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "broker_id")
    private Broker broker;

    @Column(nullable = false, length = 500)
    private String reason;

    private LocalDateTime rejectedAt;

    @PrePersist
    protected void onCreate() {
        rejectedAt = LocalDateTime.now();
    }
}