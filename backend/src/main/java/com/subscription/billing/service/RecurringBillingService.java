package com.subscription.billing.service;

import com.subscription.billing.dto.RecurringBillingRunResult;
import com.subscription.billing.entity.*;
import com.subscription.billing.repository.BillingPeriodRecordRepository;
import com.subscription.billing.repository.InvoiceRepository;
import com.subscription.billing.repository.TaxRuleRepository;
import com.subscription.model.BillingInterval;
import com.subscription.model.Customer;
import com.subscription.model.Product;
import com.subscription.model.Subscription;
import com.subscription.model.SubscriptionStatus;
import com.subscription.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class RecurringBillingService {

    private static final Logger log = LoggerFactory.getLogger(RecurringBillingService.class);
    private static final AtomicLong RECURRING_INV_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final BillingPeriodRecordRepository billingPeriodRecordRepository;
    private final TaxCalculationService taxCalculationService;

    public RecurringBillingService(SubscriptionRepository subscriptionRepository,
                                   InvoiceRepository invoiceRepository,
                                   BillingPeriodRecordRepository billingPeriodRecordRepository,
                                   TaxCalculationService taxCalculationService) {
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.billingPeriodRecordRepository = billingPeriodRecordRepository;
        this.taxCalculationService = taxCalculationService;
    }

    private synchronized String generateInvoiceNumber() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long seq = RECURRING_INV_SEQ.incrementAndGet();
        return String.format("INV-REC-%s-%04d", datePrefix, seq % 10000);
    }

    public RecurringBillingRunResult runRecurringBilling(LocalDate referenceDate) {
        if (referenceDate == null) {
            referenceDate = LocalDate.now();
        }

        log.info("Starting recurring billing run for reference date: {}", referenceDate);
        RecurringBillingRunResult result = new RecurringBillingRunResult(referenceDate);

        // Find subscriptions with status ACTIVE and nextBillingDate <= referenceDate
        List<Subscription> dueSubscriptions = subscriptionRepository.findDueSubscriptions(
                SubscriptionStatus.ACTIVE,
                referenceDate
        );

        result.setEligibleSubscriptionsCount(dueSubscriptions.size());
        log.info("Found {} active subscriptions due for billing on or before {}", dueSubscriptions.size(), referenceDate);

        for (Subscription sub : dueSubscriptions) {
            try {
                // Check if subscription has passed its end date
                if (sub.getEndDate() != null && sub.getNextBillingDate().isAfter(sub.getEndDate())) {
                    log.info("Subscription {} has reached end date {}. Marking EXPIRED.", sub.getSubscriptionNumber(), sub.getEndDate());
                    sub.setStatus(SubscriptionStatus.EXPIRED);
                    subscriptionRepository.save(sub);
                    continue;
                }

                Invoice generatedInvoice = processSingleSubscriptionBilling(sub);
                if (generatedInvoice != null) {
                    result.setGeneratedInvoicesCount(result.getGeneratedInvoicesCount() + 1);
                    result.getGeneratedInvoiceNumbers().add(generatedInvoice.getInvoiceNumber());
                } else {
                    result.setSkippedDuplicatesCount(result.getSkippedDuplicatesCount() + 1);
                }
            } catch (Exception ex) {
                log.error("Failed to process recurring billing for subscription {}: {}", sub.getSubscriptionNumber(), ex.getMessage(), ex);
                result.setFailedCount(result.getFailedCount() + 1);
                result.getErrorMessages().add("Subscription " + sub.getSubscriptionNumber() + ": " + ex.getMessage());
            }
        }

        log.info("Recurring billing run completed. Generated: {}, Skipped: {}, Failed: {}",
                result.getGeneratedInvoicesCount(), result.getSkippedDuplicatesCount(), result.getFailedCount());
        return result;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Invoice processSingleSubscriptionBilling(Subscription sub) {
        LocalDate periodStart = sub.getNextBillingDate();
        LocalDate periodEnd = calculatePeriodEnd(periodStart, sub.getBillingInterval());

        // 1. Check duplicate billing prevention
        if (billingPeriodRecordRepository.existsBySubscriptionIdAndPeriodStartAndPeriodEnd(sub.getId(), periodStart, periodEnd)) {
            log.warn("Invoice already exists for subscription {} in period {} to {}. Advancing next billing date to prevent re-billing.",
                    sub.getSubscriptionNumber(), periodStart, periodEnd);
            sub.setNextBillingDate(calculateNextBillingDate(periodStart, sub.getBillingInterval()));
            subscriptionRepository.save(sub);
            return null;
        }

        Customer customer = sub.getCustomer();
        Product product = sub.getProduct();

        // 2. Build Invoice
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setSubscription(sub);
        invoice.setCustomer(customer);
        invoice.setInvoiceDate(periodStart);
        invoice.setDueDate(periodStart.plusDays(14)); // Standard 14-day grace period
        invoice.setBillingPeriodStart(periodStart);
        invoice.setBillingPeriodEnd(periodEnd);
        invoice.setStatus(InvoiceStatus.CONFIRMED);
        invoice.setPaymentStatus(PaymentStatus.UNPAID);
        invoice.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        invoice.setNotes("Automated recurring billing for subscription " + sub.getSubscriptionNumber() + " (" + sub.getBillingInterval() + ")");

        // 3. Line items
        BigDecimal unitPrice = sub.getUnitPrice() != null ? sub.getUnitPrice() : product.getUnitPrice();
        int quantity = sub.getQuantity() != null && sub.getQuantity() > 0 ? sub.getQuantity() : 1;
        InvoiceLine line = new InvoiceLine(
                product.getId(),
                product.getName(),
                "Subscription recurring fee (" + sub.getBillingInterval() + "): " + periodStart + " to " + periodEnd,
                quantity,
                unitPrice.setScale(2, RoundingMode.HALF_UP)
        );
        invoice.addLine(line);

        BigDecimal subtotal = line.getSubtotal().setScale(2, RoundingMode.HALF_UP);
        invoice.setSubtotal(subtotal);
        invoice.setDiscountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));

        // 4. Configurable tax calculation
        TaxRule taxRule = taxCalculationService.determineApplicableTaxRule(customer.getCountry(), customer.getState());
        BigDecimal taxRate = taxRule != null ? taxRule.getRatePercentage() : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = taxCalculationService.calculateTaxAmount(subtotal, taxRate);

        invoice.setTaxRate(taxRate);
        invoice.setTaxAmount(taxAmount);
        invoice.setTaxRuleName(taxRule != null ? taxRule.getRuleName() : "None");

        BigDecimal totalAmount = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        invoice.setTotalAmount(totalAmount);
        invoice.setOutstandingBalance(totalAmount);

        // 5. Persist Invoice
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 6. Record Billing Period (Protected by unique constraint uk_sub_period)
        try {
            BillingPeriodRecord periodRecord = new BillingPeriodRecord(
                    sub,
                    periodStart,
                    periodEnd,
                    savedInvoice.getId(),
                    LocalDate.now()
            );
            billingPeriodRecordRepository.save(periodRecord);
        } catch (DataIntegrityViolationException ex) {
            log.error("Concurrent billing race detected for subscription {} period {} to {}", sub.getId(), periodStart, periodEnd);
            throw new IllegalStateException("Duplicate billing cycle detected: " + ex.getMessage(), ex);
        }

        // 7. Advance subscription next billing date
        LocalDate nextBilling = calculateNextBillingDate(periodStart, sub.getBillingInterval());
        sub.setNextBillingDate(nextBilling);
        subscriptionRepository.save(sub);

        log.info("Generated recurring invoice {} for subscription {}, next billing date: {}",
                savedInvoice.getInvoiceNumber(), sub.getSubscriptionNumber(), nextBilling);
        return savedInvoice;
    }

    public LocalDate calculatePeriodEnd(LocalDate start, BillingInterval interval) {
        switch (interval) {
            case DAILY:
                return start;
            case WEEKLY:
                return start.plusDays(6);
            case MONTHLY:
                return start.plusMonths(1).minusDays(1);
            case YEARLY:
                return start.plusYears(1).minusDays(1);
            default:
                return start.plusMonths(1).minusDays(1);
        }
    }

    public LocalDate calculateNextBillingDate(LocalDate current, BillingInterval interval) {
        switch (interval) {
            case DAILY:
                return current.plusDays(1);
            case WEEKLY:
                return current.plusWeeks(1);
            case MONTHLY:
                return current.plusMonths(1);
            case YEARLY:
                return current.plusYears(1);
            default:
                return current.plusMonths(1);
        }
    }
}
