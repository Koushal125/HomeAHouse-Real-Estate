package com.dayforce.backend.application.dto.user;

import com.dayforce.backend.application.dto.property.PropertyResponse;
import com.dayforce.backend.domain.entity.enums.RoleType;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder // Builder pattern makes it very clean to construct this object later
@JsonPropertyOrder({
        "id",
        "name",
        "email",
        "mobile",
        "role",
        "city",
        "premiumEnabled",
        "properties"
})
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String mobile;
    private String city;
    private RoleType role;
    private boolean premiumEnabled;

    private List<PropertyResponse> properties;
}