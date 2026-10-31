package com.subscription.subscription.dto;

import com.subscription.product.dto.ProductDTO;
import com.subscription.subscription.entity.BillingInterval;
import com.subscription.subscription.entity.PlanStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Data Transfer Object for Plan entity.
 */
public class PlanDTO {

    private Long planId;

    @NotBlank(message = "Plan name is required")
    private String planName;

    @NotBlank(message = "Plan code is required")
    private String planCode;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    private BigDecimal price;

    @NotNull(message = "Billing interval is required")
    private BillingInterval billingInterval;

    @NotNull(message = "Minimum quantity is required")
    @Min(value = 1, message = "Minimum quantity must be at least 1")
    private Integer minimumQuantity = 1;

    @NotNull(message = "Availability start date is required")
    private LocalDate availabilityStartDate;

    @NotNull(message = "Availability end date is required")
    private LocalDate availabilityEndDate;

    private Boolean autoClose = false;
    private Integer autoCloseAfterCycles;

    @NotNull(message = "Status is required")
    private PlanStatus status = PlanStatus.ACTIVE;

    private Boolean isCurrentlyAvailable;
    private Set<Long> productIds = new HashSet<>();
    private List<ProductDTO> associatedProducts = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PlanDTO() {
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

    public Boolean getIsCurrentlyAvailable() {
        return isCurrentlyAvailable;
    }

    public void setIsCurrentlyAvailable(Boolean isCurrentlyAvailable) {
        this.isCurrentlyAvailable = isCurrentlyAvailable;
    }

    public Set<Long> getProductIds() {
        return productIds;
    }

    public void setProductIds(Set<Long> productIds) {
        this.productIds = productIds;
    }

    public List<ProductDTO> getAssociatedProducts() {
        return associatedProducts;
    }

    public void setAssociatedProducts(List<ProductDTO> associatedProducts) {
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
