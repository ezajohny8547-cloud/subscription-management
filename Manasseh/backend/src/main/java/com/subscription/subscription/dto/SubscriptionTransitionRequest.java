package com.subscription.subscription.dto;

import com.subscription.subscription.entity.SubscriptionStatus;
import jakarta.validation.constraints.NotNull;

public class SubscriptionTransitionRequest {

    @NotNull(message = "Target status is required")
    private SubscriptionStatus targetStatus;

    private String reason;
    private String changedBy;

    public SubscriptionTransitionRequest() {
    }

    public SubscriptionTransitionRequest(SubscriptionStatus targetStatus, String reason, String changedBy) {
        this.targetStatus = targetStatus;
        this.reason = reason;
        this.changedBy = changedBy;
    }

    public SubscriptionStatus getTargetStatus() {
        return targetStatus;
    }

    public void setTargetStatus(SubscriptionStatus targetStatus) {
        this.targetStatus = targetStatus;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }
}
