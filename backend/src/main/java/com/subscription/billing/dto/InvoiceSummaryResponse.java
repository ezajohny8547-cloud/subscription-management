package com.subscription.billing.dto;

import java.math.BigDecimal;

public class InvoiceSummaryResponse {

    private long totalInvoices;
    private BigDecimal totalAmountSum;
    private BigDecimal totalPaidSum;
    private BigDecimal outstandingBalanceSum;
    private long draftCount;
    private long confirmedCount;
    private long paidCount;
    private long partiallyPaidCount;
    private long unpaidCount;
    private long overdueCount;
    private BigDecimal overdueAmountSum;

    public InvoiceSummaryResponse() {
        this.totalAmountSum = BigDecimal.ZERO;
        this.totalPaidSum = BigDecimal.ZERO;
        this.outstandingBalanceSum = BigDecimal.ZERO;
        this.overdueAmountSum = BigDecimal.ZERO;
    }

    public long getTotalInvoices() {
        return totalInvoices;
    }

    public void setTotalInvoices(long totalInvoices) {
        this.totalInvoices = totalInvoices;
    }

    public BigDecimal getTotalAmountSum() {
        return totalAmountSum;
    }

    public void setTotalAmountSum(BigDecimal totalAmountSum) {
        this.totalAmountSum = totalAmountSum;
    }

    public BigDecimal getTotalPaidSum() {
        return totalPaidSum;
    }

    public void setTotalPaidSum(BigDecimal totalPaidSum) {
        this.totalPaidSum = totalPaidSum;
    }

    public BigDecimal getOutstandingBalanceSum() {
        return outstandingBalanceSum;
    }

    public void setOutstandingBalanceSum(BigDecimal outstandingBalanceSum) {
        this.outstandingBalanceSum = outstandingBalanceSum;
    }

    public long getDraftCount() {
        return draftCount;
    }

    public void setDraftCount(long draftCount) {
        this.draftCount = draftCount;
    }

    public long getConfirmedCount() {
        return confirmedCount;
    }

    public void setConfirmedCount(long confirmedCount) {
        this.confirmedCount = confirmedCount;
    }

    public long getPaidCount() {
        return paidCount;
    }

    public void setPaidCount(long paidCount) {
        this.paidCount = paidCount;
    }

    public long getPartiallyPaidCount() {
        return partiallyPaidCount;
    }

    public void setPartiallyPaidCount(long partiallyPaidCount) {
        this.partiallyPaidCount = partiallyPaidCount;
    }

    public long getUnpaidCount() {
        return unpaidCount;
    }

    public void setUnpaidCount(long unpaidCount) {
        this.unpaidCount = unpaidCount;
    }

    public long getOverdueCount() {
        return overdueCount;
    }

    public void setOverdueCount(long overdueCount) {
        this.overdueCount = overdueCount;
    }

    public BigDecimal getOverdueAmountSum() {
        return overdueAmountSum;
    }

    public void setOverdueAmountSum(BigDecimal overdueAmountSum) {
        this.overdueAmountSum = overdueAmountSum;
    }
}
