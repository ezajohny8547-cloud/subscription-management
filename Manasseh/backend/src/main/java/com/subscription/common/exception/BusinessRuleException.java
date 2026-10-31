package com.subscription.common.exception;

/**
 * Thrown when a business domain rule is violated (e.g. invalid pricing,
 * minimum quantity not met, attempting to select an unavailable plan).
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }

    public BusinessRuleException(String message, Throwable cause) {
        super(message, cause);
    }
}
