package com.subscription.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ReportRowDTO {

    private Long subscriptionId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String planName;
    private String subscriptionStatus;
    private LocalDate startDate;
    private LocalDate endDate;
    private String invoiceNumber;
    private BigDecimal invoicedAmount;
    private BigDecimal paidAmount;
    private BigDecimal outstandingAmount;
    private String invoiceStatus;
    private LocalDate dueDate;

    public ReportRowDTO() {
    }

    public ReportRowDTO(Long subscriptionId, Long customerId, String customerName, String customerEmail,
                        String planName, String subscriptionStatus, LocalDate startDate, LocalDate endDate,
                        String invoiceNumber, BigDecimal invoicedAmount, BigDecimal paidAmount,
                        BigDecimal outstandingAmount, String invoiceStatus, LocalDate dueDate) {
        this.subscriptionId = subscriptionId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.planName = planName;
        this.subscriptionStatus = subscriptionStatus;
        this.startDate = startDate;
        this.endDate = endDate;
        this.invoiceNumber = invoiceNumber;
        this.invoicedAmount = invoicedAmount;
        this.paidAmount = paidAmount;
        this.outstandingAmount = outstandingAmount;
        this.invoiceStatus = invoiceStatus;
        this.dueDate = dueDate;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public BigDecimal getInvoicedAmount() {
        return invoicedAmount;
    }

    public void setInvoicedAmount(BigDecimal invoicedAmount) {
        this.invoicedAmount = invoicedAmount;
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

    public String getInvoiceStatus() {
        return invoiceStatus;
    }

    public void setInvoiceStatus(String invoiceStatus) {
        this.invoiceStatus = invoiceStatus;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
