package com.dayforce.backend.config.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigin;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Configure CORS using Lambda DSL
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 2. Disable CSRF using Lambda DSL (safe for stateless JWT APIs)
                .csrf(csrf -> csrf.disable())
                // 3. Configure Route Authorizations
                .authorizeHttpRequests(auth -> auth
                    // ── Public ───────────────────────────────────────────────
                    .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/properties", "/api/properties/search", "/api/properties/*").permitAll()
                    .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                    // ── Broker-only ───────────────────────────────────────────
                    .requestMatchers(HttpMethod.POST, "/api/properties").hasRole("BROKER")
                    .requestMatchers(HttpMethod.PUT, "/api/properties/*/status").hasRole("BROKER")
                    .requestMatchers(HttpMethod.PUT, "/api/properties/*").hasRole("BROKER")
                    .requestMatchers(HttpMethod.DELETE, "/api/properties/*").hasRole("BROKER")
                    .requestMatchers(HttpMethod.POST, "/api/properties/*/images").hasRole("BROKER")
                    .requestMatchers(HttpMethod.GET, "/api/properties/me/managed").hasRole("BROKER")
                    .requestMatchers(HttpMethod.GET, "/api/properties/me/deleted").hasRole("BROKER")
                    .requestMatchers(HttpMethod.GET, "/api/properties/pending").hasRole("BROKER")
                    .requestMatchers(HttpMethod.GET, "/api/deals/me/pipeline").hasRole("BROKER")
                    .requestMatchers(HttpMethod.PATCH, "/api/deals/*/advance").hasRole("BROKER")
                    .requestMatchers(HttpMethod.GET, "/api/users/me/broker-metrics").hasRole("BROKER")
                    .requestMatchers(HttpMethod.GET, "/api/users/me/analytics").hasRole("BROKER")
                    // ── Customer-only ─────────────────────────────────────────
                    .requestMatchers(HttpMethod.POST, "/api/properties/submit").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.GET, "/api/properties/me/submissions").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.POST, "/api/deals/*").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.GET, "/api/deals/me/transactions").hasRole("CUSTOMER")
                    .requestMatchers("/api/favorites/**").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.GET, "/api/users/me/metrics").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.GET, "/api/properties/me/recently-viewed").hasRole("CUSTOMER")
                    // ── Site visits ───────────────────────────────────────────
                    .requestMatchers(HttpMethod.POST, "/api/site-visits/*").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.GET, "/api/site-visits/me").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.DELETE, "/api/site-visits/*").hasRole("CUSTOMER")
                    .requestMatchers(HttpMethod.GET, "/api/site-visits/broker/**").hasRole("BROKER")
                    .requestMatchers(HttpMethod.PATCH, "/api/site-visits/*/status").hasRole("BROKER")
                    // ── Any authenticated user ────────────────────────────────
                    .anyRequest().authenticated()
                )
                // 4. Configure Stateless Session
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 5. Add our Custom Authentication Provider and JWT Filter
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Setting up CORS for the frontend
    // Note: setAllowCredentials(true) is intentionally omitted — authentication is
    // carried via the Authorization header (Bearer JWT), not cookies.  If cookie-based
    // auth is introduced in the future, call configuration.setAllowCredentials(true)
    // and replace the wildcard origin with an explicit allow-list.
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}