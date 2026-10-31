package com.subscription.payment.dto;

import com.subscription.billing.entity.InvoiceStatus;
import com.subscription.payment.entity.PaymentMethod;
import com.subscription.payment.entity.PaymentRecordStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentResponse {

    private Long id;
    private String paymentReference;
    private Long invoiceId;
    private String invoiceNumber;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String notes;
    private PaymentRecordStatus status;
    private BigDecimal outstandingBalanceAfterPayment;
    private InvoiceStatus invoiceStatusAfterPayment;
    private LocalDateTime createdAt;

    public PaymentResponse() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(Long invoiceId) {
        this.invoiceId = invoiceId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public PaymentRecordStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentRecordStatus status) {
        this.status = status;
    }

    public BigDecimal getOutstandingBalanceAfterPayment() {
        return outstandingBalanceAfterPayment;
    }

    public void setOutstandingBalanceAfterPayment(BigDecimal outstandingBalanceAfterPayment) {
        this.outstandingBalanceAfterPayment = outstandingBalanceAfterPayment;
    }

    public InvoiceStatus getInvoiceStatusAfterPayment() {
        return invoiceStatusAfterPayment;
    }

    public void setInvoiceStatusAfterPayment(InvoiceStatus invoiceStatusAfterPayment) {
        this.invoiceStatusAfterPayment = invoiceStatusAfterPayment;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
