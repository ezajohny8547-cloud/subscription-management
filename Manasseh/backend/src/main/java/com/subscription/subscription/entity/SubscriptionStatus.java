package com.subscription.subscription.entity;

import java.util.EnumSet;
import java.util.Set;

/**
 * Subscription Status with strict state progression:
 * DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
 * Also supports operational pausing (ACTIVE <-> PAUSED) and early closure.
 */
public enum SubscriptionStatus {
    DRAFT,
    QUOTATION,
    CONFIRMED,
    ACTIVE,
    PAUSED,
    CLOSED;

    /**
     * Returns true if transitioning from this status to targetStatus is legally permitted.
     */
    public boolean canTransitionTo(SubscriptionStatus target) {
        if (this == target) {
            return false;
        }

        switch (this) {
            case DRAFT:
                // Can move to QUOTATION, CONFIRMED (if directly confirmed), or CLOSED (cancelled)
                return target == QUOTATION || target == CONFIRMED || target == CLOSED;

            case QUOTATION:
                // Can move to CONFIRMED (upon customer acceptance) or CLOSED (declined)
                return target == CONFIRMED || target == CLOSED;

            case CONFIRMED:
                // Can move to ACTIVE (activated upon start date) or CLOSED (cancelled before activation)
                return target == ACTIVE || target == CLOSED;

            case ACTIVE:
                // Can pause, close early, or be renewed (renew maintains ACTIVE state)
                return target == PAUSED || target == CLOSED;

            case PAUSED:
                // Can resume back to ACTIVE or close early
                return target == ACTIVE || target == CLOSED;

            case CLOSED:
                // Terminal state - no further transitions permitted
                return false;

            default:
                return false;
        }
    }

    /**
     * Returns all valid target statuses from this state.
     */
    public Set<SubscriptionStatus> allowedNextStatuses() {
        Set<SubscriptionStatus> allowed = EnumSet.noneOf(SubscriptionStatus.class);
        for (SubscriptionStatus s : SubscriptionStatus.values()) {
            if (this.canTransitionTo(s)) {
                allowed.add(s);
            }
        }
        return allowed;
    }
}
