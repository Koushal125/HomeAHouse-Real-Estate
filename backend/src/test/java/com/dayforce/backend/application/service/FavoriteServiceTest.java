package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.property.FavoriteResponse;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.Favorite;
import com.dayforce.backend.domain.entity.Property;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import com.dayforce.backend.infrastructure.repository.FavoriteRepository;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTest {

    @Mock private FavoriteRepository favoriteRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private UserRepository userRepository;
    @Mock private com.dayforce.backend.infrastructure.repository.PropertyImageRepository propertyImageRepository;

    @InjectMocks private FavoriteService favoriteService;

    private Customer customer;
    private Property property;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId(1L);
        customer.setEmail("customer@test.com");

        property = new Property();
        property.setPropId(10L);
        property.setTitle("Test Property");
        property.setCity("Bangalore");
        property.setPropertyType(PropertyType.APARTMENT);
        property.setOfferType(OfferType.SELL);
        property.setStatus(PropertyStatus.AVAILABLE);
        property.setOfferCost(500000.0);
        property.setAreaSqft(1200.0);
    }

    // ── addFavorite ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("addFavorite: saves a new favorite for a customer")
    void addFavorite_success() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));
        when(favoriteRepository.existsByCustomer_IdAndProperty_PropId(1L, 10L)).thenReturn(false);

        favoriteService.addFavorite("customer@test.com", 10L);

        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    @DisplayName("addFavorite: is idempotent — does not duplicate when already favorited")
    void addFavorite_idempotentWhenAlreadySaved() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property));
        when(favoriteRepository.existsByCustomer_IdAndProperty_PropId(1L, 10L)).thenReturn(true);

        favoriteService.addFavorite("customer@test.com", 10L);

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    @DisplayName("addFavorite: throws AccessDeniedException when caller is a Broker")
    void addFavorite_throwsForBroker() {
        Broker broker = new Broker();
        broker.setEmail("broker@test.com");
        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));

        assertThatThrownBy(() -> favoriteService.addFavorite("broker@test.com", 10L))
                .isInstanceOf(com.dayforce.backend.comon.exception.AccessDeniedException.class)
                .hasMessageContaining("customers");
    }

    @Test
    @DisplayName("addFavorite: throws ResourceNotFoundException when property does not exist")
    void addFavorite_throwsWhenPropertyNotFound() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> favoriteService.addFavorite("customer@test.com", 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Property not found");
    }

    // ── removeFavorite ────────────────────────────────────────────────────────

    @Test
    @DisplayName("removeFavorite: deletes the favorite entry for a customer")
    void removeFavorite_success() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));

        favoriteService.removeFavorite("customer@test.com", 10L);

        verify(favoriteRepository).deleteByCustomer_IdAndProperty_PropId(1L, 10L);
    }

    // ── getFavorites ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("getFavorites: returns mapped favorites list for a customer")
    void getFavorites_returnsList() {
        Favorite fav = new Favorite();
        fav.setId(100L);
        fav.setCustomer(customer);
        fav.setProperty(property);

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(favoriteRepository.findByCustomer_Id(1L)).thenReturn(List.of(fav));

        List<FavoriteResponse> result = favoriteService.getFavorites("customer@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPropertyId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getFavorites: returns empty list when customer has no favorites")
    void getFavorites_emptyList() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(favoriteRepository.findByCustomer_Id(1L)).thenReturn(List.of());

        List<FavoriteResponse> result = favoriteService.getFavorites("customer@test.com");

        assertThat(result).isEmpty();
    }

    // ── isFavorited ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("isFavorited: returns true when the property is in the customer favorites")
    void isFavorited_returnsTrue() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(favoriteRepository.existsByCustomer_IdAndProperty_PropId(1L, 10L)).thenReturn(true);

        assertThat(favoriteService.isFavorited("customer@test.com", 10L)).isTrue();
    }

    @Test
    @DisplayName("isFavorited: returns false when the property is not in the customer favorites")
    void isFavorited_returnsFalse() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(favoriteRepository.existsByCustomer_IdAndProperty_PropId(1L, 99L)).thenReturn(false);

        assertThat(favoriteService.isFavorited("customer@test.com", 99L)).isFalse();
    }
}
