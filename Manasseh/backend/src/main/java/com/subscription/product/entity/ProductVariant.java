package com.subscription.product.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * ProductVariant Entity representing product variations (Brand, Storage, Color, Tier, etc.)
 * with configurable price adjustments (e.g. +560.00 for a particular brand).
 */
@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "variant_id")
    private Long variantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonBackReference
    private Product product;

    @NotBlank(message = "Variant name is required")
    @Column(name = "variant_name", nullable = false)
    private String variantName;

    @NotBlank(message = "Variant type is required (e.g. BRAND, STORAGE, TIER)")
    @Column(name = "variant_type", nullable = false, length = 100)
    private String variantType;

    @NotBlank(message = "Variant value is required (e.g. Acme, 1TB, Enterprise)")
    @Column(name = "variant_value", nullable = false, length = 100)
    private String variantValue;

    @NotNull(message = "Price adjustment cannot be null")
    @Column(name = "price_adjustment", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAdjustment = BigDecimal.ZERO;

    @Column(name = "sku", unique = true, length = 100)
    private String sku;

    @Column(name = "stock_quantity")
    private Integer stockQuantity = 0;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ProductVariant() {
    }

    public ProductVariant(Product product, String variantName, String variantType, String variantValue, BigDecimal priceAdjustment, String sku, Integer stockQuantity, Boolean isAvailable) {
        this.product = product;
        this.variantName = variantName;
        this.variantType = variantType;
        this.variantValue = variantValue;
        this.priceAdjustment = priceAdjustment != null ? priceAdjustment : BigDecimal.ZERO;
        this.sku = sku;
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.isAvailable = isAvailable != null ? isAvailable : true;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.priceAdjustment == null) {
            this.priceAdjustment = BigDecimal.ZERO;
        }
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        if (this.isAvailable == null) {
            this.isAvailable = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Calculates total effective price for this product variant.
     */
    public BigDecimal calculateEffectivePrice() {
        if (product == null || product.getSalesPrice() == null) {
            return priceAdjustment != null ? priceAdjustment : BigDecimal.ZERO;
        }
        return product.getSalesPrice().add(priceAdjustment != null ? priceAdjustment : BigDecimal.ZERO);
    }

    // Getters and Setters

    public Long getVariantId() {
        return variantId;
    }

    public void setVariantId(Long variantId) {
        this.variantId = variantId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getVariantName() {
        return variantName;
    }

    public void setVariantName(String variantName) {
        this.variantName = variantName;
    }

    public String getVariantType() {
        return variantType;
    }

    public void setVariantType(String variantType) {
        this.variantType = variantType;
    }

    public String getVariantValue() {
        return variantValue;
    }

    public void setVariantValue(String variantValue) {
        this.variantValue = variantValue;
    }

    public BigDecimal getPriceAdjustment() {
        return priceAdjustment;
    }

    public void setPriceAdjustment(BigDecimal priceAdjustment) {
        this.priceAdjustment = priceAdjustment;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public Boolean getIsAvailable() {
        return isAvailable;
    }

    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
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
