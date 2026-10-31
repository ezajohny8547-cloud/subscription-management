package com.subscription.dashboard.dto;

import java.math.BigDecimal;

public class DistributionDTO {

    private String label;
    private long count;
    private BigDecimal amount;
    private double percentage;

    public DistributionDTO() {
    }

    public DistributionDTO(String label, long count, BigDecimal amount, double percentage) {
        this.label = label;
        this.count = count;
        this.amount = amount;
        this.percentage = percentage;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }
}
