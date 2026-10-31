package com.subscription.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CustomerPortalSummaryDTO {

    private Long customerId;
    private String customerName;
    private String customerEmail;
    private long activeSubscriptionsCount;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
    private LocalDate nextRenewalDate;
    private BigDecimal nextRenewalAmount;
    private String nextRenewalPlan;

    public CustomerPortalSummaryDTO() {
    }

    public CustomerPortalSummaryDTO(Long customerId, String customerName, String customerEmail,
                                    long activeSubscriptionsCount, BigDecimal totalPaid,
                                    BigDecimal totalOutstanding, LocalDate nextRenewalDate,
                                    BigDecimal nextRenewalAmount, String nextRenewalPlan) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.activeSubscriptionsCount = activeSubscriptionsCount;
        this.totalPaid = totalPaid;
        this.totalOutstanding = totalOutstanding;
        this.nextRenewalDate = nextRenewalDate;
        this.nextRenewalAmount = nextRenewalAmount;
        this.nextRenewalPlan = nextRenewalPlan;
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

    public long getActiveSubscriptionsCount() {
        return activeSubscriptionsCount;
    }

    public void setActiveSubscriptionsCount(long activeSubscriptionsCount) {
        this.activeSubscriptionsCount = activeSubscriptionsCount;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getTotalOutstanding() {
        return totalOutstanding;
    }

    public void setTotalOutstanding(BigDecimal totalOutstanding) {
        this.totalOutstanding = totalOutstanding;
    }

    public LocalDate getNextRenewalDate() {
        return nextRenewalDate;
    }

    public void setNextRenewalDate(LocalDate nextRenewalDate) {
        this.nextRenewalDate = nextRenewalDate;
    }

    public BigDecimal getNextRenewalAmount() {
        return nextRenewalAmount;
    }

    public void setNextRenewalAmount(BigDecimal nextRenewalAmount) {
        this.nextRenewalAmount = nextRenewalAmount;
    }

    public String getNextRenewalPlan() {
        return nextRenewalPlan;
    }

    public void setNextRenewalPlan(String nextRenewalPlan) {
        this.nextRenewalPlan = nextRenewalPlan;
    }
}
