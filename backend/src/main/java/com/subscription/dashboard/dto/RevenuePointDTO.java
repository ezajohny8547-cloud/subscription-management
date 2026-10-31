package com.subscription.dashboard.dto;

import java.math.BigDecimal;

public class RevenuePointDTO {

    private String period;
    private BigDecimal revenue;
    private BigDecimal invoiced;

    public RevenuePointDTO() {
    }

    public RevenuePointDTO(String period, BigDecimal revenue, BigDecimal invoiced) {
        this.period = period;
        this.revenue = revenue;
        this.invoiced = invoiced;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public BigDecimal getInvoiced() {
        return invoiced;
    }

    public void setInvoiced(BigDecimal invoiced) {
        this.invoiced = invoiced;
    }
}
