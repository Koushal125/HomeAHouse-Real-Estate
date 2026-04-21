package com.dayforce.backend.presentation.controller;

import com.dayforce.backend.application.dto.property.PropertyResponse;
import com.dayforce.backend.application.service.ImageStorageService;
import com.dayforce.backend.application.service.PropertyService;
import com.dayforce.backend.domain.entity.enums.OfferType;
import com.dayforce.backend.domain.entity.enums.PropertyStatus;
import com.dayforce.backend.domain.entity.enums.PropertyType;
import com.dayforce.backend.infrastructure.repository.PropertyImageRepository;
import com.dayforce.backend.infrastructure.repository.PropertyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PropertyControllerTest {

    @Mock private PropertyService propertyService;
    @Mock private ImageStorageService imageStorageService;
    @Mock private PropertyRepository propertyRepository;
    @Mock private PropertyImageRepository propertyImageRepository;

    @InjectMocks private PropertyController propertyController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(propertyController)
                .setControllerAdvice(new com.dayforce.backend.comon.exception.GlobalExceptionHandler())
                .build();
    }

    private PropertyResponse sampleProperty() {
        return PropertyResponse.builder()
                .propId(1L)
                .title("Test Property")
                .propertyType(PropertyType.APARTMENT)
                .offerType(OfferType.SELL)
                .status(PropertyStatus.AVAILABLE)
                .offerCost(500000.0)
                .city("Bangalore")
                .build();
    }

    @Test
    @DisplayName("GET /api/properties — returns paginated list of active properties")
    void listProperties_returnsPaginatedPage() throws Exception {
        var page = new PageImpl<>(List.of(sampleProperty()), PageRequest.of(0, 20), 1);
        when(propertyService.listAllActiveProperties(0, 20)).thenReturn(page);

        mockMvc.perform(get("/api/properties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Test Property"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/properties/{id} — returns property details")
    void getProperty_returnsDetails() throws Exception {
        when(propertyService.getPropertyDetails(1L, null)).thenReturn(sampleProperty());

        mockMvc.perform(get("/api/properties/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.propId").value(1))
                .andExpect(jsonPath("$.city").value("Bangalore"));
    }

    @Test
    @DisplayName("GET /api/properties/{id} — returns 500 when property not found (global handler not loaded in slice)")
    void getProperty_throwsWhenNotFound() throws Exception {
        when(propertyService.getPropertyDetails(99L, null))
                .thenThrow(new IllegalArgumentException("Property not found"));

        mockMvc.perform(get("/api/properties/99"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/properties/me/managed — returns broker managed properties")
    void getManagedProperties_returnsList() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("broker@test.com");
        when(propertyService.getManagedProperties("broker@test.com"))
                .thenReturn(List.of(sampleProperty()));

        // Invoke the controller method directly to avoid auth filter complexity
        var result = propertyController.getManagedProperties(auth);

        assert result.getStatusCode().is2xxSuccessful();
        assert result.getBody() != null;
        assert result.getBody().size() == 1;
    }

    @Test
    @DisplayName("PropertyController.createProperty — delegates to service and returns 201")
    void createProperty_delegatesToService() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("broker@test.com");

        com.dayforce.backend.application.dto.property.PropertyRequest req =
                new com.dayforce.backend.application.dto.property.PropertyRequest();
        req.setTitle("New");
        req.setCity("Mumbai");
        req.setOfferCost(100000);

        when(propertyService.createProperty(any(), eq("broker@test.com")))
                .thenReturn(sampleProperty());

        var result = propertyController.createProperty(req, auth);

        assert result.getStatusCode().value() == 201;
    }
}

