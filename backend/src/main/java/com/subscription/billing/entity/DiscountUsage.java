package com.subscription.billing.entity;

import com.subscription.model.Customer;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "discount_usages")
public class DiscountUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_id", nullable = false)
    private Discount discount;

    @Column(name = "invoice_id", nullable = false)
    private Long invoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "amount_deducted", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountDeducted;

    @Column(name = "used_at", updatable = false)
    private LocalDateTime usedAt;

    public DiscountUsage() {}

    public DiscountUsage(Discount discount, Long invoiceId, Customer customer, BigDecimal amountDeducted) {
        this.discount = discount;
        this.invoiceId = invoiceId;
        this.customer = customer;
        this.amountDeducted = amountDeducted;
    }

    @PrePersist
    protected void onCreate() {
        this.usedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Discount getDiscount() {
        return discount;
    }

    public void setDiscount(Discount discount) {
        this.discount = discount;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public BigDecimal getAmountDeducted() {
        return amountDeducted;
    }

    public void setAmountDeducted(BigDecimal amountDeducted) {
        this.amountDeducted = amountDeducted;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }
}
