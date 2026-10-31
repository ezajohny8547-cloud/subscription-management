package com.subscription.controller;

import com.subscription.common.ApiResponse;
import com.subscription.entity.*;
import com.subscription.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Supporting Integration Endpoints for Modules 2 and 3
 * (Module 1 is served by UserController and AuthController)
 */
@RestController
@RequestMapping("/api")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'MANAGER')")
public class ModuleIntegrationController {

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public ModuleIntegrationController(PlanRepository planRepository,
                                       SubscriptionRepository subscriptionRepository,
                                       InvoiceRepository invoiceRepository,
                                       PaymentRepository paymentRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<Plan>>> getAllPlans() {
        return ResponseEntity.ok(ApiResponse.success(planRepository.findAll()));
    }

    @GetMapping("/subscriptions")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getAllSubscriptions() {
        List<SubscriptionResponse> responses = subscriptionRepository.findAll().stream()
                .map(sub -> {
                    Map<String, Object> userMap = new HashMap<>();
                    if (sub.getUser() != null) {
                        userMap.put("id", sub.getUser().getId());
                        userMap.put("name", sub.getUser().getFullName());
                        userMap.put("fullName", sub.getUser().getFullName());
                        userMap.put("email", sub.getUser().getEmail());
                    }

                    Map<String, Object> planMap = new HashMap<>();
                    if (sub.getPlan() != null) {
                        planMap.put("id", sub.getPlan().getId());
                        planMap.put("name", sub.getPlan().getName());
                        planMap.put("code", sub.getPlan().getCode());
                        planMap.put("price", sub.getPlan().getPrice());
                        planMap.put("billingCycle", sub.getPlan().getBillingCycle().name());
                    }

                    return new SubscriptionResponse(
                            sub.getId(),
                            userMap,
                            sub.getUser() != null ? sub.getUser().getId() : null,
                            planMap,
                            sub.getPlan() != null ? sub.getPlan().getId() : null,
                            sub.getStatus() != null ? sub.getStatus().name() : "ACTIVE",
                            sub.getStartDate(),
                            sub.getEndDate(),
                            sub.getRenewalDate(),
                            sub.isAutoRenew(),
                            sub.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/invoices")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAllInvoices() {
        List<InvoiceResponse> responses = invoiceRepository.findAll().stream()
                .map(inv -> {
                    Map<String, Object> userMap = new HashMap<>();
                    if (inv.getUser() != null) {
                        userMap.put("id", inv.getUser().getId());
                        userMap.put("name", inv.getUser().getFullName());
                        userMap.put("fullName", inv.getUser().getFullName());
                        userMap.put("email", inv.getUser().getEmail());
                    }

                    Map<String, Object> subMap = new HashMap<>();
                    if (inv.getSubscription() != null) {
                        subMap.put("id", inv.getSubscription().getId());
                    }

                    return new InvoiceResponse(
                            inv.getId(),
                            inv.getInvoiceNumber(),
                            userMap,
                            inv.getUser() != null ? inv.getUser().getId() : null,
                            subMap,
                            inv.getSubscription() != null ? inv.getSubscription().getId() : null,
                            inv.getAmount(),
                            inv.getTax(),
                            inv.getTotalAmount(),
                            inv.getPaidAmount(),
                            inv.getOutstandingAmount(),
                            inv.getStatus() != null ? inv.getStatus().name() : "PENDING",
                            inv.getIssueDate(),
                            inv.getDueDate(),
                            inv.getPaidDate(),
                            inv.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/payments")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        List<PaymentResponse> responses = paymentRepository.findAll().stream()
                .map(pay -> {
                    Map<String, Object> userMap = new HashMap<>();
                    if (pay.getUser() != null) {
                        userMap.put("id", pay.getUser().getId());
                        userMap.put("name", pay.getUser().getFullName());
                        userMap.put("fullName", pay.getUser().getFullName());
                        userMap.put("email", pay.getUser().getEmail());
                    }

                    Map<String, Object> invMap = new HashMap<>();
                    String invoiceNum = null;
                    Long invoiceId = null;
                    if (pay.getInvoice() != null) {
                        invoiceId = pay.getInvoice().getId();
                        invoiceNum = pay.getInvoice().getInvoiceNumber();
                        invMap.put("id", invoiceId);
                        invMap.put("invoiceNumber", invoiceNum);
                    }

                    return new PaymentResponse(
                            pay.getId(),
                            pay.getPaymentReference(),
                            userMap,
                            pay.getUser() != null ? pay.getUser().getId() : null,
                            invMap,
                            invoiceId,
                            invoiceNum,
                            pay.getAmount(),
                            pay.getPaymentMethod() != null ? pay.getPaymentMethod().name() : null,
                            pay.getStatus() != null ? pay.getStatus().name() : "SUCCESS",
                            pay.getPaymentDate(),
                            pay.getNotes()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    public record SubscriptionResponse(
            Long id,
            Map<String, Object> user,
            Long userId,
            Map<String, Object> plan,
            Long planId,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            LocalDate renewalDate,
            boolean autoRenew,
            LocalDateTime createdAt
    ) {}

    public record InvoiceResponse(
            Long id,
            String invoiceNumber,
            Map<String, Object> user,
            Long userId,
            Map<String, Object> subscription,
            Long subscriptionId,
            BigDecimal amount,
            BigDecimal tax,
            BigDecimal totalAmount,
            BigDecimal paidAmount,
            BigDecimal outstandingAmount,
            String status,
            LocalDate issueDate,
            LocalDate dueDate,
            LocalDate paidDate,
            LocalDateTime createdAt
    ) {}

    public record PaymentResponse(
            Long id,
            String paymentReference,
            Map<String, Object> user,
            Long userId,
            Map<String, Object> invoice,
            Long invoiceId,
            String invoiceNumber,
            BigDecimal amount,
            String paymentMethod,
            String status,
            LocalDateTime paymentDate,
            String notes
    ) {}
}
