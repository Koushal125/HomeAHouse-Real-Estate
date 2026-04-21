package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.user.PasswordChangeRequest;
import com.dayforce.backend.application.dto.user.UserProfileResponse;
import com.dayforce.backend.application.dto.user.UserProfileUpdateRequest;
import com.dayforce.backend.application.mapper.PropertyMapper;
import com.dayforce.backend.comon.exception.ResourceNotFoundException;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.enums.RoleType;
import com.dayforce.backend.infrastructure.repository.DealRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PropertyRepository propertyRepository;
    @Mock private DealRepository dealRepository;
    @Mock private FavoriteRepository favoriteRepository;
    @Mock private PropertyMapper propertyMapper;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UserService userService;

    private Customer customer;
    private Broker broker;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setId(1L);
        customer.setEmail("customer@test.com");
        customer.setCustName("Alice Smith");
        customer.setMobile("9876543210");
        customer.setCity("Bangalore");
        customer.setRole(RoleType.CUSTOMER);
        customer.setPassword("encoded-password");

        broker = new Broker();
        broker.setId(2L);
        broker.setEmail("broker@test.com");
        broker.setBroName("Bob Jones");
        broker.setMobile("9123456789");
        broker.setCity("Mumbai");
        broker.setRole(RoleType.BROKER);
    }

    // ── getCurrentUserProfile ─────────────────────────────────────────────────

    @Test
    @DisplayName("getCurrentUserProfile: returns correct profile for a Customer")
    void getCurrentUserProfile_returnsCustomerProfile() {
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(propertyRepository.findByOwner_IdAndIsDeletedFalse(1L)).thenReturn(List.of());

        UserProfileResponse result = userService.getCurrentUserProfile("customer@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("customer@test.com");
        assertThat(result.getName()).isEqualTo("Alice Smith");
        assertThat(result.getRole()).isEqualTo(RoleType.CUSTOMER);
        assertThat(result.getProperties()).isEmpty();
    }

    @Test
    @DisplayName("getCurrentUserProfile: returns correct profile for a Broker")
    void getCurrentUserProfile_returnsBrokerProfile() {
        when(userRepository.findByEmail("broker@test.com")).thenReturn(Optional.of(broker));
        when(propertyRepository.findByBroker_IdAndIsDeletedFalse(2L)).thenReturn(List.of());

        UserProfileResponse result = userService.getCurrentUserProfile("broker@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Bob Jones");
        assertThat(result.getRole()).isEqualTo(RoleType.BROKER);
    }

    @Test
    @DisplayName("getCurrentUserProfile: throws ResourceNotFoundException when user does not exist")
    void getCurrentUserProfile_throwsWhenUserNotFound() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getCurrentUserProfile("ghost@test.com"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found");
    }

    // ── updateProfile ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile: updates name, mobile, and city for a Customer")
    void updateProfile_updatesCustomerFields() {
        UserProfileUpdateRequest request = new UserProfileUpdateRequest();
        request.setName("Alice Updated");
        request.setMobile("1111111111");
        request.setCity("Chennai");

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(userRepository.save(any())).thenReturn(customer);
        // Second call inside getCurrentUserProfile
        when(propertyRepository.findByOwner_IdAndIsDeletedFalse(1L)).thenReturn(List.of());

        UserProfileResponse result = userService.updateProfile("customer@test.com", request);

        assertThat(customer.getCustName()).isEqualTo("Alice Updated");
        assertThat(customer.getMobile()).isEqualTo("1111111111");
        assertThat(customer.getCity()).isEqualTo("Chennai");
        assertThat(result).isNotNull();
        verify(userRepository).save(customer);
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword: encodes and saves the new password when credentials are valid")
    void changePassword_success() {
        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("old-pass");
        request.setNewPassword("new-pass-123");
        request.setConfirmPassword("new-pass-123");

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(passwordEncoder.matches("old-pass", "encoded-password")).thenReturn(true);
        when(passwordEncoder.encode("new-pass-123")).thenReturn("new-encoded");

        userService.changePassword("customer@test.com", request);

        assertThat(customer.getPassword()).isEqualTo("new-encoded");
        verify(userRepository).save(customer);
    }

    @Test
    @DisplayName("changePassword: throws AccessDeniedException when current password is wrong")
    void changePassword_throwsOnWrongCurrentPassword() {
        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("wrong-pass");
        request.setNewPassword("new-pass-123");
        request.setConfirmPassword("new-pass-123");

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(passwordEncoder.matches("wrong-pass", "encoded-password")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("customer@test.com", request))
                .isInstanceOf(com.dayforce.backend.comon.exception.AccessDeniedException.class)
                .hasMessageContaining("Incorrect current password");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword: throws AccessDeniedException when new and confirm passwords differ")
    void changePassword_throwsWhenPasswordsDoNotMatch() {
        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("old-pass");
        request.setNewPassword("new-pass-123");
        request.setConfirmPassword("different-pass");

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(passwordEncoder.matches("old-pass", "encoded-password")).thenReturn(true);

        assertThatThrownBy(() -> userService.changePassword("customer@test.com", request))
                .isInstanceOf(com.dayforce.backend.comon.exception.AccessDeniedException.class)
                .hasMessageContaining("Passwords do not match");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword: throws ResourceNotFoundException when user does not exist")
    void changePassword_throwsWhenUserNotFound() {
        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setCurrentPassword("any");
        request.setNewPassword("new-pass");
        request.setConfirmPassword("new-pass");

        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.changePassword("ghost@test.com", request))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
