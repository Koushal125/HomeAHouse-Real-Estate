package com.dayforce.backend.infrastructure.repository;

import com.dayforce.backend.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Required for Phase 5 (Security)
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}