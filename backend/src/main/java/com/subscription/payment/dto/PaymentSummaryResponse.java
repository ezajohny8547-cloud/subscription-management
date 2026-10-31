package com.subscription.payment.dto;

import java.math.BigDecimal;

public class PaymentSummaryResponse {

    private long totalPaymentsCount;
    private BigDecimal totalAmountCollected;

    public PaymentSummaryResponse() {
        this.totalAmountCollected = BigDecimal.ZERO;
    }

    public PaymentSummaryResponse(long totalPaymentsCount, BigDecimal totalAmountCollected) {
        this.totalPaymentsCount = totalPaymentsCount;
        this.totalAmountCollected = totalAmountCollected != null ? totalAmountCollected : BigDecimal.ZERO;
    }

    public long getTotalPaymentsCount() {
        return totalPaymentsCount;
    }

    public void setTotalPaymentsCount(long totalPaymentsCount) {
        this.totalPaymentsCount = totalPaymentsCount;
    }

    public BigDecimal getTotalAmountCollected() {
        return totalAmountCollected;
    }

    public void setTotalAmountCollected(BigDecimal totalAmountCollected) {
        this.totalAmountCollected = totalAmountCollected;
    }
}
