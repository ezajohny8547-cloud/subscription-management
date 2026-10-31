package com.subscription.billing;

import com.subscription.billing.dto.RecurringBillingRunResult;
import com.subscription.billing.entity.BillingPeriodRecord;
import com.subscription.billing.entity.Invoice;
import com.subscription.billing.repository.BillingPeriodRecordRepository;
import com.subscription.billing.repository.InvoiceRepository;
import com.subscription.billing.service.RecurringBillingService;
import com.subscription.model.*;
import com.subscription.repository.CustomerRepository;
import com.subscription.repository.ProductRepository;
import com.subscription.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DuplicateBillingPreventionTest {

    @Autowired
    private RecurringBillingService recurringBillingService;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BillingPeriodRecordRepository billingPeriodRecordRepository;

    private Customer customer;
    private Product monthlyProduct;
    private Product weeklyProduct;

    @BeforeEach
    void setUp() {
        billingPeriodRecordRepository.deleteAll();
        invoiceRepository.deleteAll();
        subscriptionRepository.deleteAll();

        customer = new Customer("Billing Corp", "billing@corp.com", "456 Wall St", "US", "NY");
        customer = customerRepository.save(customer);

        monthlyProduct = new Product("PROD-MONTHLY", "Monthly Plan", new BigDecimal("50.00"), BillingInterval.MONTHLY);
        monthlyProduct = productRepository.save(monthlyProduct);

        weeklyProduct = new Product("PROD-WEEKLY", "Weekly Plan", new BigDecimal("15.00"), BillingInterval.WEEKLY);
        weeklyProduct = productRepository.save(weeklyProduct);
    }

    @Test
    @DisplayName("Duplicate Billing Prevention: Same Subscription and Period Is Not Billed Twice")
    void testDuplicateBillingPrevention() {
        LocalDate billingDate = LocalDate.of(2026, 11, 1);

        Subscription sub = new Subscription();
        sub.setSubscriptionNumber("SUB-DUP-001");
        sub.setCustomer(customer);
        sub.setProduct(monthlyProduct);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setBillingInterval(BillingInterval.MONTHLY);
        sub.setUnitPrice(new BigDecimal("50.00"));
        sub.setQuantity(1);
        sub.setStartDate(billingDate);
        sub.setNextBillingDate(billingDate);
        sub = subscriptionRepository.save(sub);

        // First run: Should generate invoice
        RecurringBillingRunResult firstRun = recurringBillingService.runRecurringBilling(billingDate);
        assertEquals(1, firstRun.getEligibleSubscriptionsCount());
        assertEquals(1, firstRun.getGeneratedInvoicesCount());
        assertEquals(0, firstRun.getSkippedDuplicatesCount());

        List<BillingPeriodRecord> records = billingPeriodRecordRepository.findAll();
        assertEquals(1, records.size());
        assertEquals(billingDate, records.get(0).getPeriodStart());
        assertEquals(LocalDate.of(2026, 11, 30), records.get(0).getPeriodEnd());

        // Check that next billing date was advanced to 2026-12-01
        Subscription updatedSub = subscriptionRepository.findById(sub.getId()).orElseThrow();
        assertEquals(LocalDate.of(2026, 12, 1), updatedSub.getNextBillingDate());

        // Re-run with the same billing date: Subscription is no longer due because next billing date is December
        RecurringBillingRunResult secondRun = recurringBillingService.runRecurringBilling(billingDate);
        assertEquals(0, secondRun.getEligibleSubscriptionsCount());
        assertEquals(0, secondRun.getGeneratedInvoicesCount());

        // If someone artificially resets next billing date back to November 1st, the unique billing period record blocks re-billing
        updatedSub.setNextBillingDate(billingDate);
        subscriptionRepository.save(updatedSub);

        RecurringBillingRunResult thirdRun = recurringBillingService.runRecurringBilling(billingDate);
        assertEquals(1, thirdRun.getEligibleSubscriptionsCount());
        assertEquals(0, thirdRun.getGeneratedInvoicesCount());
        assertEquals(1, thirdRun.getSkippedDuplicatesCount());

        // Total invoices generated must still be only 1
        assertEquals(1, invoiceRepository.findAll().size());
    }

    @Test
    @DisplayName("Recurring Billing Ignores Ineligible / Cancelled Subscriptions")
    void testIgnoresCancelledSubscriptions() {
        LocalDate billingDate = LocalDate.of(2026, 11, 1);

        Subscription cancelledSub = new Subscription();
        cancelledSub.setSubscriptionNumber("SUB-CANCELLED-001");
        cancelledSub.setCustomer(customer);
        cancelledSub.setProduct(monthlyProduct);
        cancelledSub.setStatus(SubscriptionStatus.CANCELLED);
        cancelledSub.setBillingInterval(BillingInterval.MONTHLY);
        cancelledSub.setUnitPrice(new BigDecimal("50.00"));
        cancelledSub.setQuantity(1);
        cancelledSub.setStartDate(billingDate.minusMonths(2));
        cancelledSub.setNextBillingDate(billingDate);
        subscriptionRepository.save(cancelledSub);

        RecurringBillingRunResult run = recurringBillingService.runRecurringBilling(billingDate);
        assertEquals(0, run.getEligibleSubscriptionsCount());
        assertEquals(0, run.getGeneratedInvoicesCount());
        assertEquals(0, invoiceRepository.findAll().size());
    }

    @Test
    @DisplayName("Support for Weekly and Daily Billing Intervals")
    void testWeeklyIntervalBilling() {
        LocalDate billingDate = LocalDate.of(2026, 11, 1);

        Subscription weeklySub = new Subscription();
        weeklySub.setSubscriptionNumber("SUB-WEEKLY-001");
        weeklySub.setCustomer(customer);
        weeklySub.setProduct(weeklyProduct);
        weeklySub.setStatus(SubscriptionStatus.ACTIVE);
        weeklySub.setBillingInterval(BillingInterval.WEEKLY);
        weeklySub.setUnitPrice(new BigDecimal("15.00"));
        weeklySub.setQuantity(1);
        weeklySub.setStartDate(billingDate);
        weeklySub.setNextBillingDate(billingDate);
        weeklySub = subscriptionRepository.save(weeklySub);

        RecurringBillingRunResult run = recurringBillingService.runRecurringBilling(billingDate);
        assertEquals(1, run.getGeneratedInvoicesCount());

        Subscription afterRun = subscriptionRepository.findById(weeklySub.getId()).orElseThrow();
        // 7 days later: 2026-11-08
        assertEquals(LocalDate.of(2026, 11, 8), afterRun.getNextBillingDate());
    }
}

