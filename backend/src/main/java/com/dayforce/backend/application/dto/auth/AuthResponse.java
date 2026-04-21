package com.dayforce.backend.application.dto.auth;

import com.dayforce.backend.domain.entity.enums.RoleType;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String email;
    private RoleType role;
    private String name;
}