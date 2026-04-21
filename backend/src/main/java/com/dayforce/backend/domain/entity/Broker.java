package com.dayforce.backend.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "brokers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Broker extends User {

    private String broName;

    // A broker manages many properties
    @OneToMany(mappedBy = "broker")
    private List<Property> managedProperties;
}