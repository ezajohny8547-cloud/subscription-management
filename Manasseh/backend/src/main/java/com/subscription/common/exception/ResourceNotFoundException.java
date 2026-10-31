package com.subscription.common.exception;

/**
 * Thrown when an entity is not found by identifier.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, Long id) {
        super(String.format("%s not found with ID: %d", resourceName, id));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
