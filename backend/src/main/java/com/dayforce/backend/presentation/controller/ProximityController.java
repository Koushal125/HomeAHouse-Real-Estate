package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.proximity.NearbyAmenityResponse;
import com.dayforce.backend.application.service.ProximityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/proximity")
@RequiredArgsConstructor
public class ProximityController {

    private final ProximityService proximityService;

    /**
     * Auto-fetches the nearest hospital, school, and police station for a given address.
     * Returns an empty list for any type that could not be found.
     *
     * @param address street/full address of the property
     * @param city    city of the property
     */
    @GetMapping("/amenities")
    public ResponseEntity<List<NearbyAmenityResponse>> getNearbyAmenities(
            @RequestParam(required = false) String streetName,
            @RequestParam(required = false) String areaName,
            @RequestParam(required = false) String landmark,
            @RequestParam(required = false) String locality,
            @RequestParam String city) {
        return ResponseEntity.ok(proximityService.fetchNearbyAmenities(streetName, areaName, landmark, locality, city));
    }
}
