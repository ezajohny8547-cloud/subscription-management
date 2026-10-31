package com.subscription.data;

import com.subscription.entity.*;
import com.subscription.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PlanRepository planRepository,
                           SubscriptionRepository subscriptionRepository,
                           InvoiceRepository invoiceRepository,
                           PaymentRepository paymentRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        logger.info("Checking database state in subscription_management...");

        // Ensure Admin user exists with valid credentials
        String adminPass = passwordEncoder.encode("Admin@12345");
        User admin = userRepository.findByEmail("admin@subscription.com")
                .orElseGet(() -> userRepository.save(new User("System Administrator", "admin@subscription.com", adminPass, Role.ADMIN, UserStatus.ACTIVE)));
        admin.setPassword(adminPass);
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        userRepository.save(admin);

        if (planRepository.count() > 0) {
            logger.info("Plans and telemetry already present. Skipping sample data population.");
            return;
        }

        logger.info("Populating sample data across Modules 1, 2, 3, and 4...");

        String defaultPass = passwordEncoder.encode("Password@123");

        User manager = userRepository.findByEmail("manager@subscription.com")
                .orElseGet(() -> userRepository.save(new User("Operations Manager", "manager@subscription.com", defaultPass, Role.MANAGER, UserStatus.ACTIVE)));

        User staff = userRepository.findByEmail("staff@subscription.com")
                .orElseGet(() -> userRepository.save(new User("Support Staff", "staff@subscription.com", defaultPass, Role.STAFF, UserStatus.ACTIVE)));

        User customer1 = userRepository.findByEmail("john.doe@example.com")
                .orElseGet(() -> userRepository.save(new User("John Doe", "john.doe@example.com", defaultPass, Role.CUSTOMER, UserStatus.ACTIVE)));

        User customer2 = userRepository.findByEmail("sarah.smith@example.com")
                .orElseGet(() -> userRepository.save(new User("Sarah Smith", "sarah.smith@example.com", defaultPass, Role.CUSTOMER, UserStatus.ACTIVE)));

        User customer3 = userRepository.findByEmail("david.wilson@example.com")
                .orElseGet(() -> userRepository.save(new User("David Wilson", "david.wilson@example.com", defaultPass, Role.CUSTOMER, UserStatus.ACTIVE)));

        User customer4 = userRepository.findByEmail("emma.johnson@example.com")
                .orElseGet(() -> userRepository.save(new User("Emma Johnson", "emma.johnson@example.com", defaultPass, Role.CUSTOMER, UserStatus.ACTIVE)));

        // 2. Seed Plans
        Plan starter = planRepository.save(new Plan(
                "Starter Tier", "PLAN-STARTER", "Essential tools for small teams and solopreneurs.",
                BigDecimal.valueOf(29.00), BillingCycle.MONTHLY,
                "5 User Seats, 10GB Cloud Storage, Basic Reports, Email Support"
        ));

        Plan pro = planRepository.save(new Plan(
                "Professional Tier", "PLAN-PRO", "Advanced automation and analytics for scaling organizations.",
                BigDecimal.valueOf(99.00), BillingCycle.MONTHLY,
                "25 User Seats, 100GB Storage, Advanced Analytics, Priority Support, API Access"
        ));

        Plan enterprise = planRepository.save(new Plan(
                "Enterprise Suite", "PLAN-ENTERPRISE", "Complete subscription infrastructure with custom SLAs.",
                BigDecimal.valueOf(299.00), BillingCycle.MONTHLY,
                "Unlimited Seats, 1TB Storage, Dedicated Account Manager, 99.99% SLA, Custom Integrations"
        ));

        Plan annualBusiness = planRepository.save(new Plan(
                "Annual Business Pack", "PLAN-ANNUAL-BIZ", "Yearly discounted plan for established enterprises.",
                BigDecimal.valueOf(999.00), BillingCycle.ANNUALLY,
                "All Enterprise Features, Annual Audit, Free Migration Assistance, Premium Webhooks"
        ));

        LocalDate today = LocalDate.now();

        // 3. Seed Subscriptions
        Subscription sub1 = subscriptionRepository.save(new Subscription(
                customer1, enterprise, SubscriptionStatus.ACTIVE,
                today.minusMonths(6), today.plusMonths(6), today.plusDays(14), true
        ));

        Subscription sub2 = subscriptionRepository.save(new Subscription(
                customer2, pro, SubscriptionStatus.ACTIVE,
                today.minusMonths(3), today.plusMonths(9), today.plusDays(7), true
        ));

        Subscription sub3 = subscriptionRepository.save(new Subscription(
                customer3, starter, SubscriptionStatus.ACTIVE,
                today.minusMonths(1), today.plusMonths(11), today.plusDays(25), false
        ));

        Subscription sub4 = subscriptionRepository.save(new Subscription(
                customer4, annualBusiness, SubscriptionStatus.ACTIVE,
                today.minusMonths(4), today.plusMonths(8), today.plusDays(5), true
        ));

        // 4. Seed Invoices
        Invoice inv1 = invoiceRepository.save(new Invoice(
                "INV-2026-001", sub1, customer1,
                BigDecimal.valueOf(299.00), BigDecimal.valueOf(29.90), BigDecimal.valueOf(328.90),
                BigDecimal.valueOf(328.90), BigDecimal.ZERO,
                InvoiceStatus.PAID, today.minusMonths(2), today.minusMonths(2).plusDays(15)
        ));
        inv1.setPaidDate(today.minusMonths(2).plusDays(5));

        Invoice inv2 = invoiceRepository.save(new Invoice(
                "INV-2026-002", sub1, customer1,
                BigDecimal.valueOf(299.00), BigDecimal.valueOf(29.90), BigDecimal.valueOf(328.90),
                BigDecimal.ZERO, BigDecimal.valueOf(328.90),
                InvoiceStatus.PENDING, today.minusDays(3), today.plusDays(12)
        ));

        Invoice inv3 = invoiceRepository.save(new Invoice(
                "INV-2026-003", sub2, customer2,
                BigDecimal.valueOf(99.00), BigDecimal.valueOf(9.90), BigDecimal.valueOf(108.90),
                BigDecimal.ZERO, BigDecimal.valueOf(108.90),
                InvoiceStatus.OVERDUE, today.minusDays(20), today.minusDays(5)
        ));

        Invoice inv4 = invoiceRepository.save(new Invoice(
                "INV-2026-004", sub4, customer4,
                BigDecimal.valueOf(999.00), BigDecimal.valueOf(99.90), BigDecimal.valueOf(1098.90),
                BigDecimal.valueOf(1098.90), BigDecimal.ZERO,
                InvoiceStatus.PAID, today.minusMonths(4), today.minusMonths(4).plusDays(15)
        ));
        inv4.setPaidDate(today.minusMonths(4).plusDays(2));

        // 5. Seed Payments
        paymentRepository.save(new Payment(
                "PAY-REF-90812", inv1, customer1,
                BigDecimal.valueOf(328.90), PaymentMethod.CREDIT_CARD, PaymentStatus.SUCCESS,
                LocalDateTime.now().minusMonths(2).plusDays(5), "Automated monthly card settlement"
        ));

        paymentRepository.save(new Payment(
                "PAY-REF-90813", inv4, customer4,
                BigDecimal.valueOf(1098.90), PaymentMethod.BANK_TRANSFER, PaymentStatus.SUCCESS,
                LocalDateTime.now().minusMonths(4).plusDays(2), "Corporate ACH transfer #4819"
        ));

        logger.info("Sample database records initialized successfully for subscription_management!");
    }
}
