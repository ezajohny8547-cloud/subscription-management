package com.subscription.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class CustomerSubscriptionDTO {

    private Long id;
    private Long planId;
    private String planName;
    private String planCode;
    private String planDescription;
    private BigDecimal price;
    private String billingCycle;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate renewalDate;
    private boolean autoRenew;
    private List<String> features;

    public CustomerSubscriptionDTO() {
    }

    public CustomerSubscriptionDTO(Long id, Long planId, String planName, String planCode, String planDescription,
                                   BigDecimal price, String billingCycle, String status, LocalDate startDate,
                                   LocalDate endDate, LocalDate renewalDate, boolean autoRenew, List<String> features) {
        this.id = id;
        this.planId = planId;
        this.planName = planName;
        this.planCode = planCode;
        this.planDescription = planDescription;
        this.price = price;
        this.billingCycle = billingCycle;
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.renewalDate = renewalDate;
        this.autoRenew = autoRenew;
        this.features = features;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPlanId() {
        return planId;
    }

    public void setPlanId(Long planId) {
        this.planId = planId;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public String getPlanCode() {
        return planCode;
    }

    public void setPlanCode(String planCode) {
        this.planCode = planCode;
    }

    public String getPlanDescription() {
        return planDescription;
    }

    public void setPlanDescription(String planDescription) {
        this.planDescription = planDescription;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getBillingCycle() {
        return billingCycle;
    }

    public void setBillingCycle(String billingCycle) {
        this.billingCycle = billingCycle;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public LocalDate getRenewalDate() {
        return renewalDate;
    }

    public void setRenewalDate(LocalDate renewalDate) {
        this.renewalDate = renewalDate;
    }

    public boolean isAutoRenew() {
        return autoRenew;
    }

    public void setAutoRenew(boolean autoRenew) {
        this.autoRenew = autoRenew;
    }

    public List<String> getFeatures() {
        return features;
    }

    public void setFeatures(List<String> features) {
        this.features = features;
    }
}
