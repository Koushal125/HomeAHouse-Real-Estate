package com.dayforce.backend.application.service;

import com.dayforce.backend.application.dto.auth.AuthResponse;
import com.dayforce.backend.application.dto.auth.LoginRequest;
import com.dayforce.backend.application.dto.auth.RegisterRequest;
import com.dayforce.backend.config.security.JwtService;
import com.dayforce.backend.domain.entity.Broker;
import com.dayforce.backend.domain.entity.Customer;
import com.dayforce.backend.domain.entity.User;
import com.dayforce.backend.domain.entity.enums.RoleType;
import com.dayforce.backend.infrastructure.repository.BrokerRepository;
import com.dayforce.backend.infrastructure.repository.CustomerRepository;
import com.dayforce.backend.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final BrokerRepository brokerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registration attempt for email: {} with role: {}", request.getEmail(), request.getRole());
        // 1. Validate email uniqueness [cite: 619]
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: email already in use - {}", request.getEmail());
            throw new IllegalArgumentException("Email is already in use");
        }

        User savedUser;

        // 2. Hash password and save based on Role [cite: 620-622]
        if (request.getRole() == RoleType.CUSTOMER) {
            Customer customer = new Customer();
            customer.setEmail(request.getEmail());
            customer.setPassword(passwordEncoder.encode(request.getPassword()));
            customer.setRole(RoleType.CUSTOMER);
            customer.setMobile(request.getMobile());
            customer.setCity(request.getCity());
            customer.setCustName(request.getName());
            savedUser = customerRepository.save(customer);
        } else if (request.getRole() == RoleType.BROKER) {
            Broker broker = new Broker();
            broker.setEmail(request.getEmail());
            broker.setPassword(passwordEncoder.encode(request.getPassword()));
            broker.setRole(RoleType.BROKER);
            broker.setMobile(request.getMobile());
            broker.setCity(request.getCity());
            broker.setBroName(request.getName());
            savedUser = brokerRepository.save(broker);
        } else {
            throw new IllegalArgumentException("Invalid role for registration. Must be CUSTOMER or BROKER.");
        }

        // 3. Generate Token and Return Response [cite: 623]
        String jwtToken = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);
        String savedName = resolveName(savedUser);
        return new AuthResponse(jwtToken, refreshToken, savedUser.getId(), savedUser.getEmail(), savedUser.getRole(), savedName);
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());
        // 1. Authenticate email/password via Spring Security [cite: 628]
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Fetch the user (If we get here, authentication passed)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        log.info("Successful login for user: {} (role: {})", user.getEmail(), user.getRole());

        // 3. Generate JWT and return [cite: 629-630]
        String jwtToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(jwtToken, refreshToken, user.getId(), user.getEmail(), user.getRole(), resolveName(user));
    }

    /** Returns the display name regardless of whether the user is a Customer or Broker. */
    private String resolveName(User user) {
        if (user instanceof Customer c) return c.getCustName() != null ? c.getCustName() : "";
        if (user instanceof Broker   b) return b.getBroName()  != null ? b.getBroName()  : "";
        return "";
    }

    /**
     * Validates the supplied refresh token, issues a new access token and a rotated refresh token.
     * Refresh token rotation limits the window of opportunity for a stolen refresh token.
     */
    public AuthResponse refresh(String rawRefreshToken) {
        String email;
        try {
            email = jwtService.extractUsername(rawRefreshToken);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid refresh token.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (!jwtService.isRefreshTokenValid(rawRefreshToken, user)) {
            throw new IllegalArgumentException("Refresh token is expired or invalid.");
        }

        String newAccessToken  = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(newAccessToken, newRefreshToken, user.getId(), user.getEmail(), user.getRole(), resolveName(user));
    }
}