package com.subscription.billing.scheduler;

import com.subscription.billing.dto.RecurringBillingRunResult;
import com.subscription.billing.service.RecurringBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@ConditionalOnProperty(name = "billing.enabled", havingValue = "true", matchIfMissing = true)
public class BillingScheduler {

    private static final Logger log = LoggerFactory.getLogger(BillingScheduler.class);

    private final RecurringBillingService recurringBillingService;

    public BillingScheduler(RecurringBillingService recurringBillingService) {
        this.recurringBillingService = recurringBillingService;
    }

    /**
     * Executes the daily recurring billing cycle according to the configured cron.
     * Default cron: 0 0 2 * * ? (2:00 AM daily)
     */
    @Scheduled(cron = "${billing.cron:0 0 2 * * ?}")
    public void executeDailyRecurringBilling() {
        log.info("Executing scheduled recurring billing cycle at: {}", LocalDate.now());
        try {
            RecurringBillingRunResult result = recurringBillingService.runRecurringBilling(LocalDate.now());
            log.info("Scheduled recurring billing completed. Generated: {}, Skipped: {}, Failed: {}",
                    result.getGeneratedInvoicesCount(),
                    result.getSkippedDuplicatesCount(),
                    result.getFailedCount());
        } catch (Exception ex) {
            log.error("Fatal error during scheduled recurring billing execution: {}", ex.getMessage(), ex);
        }
    }
}
