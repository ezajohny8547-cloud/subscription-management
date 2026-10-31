package com.subscription.auth.model;

/**
 * Supported User Roles across the Subscription Management System.
 */
public enum Role {
    ADMIN,
    STAFF,
    CUSTOMER;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
