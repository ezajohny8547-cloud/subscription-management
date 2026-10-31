package com.subscription.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class RenewalItemDTO {

    private Long subscriptionId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String planName;
    private BigDecimal amount;
    private LocalDate renewalDate;
    private String status;
    private boolean autoRenew;

    public RenewalItemDTO() {
    }

    public RenewalItemDTO(Long subscriptionId, Long customerId, String customerName, String customerEmail,
                          String planName, BigDecimal amount, LocalDate renewalDate, String status, boolean autoRenew) {
        this.subscriptionId = subscriptionId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.planName = planName;
        this.amount = amount;
        this.renewalDate = renewalDate;
        this.status = status;
        this.autoRenew = autoRenew;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getRenewalDate() {
        return renewalDate;
    }

    public void setRenewalDate(LocalDate renewalDate) {
        this.renewalDate = renewalDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isAutoRenew() {
        return autoRenew;
    }

    public void setAutoRenew(boolean autoRenew) {
        this.autoRenew = autoRenew;
    }
}
