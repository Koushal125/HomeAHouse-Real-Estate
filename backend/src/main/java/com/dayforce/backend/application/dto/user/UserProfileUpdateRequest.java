package com.dayforce.backend.application.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @NotBlank(message = "Name cannot be blank")
    private String name;

    @Size(max = 20, message = "Mobile number cannot exceed 20 characters")
    @JsonProperty("phone")
    private String mobile;

    private String city;
}