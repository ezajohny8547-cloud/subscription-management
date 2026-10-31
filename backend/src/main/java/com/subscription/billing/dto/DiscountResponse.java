package com.subscription.billing.dto;

import com.subscription.billing.entity.DiscountType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DiscountResponse {

    private Long id;
    private String code;
    private String description;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minPurchaseAmount;
    private Integer minQuantity;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxUsageCount;
    private Integer currentUsageCount;
    private Long applicableProductId;
    private String applicableProductName;
    private Long applicableSubscriptionId;
    private String applicableSubscriptionNumber;
    private boolean active;
    private boolean expired;
    private boolean exhausted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DiscountResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DiscountType getDiscountType() {
        return discountType;
    }

    public void setDiscountType(DiscountType discountType) {
        this.discountType = discountType;
    }

    public BigDecimal getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(BigDecimal discountValue) {
        this.discountValue = discountValue;
    }

    public BigDecimal getMinPurchaseAmount() {
        return minPurchaseAmount;
    }

    public void setMinPurchaseAmount(BigDecimal minPurchaseAmount) {
        this.minPurchaseAmount = minPurchaseAmount;
    }

    public Integer getMinQuantity() {
        return minQuantity;
    }

    public void setMinQuantity(Integer minQuantity) {
        this.minQuantity = minQuantity;
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

    public Integer getMaxUsageCount() {
        return maxUsageCount;
    }

    public void setMaxUsageCount(Integer maxUsageCount) {
        this.maxUsageCount = maxUsageCount;
    }

    public Integer getCurrentUsageCount() {
        return currentUsageCount;
    }

    public void setCurrentUsageCount(Integer currentUsageCount) {
        this.currentUsageCount = currentUsageCount;
    }

    public Long getApplicableProductId() {
        return applicableProductId;
    }

    public void setApplicableProductId(Long applicableProductId) {
        this.applicableProductId = applicableProductId;
    }

    public String getApplicableProductName() {
        return applicableProductName;
    }

    public void setApplicableProductName(String applicableProductName) {
        this.applicableProductName = applicableProductName;
    }

    public Long getApplicableSubscriptionId() {
        return applicableSubscriptionId;
    }

    public void setApplicableSubscriptionId(Long applicableSubscriptionId) {
        this.applicableSubscriptionId = applicableSubscriptionId;
    }

    public String getApplicableSubscriptionNumber() {
        return applicableSubscriptionNumber;
    }

    public void setApplicableSubscriptionNumber(String applicableSubscriptionNumber) {
        this.applicableSubscriptionNumber = applicableSubscriptionNumber;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isExpired() {
        return expired;
    }

    public void setExpired(boolean expired) {
        this.expired = expired;
    }

    public boolean isExhausted() {
        return exhausted;
    }

    public void setExhausted(boolean exhausted) {
        this.exhausted = exhausted;
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
