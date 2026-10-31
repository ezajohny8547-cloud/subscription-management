package com.subscription.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CustomerInvoiceDTO {

    private Long id;
    private String invoiceNumber;
    private Long subscriptionId;
    private String planName;
    private BigDecimal amount;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstandingAmount;
    private String status;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private LocalDate paidDate;

    public CustomerInvoiceDTO() {
    }

    public CustomerInvoiceDTO(Long id, String invoiceNumber, Long subscriptionId, String planName,
                              BigDecimal amount, BigDecimal tax, BigDecimal totalAmount,
                              BigDecimal paidAmount, BigDecimal outstandingAmount, String status,
                              LocalDate issueDate, LocalDate dueDate, LocalDate paidDate) {
        this.id = id;
        this.invoiceNumber = invoiceNumber;
        this.subscriptionId = subscriptionId;
        this.planName = planName;
        this.amount = amount;
        this.tax = tax;
        this.totalAmount = totalAmount;
        this.paidAmount = paidAmount;
        this.outstandingAmount = outstandingAmount;
        this.status = status;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.paidDate = paidDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public void setTax(BigDecimal tax) {
        this.tax = tax;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(BigDecimal paidAmount) {
        this.paidAmount = paidAmount;
    }

    public BigDecimal getOutstandingAmount() {
        return outstandingAmount;
    }

    public void setOutstandingAmount(BigDecimal outstandingAmount) {
        this.outstandingAmount = outstandingAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getPaidDate() {
        return paidDate;
    }

    public void setPaidDate(LocalDate paidDate) {
        this.paidDate = paidDate;
    }
}
