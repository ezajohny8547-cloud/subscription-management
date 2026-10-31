package com.subscription.subscription.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled background worker that executes automatic subscription closures
 * according to plan configuration (e.g. expiry dates or completed billing cycles).
 */
@Component
public class SubscriptionLifecycleScheduler {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionLifecycleScheduler.class);
    private final SubscriptionService subscriptionService;

    public SubscriptionLifecycleScheduler(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    /**
     * Executes daily at midnight to process automatic closures according to plan settings.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void runDailyAutoClosure() {
        log.info("Starting automated subscription closure check...");
        int closed = subscriptionService.processAutomaticClosures();
        log.info("Completed automated subscription closure check. Closed {} subscriptions.", closed);
    }
}
