package com.subscription.common.exception;

/**
 * Thrown when an illegal lifecycle status transition is requested
 * (e.g. attempting to activate a CLOSED subscription or skip directly from DRAFT to ACTIVE).
 */
public class InvalidStateTransitionException extends RuntimeException {

    private final String currentStatus;
    private final String targetStatus;

    public InvalidStateTransitionException(String currentStatus, String targetStatus, String reason) {
        super(String.format("Cannot transition subscription from '%s' to '%s': %s", currentStatus, targetStatus, reason));
        this.currentStatus = currentStatus;
        this.targetStatus = targetStatus;
    }

    public InvalidStateTransitionException(String currentStatus, String targetStatus) {
        this(currentStatus, targetStatus, "Illegal state transition according to subscription lifecycle rules.");
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public String getTargetStatus() {
        return targetStatus;
    }
}
