package com.subscription.auth.dto;

import com.subscription.auth.model.Role;
import com.subscription.auth.model.UserStatus;

import java.time.Instant;

public class UserResponse {

    private Long userId;
    private String email;
    private String fullName;
    private Role role;
    private UserStatus status;
    private Instant createdAt;

    public UserResponse() {
    }

    public UserResponse(Long userId, String email, String fullName, Role role, UserStatus status, Instant createdAt) {
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
