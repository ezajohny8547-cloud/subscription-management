package com.subscription.subscription.entity;

import com.subscription.product.entity.Product;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Subscription Plan Entity defining recurring billing models and associated products.
 */
@Entity
@Table(name = "plans")
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    @NotBlank(message = "Plan name is required")
    @Column(name = "plan_name", nullable = false)
    private String planName;

    @NotBlank(message = "Plan code is required")
    @Column(name = "plan_code", nullable = false, unique = true, length = 100)
    private String planCode;

    @Lob
    @Column(name = "description")
    private String description;

    @NotNull(message = "Plan base recurring price is required")
    @DecimalMin(value = "0.01", message = "Plan price must be greater than zero")
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @NotNull(message = "Billing interval is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_interval", nullable = false, length = 50)
    private BillingInterval billingInterval;

    @NotNull(message = "Minimum quantity is required")
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    @Column(name = "minimum_quantity", nullable = false)
    private Integer minimumQuantity = 1;

    @NotNull(message = "Availability start date is required")
    @Column(name = "availability_start_date", nullable = false)
    private LocalDate availabilityStartDate;

    @NotNull(message = "Availability end date is required")
    @Column(name = "availability_end_date", nullable = false)
    private LocalDate availabilityEndDate;

    @Column(name = "auto_close", nullable = false)
    private Boolean autoClose = false;

    @Column(name = "auto_close_after_cycles")
    private Integer autoCloseAfterCycles;

    @NotNull(message = "Plan status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PlanStatus status = PlanStatus.ACTIVE;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "plan_products",
            joinColumns = @JoinColumn(name = "plan_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private Set<Product> associatedProducts = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Plan() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = PlanStatus.ACTIVE;
        }
        if (this.minimumQuantity == null) {
            this.minimumQuantity = 1;
        }
        if (this.autoClose == null) {
            this.autoClose = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Checks if this plan is currently available for customer subscription/quotation.
     */
    public boolean isAvailableOn(LocalDate date) {
        if (this.status != PlanStatus.ACTIVE) {
            return false;
        }
        if (date == null) {
            date = LocalDate.now();
        }
        return !date.isBefore(availabilityStartDate) && !date.isAfter(availabilityEndDate);
    }

    // Getters and Setters

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public BillingInterval getBillingInterval() {
        return billingInterval;
    }

    public void setBillingInterval(BillingInterval billingInterval) {
        this.billingInterval = billingInterval;
    }

    public Integer getMinimumQuantity() {
        return minimumQuantity;
    }

    public void setMinimumQuantity(Integer minimumQuantity) {
        this.minimumQuantity = minimumQuantity;
    }

    public LocalDate getAvailabilityStartDate() {
        return availabilityStartDate;
    }

    public void setAvailabilityStartDate(LocalDate availabilityStartDate) {
        this.availabilityStartDate = availabilityStartDate;
    }

    public LocalDate getAvailabilityEndDate() {
        return availabilityEndDate;
    }

    public void setAvailabilityEndDate(LocalDate availabilityEndDate) {
        this.availabilityEndDate = availabilityEndDate;
    }

    public Boolean getAutoClose() {
        return autoClose;
    }

    public void setAutoClose(Boolean autoClose) {
        this.autoClose = autoClose;
    }

    public Integer getAutoCloseAfterCycles() {
        return autoCloseAfterCycles;
    }

    public void setAutoCloseAfterCycles(Integer autoCloseAfterCycles) {
        this.autoCloseAfterCycles = autoCloseAfterCycles;
    }

    public PlanStatus getStatus() {
        return status;
    }

    public void setStatus(PlanStatus status) {
        this.status = status;
    }

    public Set<Product> getAssociatedProducts() {
        return associatedProducts;
    }

    public void setAssociatedProducts(Set<Product> associatedProducts) {
        this.associatedProducts = associatedProducts;
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
