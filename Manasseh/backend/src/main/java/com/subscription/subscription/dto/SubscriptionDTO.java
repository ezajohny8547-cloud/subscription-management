package com.subscription.subscription.dto;

import com.subscription.subscription.entity.BillingInterval;
import com.subscription.subscription.entity.PaymentTerms;
import com.subscription.subscription.entity.SubscriptionStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class SubscriptionDTO {

    private Long subscriptionId;
    private String subscriptionNumber;
    private Long quotationId;
    private String quotationNumber;

    @NotNull(message = "Customer reference ID is required")
    private Long customerId;

    private String customerName;
    private String customerEmail;

    @NotNull(message = "Plan ID is required")
    private Long planId;

    private String planName;
    private BillingInterval billingInterval;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private LocalDate nextBillingDate;
    private LocalDate lastBillingDate;
    private PaymentTerms paymentTerms = PaymentTerms.NET_30;
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal taxTotal = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private SubscriptionStatus status = SubscriptionStatus.DRAFT;
    private Integer billingCyclesCompleted = 0;
    private String cancellationReason;
    private LocalDateTime closedAt;
    private Set<SubscriptionStatus> allowedNextStatuses;

    @NotEmpty(message = "Subscription must contain at least one product line")
    @Valid
    private List<SubscriptionLineDTO> lines = new ArrayList<>();

    private List<SubscriptionHistoryDTO> history = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SubscriptionDTO() {
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getSubscriptionNumber() {
        return subscriptionNumber;
    }

    public void setSubscriptionNumber(String subscriptionNumber) {
        this.subscriptionNumber = subscriptionNumber;
    }

    public Long getQuotationId() {
        return quotationId;
    }

    public void setQuotationId(Long quotationId) {
        this.quotationId = quotationId;
    }

    public String getQuotationNumber() {
        return quotationNumber;
    }

    public void setQuotationNumber(String quotationNumber) {
        this.quotationNumber = quotationNumber;
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

    public BillingInterval getBillingInterval() {
        return billingInterval;
    }

    public void setBillingInterval(BillingInterval billingInterval) {
        this.billingInterval = billingInterval;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
    }

    public LocalDate getNextBillingDate() {
        return nextBillingDate;
    }

    public void setNextBillingDate(LocalDate nextBillingDate) {
        this.nextBillingDate = nextBillingDate;
    }

    public LocalDate getLastBillingDate() {
        return lastBillingDate;
    }

    public void setLastBillingDate(LocalDate lastBillingDate) {
        this.lastBillingDate = lastBillingDate;
    }

    public PaymentTerms getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(PaymentTerms paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getTaxTotal() {
        return taxTotal;
    }

    public void setTaxTotal(BigDecimal taxTotal) {
        this.taxTotal = taxTotal;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionStatus status) {
        this.status = status;
    }

    public Integer getBillingCyclesCompleted() {
        return billingCyclesCompleted;
    }

    public void setBillingCyclesCompleted(Integer billingCyclesCompleted) {
        this.billingCyclesCompleted = billingCyclesCompleted;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public LocalDateTime getClosedAt() {
        return closedAt;
    }

    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }

    public Set<SubscriptionStatus> getAllowedNextStatuses() {
        return allowedNextStatuses;
    }

    public void setAllowedNextStatuses(Set<SubscriptionStatus> allowedNextStatuses) {
        this.allowedNextStatuses = allowedNextStatuses;
    }

    public List<SubscriptionLineDTO> getLines() {
        return lines;
    }

    public void setLines(List<SubscriptionLineDTO> lines) {
        this.lines = lines;
    }

    public List<SubscriptionHistoryDTO> getHistory() {
        return history;
    }

    public void setHistory(List<SubscriptionHistoryDTO> history) {
        this.history = history;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
