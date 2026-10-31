package com.subscription.subscription.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Audit log recording state transitions, operator, and reasons across the subscription lifecycle.
 */
@Entity
@Table(name = "subscription_history")
public class SubscriptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long historyId;

    @Column(name = "subscription_id", nullable = false)
    private Long subscriptionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 50)
    private SubscriptionStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 50)
    private SubscriptionStatus newStatus;

    @Column(name = "changed_by", length = 100)
    private String changedBy = "SYSTEM";

    @Column(name = "change_reason", length = 500)
    private String changeReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public SubscriptionHistory() {
    }

    public SubscriptionHistory(Long subscriptionId, SubscriptionStatus previousStatus, SubscriptionStatus newStatus, String changedBy, String changeReason) {
        this.subscriptionId = subscriptionId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.changedBy = changedBy != null ? changedBy : "SYSTEM";
        this.changeReason = changeReason;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public SubscriptionStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(SubscriptionStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public SubscriptionStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(SubscriptionStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public void setChangeReason(String changeReason) {
        this.changeReason = changeReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
