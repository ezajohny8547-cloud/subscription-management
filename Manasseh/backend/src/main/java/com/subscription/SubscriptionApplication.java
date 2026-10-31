package com.subscription;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot Application entrypoint for Subscription Management System.
 * Enables scheduling for automated subscription lifecycle maintenance (auto-closure).
 */
@SpringBootApplication
@EnableScheduling
public class SubscriptionApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubscriptionApplication.class, args);
    }
}
