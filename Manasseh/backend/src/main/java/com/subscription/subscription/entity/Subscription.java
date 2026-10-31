package com.subscription.subscription.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Subscription Entity with full lifecycle management, billing interval tracking,
 * and accurate billing dates for Module 3 invoice processing.
 */
@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_id")
    private Long subscriptionId;

    @NotBlank(message = "Subscription number is required")
    @Column(name = "subscription_number", nullable = false, unique = true, length = 100)
    private String subscriptionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @NotNull(message = "Customer reference ID is required")
    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @NotBlank(message = "Customer name is required")
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @NotBlank(message = "Customer email is required")
    @Column(name = "customer_email", nullable = false)
    private String customerEmail;

    @NotNull(message = "Plan reference is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "Expiry date is required")
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    /**
     * Stored accurate next billing date for Module 3 to determine when invoices are due.
     */
    @NotNull(message = "Next billing date is required")
    @Column(name = "next_billing_date", nullable = false)
    private LocalDate nextBillingDate;

    @Column(name = "last_billing_date")
    private LocalDate lastBillingDate;

    @NotNull(message = "Payment terms are required")
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_terms", nullable = false, length = 50)
    private PaymentTerms paymentTerms = PaymentTerms.NET_30;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @NotNull(message = "Current status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private SubscriptionStatus status = SubscriptionStatus.DRAFT;

    @Column(name = "billing_cycles_completed", nullable = false)
    private Integer billingCyclesCompleted = 0;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<SubscriptionLine> lines = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Subscription() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = SubscriptionStatus.DRAFT;
        }
        if (this.billingCyclesCompleted == null) {
            this.billingCyclesCompleted = 0;
        }
        if (this.paymentTerms == null) {
            this.paymentTerms = PaymentTerms.NET_30;
        }
        recalculateTotals();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        recalculateTotals();
    }

    public void addLine(SubscriptionLine line) {
        lines.add(line);
        line.setSubscription(this);
        recalculateTotals();
    }

    public void removeLine(SubscriptionLine line) {
        lines.remove(line);
        line.setSubscription(null);
        recalculateTotals();
    }

    public void recalculateTotals() {
        BigDecimal sub = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        if (lines != null) {
            for (SubscriptionLine line : lines) {
                if (line.getUnitPrice() != null && line.getQuantity() != null) {
                    BigDecimal lineSub = line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()));
                    sub = sub.add(lineSub);
                    if (line.getTaxAmount() != null) {
                        tax = tax.add(line.getTaxAmount());
                    }
                }
            }
        }
        this.subtotal = sub;
        this.taxTotal = tax;
        this.totalAmount = sub.add(tax);
    }

    /**
     * Advances the billing date by one interval based on the subscription's plan.
     */
    public LocalDate computeNextBillingDate(LocalDate fromDate) {
        if (plan == null || plan.getBillingInterval() == null) {
            return fromDate.plusMonths(1);
        }
        switch (plan.getBillingInterval()) {
            case DAILY:
                return fromDate.plusDays(1);
            case WEEKLY:
                return fromDate.plusWeeks(1);
            case MONTHLY:
                return fromDate.plusMonths(1);
            case YEARLY:
                return fromDate.plusYears(1);
            default:
                return fromDate.plusMonths(1);
        }
    }

    // Getters and Setters

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

    public Quotation getQuotation() {
        return quotation;
    }

    public void setQuotation(Quotation quotation) {
        this.quotation = quotation;
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

    public Plan getPlan() {
        return plan;
    }

    public void setPlan(Plan plan) {
        this.plan = plan;
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

    public List<SubscriptionLine> getLines() {
        return lines;
    }

    public void setLines(List<SubscriptionLine> lines) {
        this.lines = lines;
        recalculateTotals();
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
