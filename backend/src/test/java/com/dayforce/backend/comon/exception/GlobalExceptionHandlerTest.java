package com.dayforce.backend.comon.exception;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.*;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    // ── Minimal throwing controller ───────────────────────────────────────────

    @RestController
    static class ThrowingController {

        @GetMapping("/test/404")
        public void throw404() {
            throw new ResourceNotFoundException("Thing not found");
        }

        @GetMapping("/test/400")
        public void throw400() {
            throw new IllegalArgumentException("Bad input value");
        }

        @GetMapping("/test/403")
        public void throw403() {
            throw new AccessDeniedException("Access denied");
        }

        @GetMapping("/test/state")
        public void throwState() {
            throw new IllegalStateException("Invalid state transition");
        }

        @GetMapping("/test/db-constraint")
        public void throwDbConstraint() {
            throw new DataIntegrityViolationException("Unique constraint violation");
        }

        @PostMapping("/test/validate")
        public void throwValidation(@Valid @RequestBody ValidatedInput body) { }

        @Data
        static class ValidatedInput {
            @NotBlank(message = "field is required")
            private String field;
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ThrowingController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("ResourceNotFoundException returns 404 with JSON message")
    void resourceNotFound_returns404() throws Exception {
        mockMvc.perform(get("/test/404"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Thing not found"));
    }

    @Test
    @DisplayName("IllegalArgumentException returns 400 with JSON message")
    void illegalArgument_returns400() throws Exception {
        mockMvc.perform(get("/test/400"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bad input value"));
    }

    @Test
    @DisplayName("AccessDeniedException returns 403 with JSON message")
    void securityException_returns403() throws Exception {
        mockMvc.perform(get("/test/403"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    @Test
    @DisplayName("MethodArgumentNotValidException returns 400 with wrapped validation error response")
    void validationException_returns400WithFieldErrors() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"field\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.field").value("field is required"));
    }

    @Test
    @DisplayName("IllegalStateException returns 400 with JSON message")
    void illegalState_returns400() throws Exception {
        mockMvc.perform(get("/test/state"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid state transition"));
    }

    @Test
    @DisplayName("DataIntegrityViolationException returns 400 with generic constraint message")
    void dataIntegrityViolation_returns400() throws Exception {
        mockMvc.perform(get("/test/db-constraint"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Request contains a value that violates a database constraint."));
    }
}
