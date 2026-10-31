package com.subscription.subscription.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Reusable Quotation Template for fast creation of standardized quotations.
 */
@Entity
@Table(name = "quotation_templates")
public class QuotationTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_id")
    private Long templateId;

    @NotBlank(message = "Template name is required")
    @Column(name = "template_name", nullable = false)
    private String templateName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "default_plan_id")
    private Plan defaultPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_payment_terms", nullable = false, length = 50)
    private PaymentTerms defaultPaymentTerms = PaymentTerms.NET_30;

    @Column(name = "default_tax_rate", precision = 5, scale = 2)
    private BigDecimal defaultTaxRate = new BigDecimal("10.00");

    @Lob
    @Column(name = "default_notes")
    private String defaultNotes;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public QuotationTemplate() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.defaultPaymentTerms == null) {
            this.defaultPaymentTerms = PaymentTerms.NET_30;
        }
        if (this.defaultTaxRate == null) {
            this.defaultTaxRate = new BigDecimal("10.00");
        }
    }

    // Getters and Setters

    public Long getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Long templateId) {
        this.templateId = templateId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public Plan getDefaultPlan() {
        return defaultPlan;
    }

    public void setDefaultPlan(Plan defaultPlan) {
        this.defaultPlan = defaultPlan;
    }

    public PaymentTerms getDefaultPaymentTerms() {
        return defaultPaymentTerms;
    }

    public void setDefaultPaymentTerms(PaymentTerms defaultPaymentTerms) {
        this.defaultPaymentTerms = defaultPaymentTerms;
    }

    public BigDecimal getDefaultTaxRate() {
        return defaultTaxRate;
    }

    public void setDefaultTaxRate(BigDecimal defaultTaxRate) {
        this.defaultTaxRate = defaultTaxRate;
    }

    public String getDefaultNotes() {
        return defaultNotes;
    }

    public void setDefaultNotes(String defaultNotes) {
        this.defaultNotes = defaultNotes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
