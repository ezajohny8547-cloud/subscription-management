package com.subscription.dashboard.dto;

import java.math.BigDecimal;

public class ReportSummaryDTO {

    private BigDecimal totalInvoiced;
    private BigDecimal totalRevenue;
    private BigDecimal totalOutstanding;
    private long totalSubscriptions;
    private long activeSubscriptions;
    private long totalInvoices;
    private long overdueInvoices;

    public ReportSummaryDTO() {
    }

    public ReportSummaryDTO(BigDecimal totalInvoiced, BigDecimal totalRevenue, BigDecimal totalOutstanding,
                            long totalSubscriptions, long activeSubscriptions, long totalInvoices, long overdueInvoices) {
        this.totalInvoiced = totalInvoiced;
        this.totalRevenue = totalRevenue;
        this.totalOutstanding = totalOutstanding;
        this.totalSubscriptions = totalSubscriptions;
        this.activeSubscriptions = activeSubscriptions;
        this.totalInvoices = totalInvoices;
        this.overdueInvoices = overdueInvoices;
    }

    public BigDecimal getTotalInvoiced() {
        return totalInvoiced;
    }

    public void setTotalInvoiced(BigDecimal totalInvoiced) {
        this.totalInvoiced = totalInvoiced;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public BigDecimal getTotalOutstanding() {
        return totalOutstanding;
    }

    public void setTotalOutstanding(BigDecimal totalOutstanding) {
        this.totalOutstanding = totalOutstanding;
    }

    public long getTotalSubscriptions() {
        return totalSubscriptions;
    }

    public void setTotalSubscriptions(long totalSubscriptions) {
        this.totalSubscriptions = totalSubscriptions;
    }

    public long getActiveSubscriptions() {
        return activeSubscriptions;
    }

    public void setActiveSubscriptions(long activeSubscriptions) {
        this.activeSubscriptions = activeSubscriptions;
    }

    public long getTotalInvoices() {
        return totalInvoices;
    }

    public void setTotalInvoices(long totalInvoices) {
        this.totalInvoices = totalInvoices;
    }

    public long getOverdueInvoices() {
        return overdueInvoices;
    }

    public void setOverdueInvoices(long overdueInvoices) {
        this.overdueInvoices = overdueInvoices;
    }
}
