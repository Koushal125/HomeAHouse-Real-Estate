package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.property.FavoriteResponse;
import com.dayforce.backend.comon.exception.AccessDeniedException;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.Favorite;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.User;
import com.dayforce.backend.infrastructure.repository.FavoriteRepository;
import com.dayforce.backend.infrastructure.repository.PropertyImageRepository;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final PropertyImageRepository propertyImageRepository;

    @Transactional
    public void addFavorite(String customerEmail, Long propertyId) {
        Customer customer = resolveCustomer(customerEmail);
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found"));

        if (favoriteRepository.existsByCustomer_IdAndProperty_PropId(customer.getId(), propertyId)) {
            return; // already saved — idempotent
        }

        Favorite favorite = new Favorite();
        favorite.setCustomer(customer);
        favorite.setProperty(property);
        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(String customerEmail, Long propertyId) {
        Customer customer = resolveCustomer(customerEmail);
        favoriteRepository.deleteByCustomer_IdAndProperty_PropId(customer.getId(), propertyId);
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> getFavorites(String customerEmail) {
        Customer customer = resolveCustomer(customerEmail);
        return favoriteRepository.findByCustomer_Id(customer.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isFavorited(String customerEmail, Long propertyId) {
        Customer customer = resolveCustomer(customerEmail);
        return favoriteRepository.existsByCustomer_IdAndProperty_PropId(customer.getId(), propertyId);
    }

    @Transactional(readOnly = true)
    public int getFavoriteCount(Long customerId) {
        return favoriteRepository.findByCustomer_Id(customerId).size();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Customer resolveCustomer(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!(user instanceof Customer customer)) {
            throw new AccessDeniedException("Only customers can manage favorites.");
        }
        return customer;
    }

    private FavoriteResponse toResponse(Favorite fav) {
        Property p = fav.getProperty();
        List<String> imageUrls = propertyImageRepository
                .findByProperty_PropIdOrderByDisplayOrderAsc(p.getPropId())
                .stream()
                .map(img -> img.getImageUrl())
                .collect(Collectors.toList());
        return FavoriteResponse.builder()
                .favoriteId(fav.getId())
                .propertyId(p.getPropId())
                .title(p.getTitle())
                .city(p.getCity())
                .street(p.getAreaName())
                .propertyType(p.getPropertyType())
                .offerType(p.getOfferType())
                .status(p.getStatus())
                .offerCost(p.getOfferCost())
                .areaSqft(p.getAreaSqft())
                .bedrooms(p.getBedrooms())
                .bathrooms(p.getBathrooms())
                .furnished(p.isFurnished())
                .locality(p.getLocality())
                .imageUrls(imageUrls)
                .build();
    }
}


