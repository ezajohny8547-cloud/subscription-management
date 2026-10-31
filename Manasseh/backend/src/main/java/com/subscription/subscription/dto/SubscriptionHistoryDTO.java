package com.subscription.subscription.dto;

import com.subscription.subscription.entity.SubscriptionStatus;
import java.time.LocalDateTime;

public class SubscriptionHistoryDTO {

    private Long historyId;
    private Long subscriptionId;
    private SubscriptionStatus previousStatus;
    private SubscriptionStatus newStatus;
    private String changedBy;
    private String changeReason;
    private LocalDateTime createdAt;

    public SubscriptionHistoryDTO() {
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
