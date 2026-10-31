package com.subscription.subscription.dto;

import com.subscription.subscription.entity.PaymentTerms;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class QuotationTemplateDTO {

    private Long templateId;

    @NotBlank(message = "Template name is required")
    private String templateName;

    private Long defaultPlanId;
    private String defaultPlanName;
    private PaymentTerms defaultPaymentTerms = PaymentTerms.NET_30;
    private BigDecimal defaultTaxRate = new BigDecimal("10.00");
    private String defaultNotes;
    private Boolean isActive = true;
    private LocalDateTime createdAt;

    public QuotationTemplateDTO() {
    }

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

    public Long getDefaultPlanId() {
        return defaultPlanId;
    }

    public void setDefaultPlanId(Long defaultPlanId) {
        this.defaultPlanId = defaultPlanId;
    }

    public String getDefaultPlanName() {
        return defaultPlanName;
    }

    public void setDefaultPlanName(String defaultPlanName) {
        this.defaultPlanName = defaultPlanName;
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
