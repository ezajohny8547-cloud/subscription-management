package com.subscription.dashboard.dto;

import java.math.BigDecimal;

public class DashboardStatsDTO {

    private long activeSubscriptions;
    private BigDecimal totalInvoiced;
    private BigDecimal revenueReceived;
    private BigDecimal outstandingBalances;
    private long overdueInvoices;
    private long upcomingRenewals;
    private double activeSubGrowthPercent;
    private double revenueGrowthPercent;

    public DashboardStatsDTO() {
    }

    public DashboardStatsDTO(long activeSubscriptions, BigDecimal totalInvoiced, BigDecimal revenueReceived,
                             BigDecimal outstandingBalances, long overdueInvoices, long upcomingRenewals,
                             double activeSubGrowthPercent, double revenueGrowthPercent) {
        this.activeSubscriptions = activeSubscriptions;
        this.totalInvoiced = totalInvoiced;
        this.revenueReceived = revenueReceived;
        this.outstandingBalances = outstandingBalances;
        this.overdueInvoices = overdueInvoices;
        this.upcomingRenewals = upcomingRenewals;
        this.activeSubGrowthPercent = activeSubGrowthPercent;
        this.revenueGrowthPercent = revenueGrowthPercent;
    }

    public long getActiveSubscriptions() {
        return activeSubscriptions;
    }

    public void setActiveSubscriptions(long activeSubscriptions) {
        this.activeSubscriptions = activeSubscriptions;
    }

    public BigDecimal getTotalInvoiced() {
        return totalInvoiced;
    }

    public void setTotalInvoiced(BigDecimal totalInvoiced) {
        this.totalInvoiced = totalInvoiced;
    }

    public BigDecimal getRevenueReceived() {
        return revenueReceived;
    }

    public void setRevenueReceived(BigDecimal revenueReceived) {
        this.revenueReceived = revenueReceived;
    }

    public BigDecimal getOutstandingBalances() {
        return outstandingBalances;
    }

    public void setOutstandingBalances(BigDecimal outstandingBalances) {
        this.outstandingBalances = outstandingBalances;
    }

    public long getOverdueInvoices() {
        return overdueInvoices;
    }

    public void setOverdueInvoices(long overdueInvoices) {
        this.overdueInvoices = overdueInvoices;
    }

    public long getUpcomingRenewals() {
        return upcomingRenewals;
    }

    public void setUpcomingRenewals(long upcomingRenewals) {
        this.upcomingRenewals = upcomingRenewals;
    }

    public double getActiveSubGrowthPercent() {
        return activeSubGrowthPercent;
    }

    public void setActiveSubGrowthPercent(double activeSubGrowthPercent) {
        this.activeSubGrowthPercent = activeSubGrowthPercent;
    }

    public double getRevenueGrowthPercent() {
        return revenueGrowthPercent;
    }

    public void setRevenueGrowthPercent(double revenueGrowthPercent) {
        this.revenueGrowthPercent = revenueGrowthPercent;
    }
}
