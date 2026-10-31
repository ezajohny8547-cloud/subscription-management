package com.subscription.billing.entity;

import com.subscription.model.Subscription;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_period_records", uniqueConstraints = {
    @UniqueConstraint(name = "uk_sub_period", columnNames = {"subscription_id", "period_start", "period_end"})
})
public class BillingPeriodRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private Subscription subscription;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @Column(name = "billing_date", nullable = false)
    private LocalDate billingDate;

    @Column(nullable = false, length = 30)
    private String status = "GENERATED";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public BillingPeriodRecord() {}

    public BillingPeriodRecord(Subscription subscription, LocalDate periodStart, LocalDate periodEnd, Long invoiceId, LocalDate billingDate) {
        this.subscription = subscription;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.invoiceId = invoiceId;
        this.billingDate = billingDate;
        this.status = "GENERATED";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Subscription getSubscription() {
        return subscription;
    }

    public void setSubscription(Subscription subscription) {
        this.subscription = subscription;
    }

    public LocalDate getPeriodStart() {
        return periodStart;
    }

    public void setPeriodStart(LocalDate periodStart) {
        this.periodStart = periodStart;
    }

    public LocalDate getPeriodEnd() {
        return periodEnd;
    }

    public void setPeriodEnd(LocalDate periodEnd) {
        this.periodEnd = periodEnd;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public LocalDate getBillingDate() {
        return billingDate;
    }

    public void setBillingDate(LocalDate billingDate) {
        this.billingDate = billingDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
