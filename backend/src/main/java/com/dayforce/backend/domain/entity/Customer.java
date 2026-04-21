package com.dayforce.backend.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "customers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Customer extends User {

    private String custName;

    // A customer can have many deals (purchases/rentals)
    @OneToMany(mappedBy = "customer")
    private List<Deal> deals;

    // A customer can own many properties (Premium Feature)
    @OneToMany(mappedBy = "owner")
    private List<Property> ownedProperties;
}