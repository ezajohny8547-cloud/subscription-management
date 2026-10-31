package com.subscription.billing.dto;

import java.math.BigDecimal;

public class TaxRuleResponse {

    private Long id;
    private String ruleName;
    private BigDecimal ratePercentage;
    private String country;
    private String state;
    private boolean active;
    private String description;

    public TaxRuleResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRuleName() {
        return ruleName;
    }

    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }

    public BigDecimal getRatePercentage() {
        return ratePercentage;
    }

    public void setRatePercentage(BigDecimal ratePercentage) {
        this.ratePercentage = ratePercentage;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
