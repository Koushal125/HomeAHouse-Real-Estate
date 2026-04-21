package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.auth.AuthResponse;
import com.dayforce.backend.application.dto.auth.LoginRequest;
import com.dayforce.backend.application.dto.auth.RegisterRequest;
import com.dayforce.backend.config.security.JwtService;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.enums.RoleType;
import com.dayforce.backend.infrastructure.repository.BrokerRepository;
import com.dayforce.backend.infrastructure.repository.CustomerRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private BrokerRepository brokerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks private AuthService authService;

    private RegisterRequest customerRegisterRequest;
    private RegisterRequest brokerRegisterRequest;

    @BeforeEach
    void setUp() {
        customerRegisterRequest = new RegisterRequest();
        customerRegisterRequest.setEmail("customer@test.com");
        customerRegisterRequest.setPassword("password123");
        customerRegisterRequest.setName("Test Customer");
        customerRegisterRequest.setRole(RoleType.CUSTOMER);

        brokerRegisterRequest = new RegisterRequest();
        brokerRegisterRequest.setEmail("broker@test.com");
        brokerRegisterRequest.setPassword("password123");
        brokerRegisterRequest.setName("Test Broker");
        brokerRegisterRequest.setRole(RoleType.BROKER);
    }

    // ── register ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("register: creates a CUSTOMER account and returns tokens")
    void register_customerSuccess() {
        when(userRepository.existsByEmail("customer@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");

        Customer savedCustomer = new Customer();
        savedCustomer.setId(1L);
        savedCustomer.setEmail("customer@test.com");
        savedCustomer.setRole(RoleType.CUSTOMER);
        savedCustomer.setCustName("Test Customer");
        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);
        when(jwtService.generateToken(savedCustomer)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(savedCustomer)).thenReturn("refresh-token");

        AuthResponse response = authService.register(customerRegisterRequest);

        assertThat(response.getToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        assertThat(response.getEmail()).isEqualTo("customer@test.com");
        assertThat(response.getRole()).isEqualTo(RoleType.CUSTOMER);
    }

    @Test
    @DisplayName("register: creates a BROKER account and returns tokens")
    void register_brokerSuccess() {
        when(userRepository.existsByEmail("broker@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");

        Broker savedBroker = new Broker();
        savedBroker.setId(2L);
        savedBroker.setEmail("broker@test.com");
        savedBroker.setRole(RoleType.BROKER);
        savedBroker.setBroName("Test Broker");
        when(brokerRepository.save(any(Broker.class))).thenReturn(savedBroker);
        when(jwtService.generateToken(savedBroker)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(savedBroker)).thenReturn("refresh-token");

        AuthResponse response = authService.register(brokerRegisterRequest);

        assertThat(response.getRole()).isEqualTo(RoleType.BROKER);
        assertThat(response.getName()).isEqualTo("Test Broker");
    }

    @Test
    @DisplayName("register: throws IllegalArgumentException when email is already in use")
    void register_throwsWhenEmailTaken() {
        when(userRepository.existsByEmail("customer@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(customerRegisterRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already in use");
    }

    @Test
    @DisplayName("register: throws IllegalArgumentException for invalid role")
    void register_throwsForInvalidRole() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(false);
        customerRegisterRequest.setEmail("user@test.com");
        customerRegisterRequest.setRole(RoleType.ADMIN); // not a registrable role

        assertThatThrownBy(() -> authService.register(customerRegisterRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid role");
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("login: returns tokens for valid credentials")
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("customer@test.com");
        request.setPassword("password123");

        Customer customer = new Customer();
        customer.setId(1L);
        customer.setEmail("customer@test.com");
        customer.setRole(RoleType.CUSTOMER);
        customer.setCustName("Test Customer");

        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(jwtService.generateToken(customer)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(customer)).thenReturn("refresh-token");

        AuthResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login: propagates BadCredentialsException from AuthenticationManager")
    void login_throwsOnBadCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("bad@test.com");
        request.setPassword("wrongpassword");

        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any());

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    // ── refresh ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("refresh: issues new tokens when refresh token is valid")
    void refresh_success() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setEmail("customer@test.com");
        customer.setRole(RoleType.CUSTOMER);
        customer.setCustName("Test Customer");

        when(jwtService.extractUsername("valid-refresh")).thenReturn("customer@test.com");
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(jwtService.isRefreshTokenValid("valid-refresh", customer)).thenReturn(true);
        when(jwtService.generateToken(customer)).thenReturn("new-access");
        when(jwtService.generateRefreshToken(customer)).thenReturn("new-refresh");

        AuthResponse response = authService.refresh("valid-refresh");

        assertThat(response.getToken()).isEqualTo("new-access");
        assertThat(response.getRefreshToken()).isEqualTo("new-refresh");
    }

    @Test
    @DisplayName("refresh: throws IllegalArgumentException when token is invalid or expired")
    void refresh_throwsWhenInvalid() {
        Customer customer = new Customer();
        customer.setEmail("customer@test.com");

        when(jwtService.extractUsername("bad-token")).thenReturn("customer@test.com");
        when(userRepository.findByEmail("customer@test.com")).thenReturn(Optional.of(customer));
        when(jwtService.isRefreshTokenValid("bad-token", customer)).thenReturn(false);

        assertThatThrownBy(() -> authService.refresh("bad-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired or invalid");
    }

    @Test
    @DisplayName("refresh: throws IllegalArgumentException when token cannot be parsed")
    void refresh_throwsWhenTokenUnparseable() {
        when(jwtService.extractUsername("garbage")).thenThrow(new RuntimeException("parse error"));

        assertThatThrownBy(() -> authService.refresh("garbage"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid refresh token");
    }
}
