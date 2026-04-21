package com.dayforce.backend.comon.exception;

/**
 * Thrown when a requested resource (User, Property, Deal, etc.) does not exist.
 * Handled by GlobalExceptionHandler → HTTP 404 NOT_FOUND.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
