package com.subscription.billing.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class RecurringBillingRunResult {

    private LocalDate runDate;
    private int eligibleSubscriptionsCount;
    private int generatedInvoicesCount;
    private int skippedDuplicatesCount;
    private int failedCount;
    private List<String> generatedInvoiceNumbers = new ArrayList<>();
    private List<String> errorMessages = new ArrayList<>();

    public RecurringBillingRunResult() {}

    public RecurringBillingRunResult(LocalDate runDate) {
        this.runDate = runDate;
    }

    public LocalDate getRunDate() {
        return runDate;
    }

    public void setRunDate(LocalDate runDate) {
        this.runDate = runDate;
    }

    public int getEligibleSubscriptionsCount() {
        return eligibleSubscriptionsCount;
    }

    public void setEligibleSubscriptionsCount(int eligibleSubscriptionsCount) {
        this.eligibleSubscriptionsCount = eligibleSubscriptionsCount;
    }

    public int getGeneratedInvoicesCount() {
        return generatedInvoicesCount;
    }

    public void setGeneratedInvoicesCount(int generatedInvoicesCount) {
        this.generatedInvoicesCount = generatedInvoicesCount;
    }

    public int getSkippedDuplicatesCount() {
        return skippedDuplicatesCount;
    }

    public void setSkippedDuplicatesCount(int skippedDuplicatesCount) {
        this.skippedDuplicatesCount = skippedDuplicatesCount;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(int failedCount) {
        this.failedCount = failedCount;
    }

    public List<String> getGeneratedInvoiceNumbers() {
        return generatedInvoiceNumbers;
    }

    public void setGeneratedInvoiceNumbers(List<String> generatedInvoiceNumbers) {
        this.generatedInvoiceNumbers = generatedInvoiceNumbers;
    }

    public List<String> getErrorMessages() {
        return errorMessages;
    }

    public void setErrorMessages(List<String> errorMessages) {
        this.errorMessages = errorMessages;
    }
}
