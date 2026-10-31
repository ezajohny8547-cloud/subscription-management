package com.subscription.dashboard.service;

import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.common.exception.UnauthorizedAccessException;
import com.subscription.dashboard.dto.*;
import com.subscription.entity.*;
import com.subscription.repository.InvoiceRepository;
import com.subscription.repository.PaymentRepository;
import com.subscription.repository.SubscriptionRepository;
import com.subscription.repository.UserRepository;
import com.subscription.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CustomerPortalService {

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    public CustomerPortalService(UserRepository userRepository,
                                 SubscriptionRepository subscriptionRepository,
                                 InvoiceRepository invoiceRepository,
                                 PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Resolves target customer ID with strict backend security verification.
     * Prevents Insecure Direct Object Reference (IDOR) attacks.
     */
    public Long resolveAndVerifyCustomerId(UserPrincipal principal, Long requestedCustomerId) {
        if (principal == null) {
            throw new UnauthorizedAccessException("Authentication required.");
        }

        Long authenticatedUserId = principal.getId();
        boolean isStaff = principal.getRole() == Role.ADMIN || principal.getRole() == Role.MANAGER || principal.getRole() == Role.STAFF;

        // If customer is requesting another customer's ID, reject immediately
        if (!isStaff && requestedCustomerId != null && !requestedCustomerId.equals(authenticatedUserId)) {
            throw new UnauthorizedAccessException("Access denied: You are not authorized to access another customer's records.");
        }

        // If customer requested null or matches their own, use authenticated user ID
        if (!isStaff || requestedCustomerId == null) {
            return authenticatedUserId;
        }

        return requestedCustomerId;
    }

    public CustomerPortalSummaryDTO getCustomerPortalSummary(UserPrincipal principal, Long customerId) {
        Long verifiedUserId = resolveAndVerifyCustomerId(principal, customerId);
        User user = userRepository.findById(verifiedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + verifiedUserId));

        List<Subscription> subscriptions = subscriptionRepository.findByUserId(verifiedUserId);
        long activeCount = subscriptions.stream().filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE).count();

        // Calculate paid amount from payments
        List<Payment> payments = paymentRepository.findByUserId(verifiedUserId);
        BigDecimal totalPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate outstanding balances from invoices
        BigDecimal outstanding = invoiceRepository.calculateCustomerOutstandingBalance(verifiedUserId);

        // Find next upcoming renewal among active subscriptions
        Subscription nextRenewalSub = subscriptions.stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE && s.getRenewalDate() != null)
                .filter(s -> !s.getRenewalDate().isBefore(LocalDate.now()))
                .min(Comparator.comparing(Subscription::getRenewalDate))
                .orElse(null);

        LocalDate nextRenewalDate = nextRenewalSub != null ? nextRenewalSub.getRenewalDate() : null;
        BigDecimal nextRenewalAmount = nextRenewalSub != null ? nextRenewalSub.getPlan().getPrice() : BigDecimal.ZERO;
        String nextRenewalPlan = nextRenewalSub != null ? nextRenewalSub.getPlan().getName() : "None";

        return new CustomerPortalSummaryDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                activeCount,
                totalPaid,
                outstanding,
                nextRenewalDate,
                nextRenewalAmount,
                nextRenewalPlan
        );
    }

    public List<CustomerSubscriptionDTO> getCustomerSubscriptions(UserPrincipal principal, Long customerId) {
        Long verifiedUserId = resolveAndVerifyCustomerId(principal, customerId);
        List<Subscription> subscriptions = subscriptionRepository.findByUserId(verifiedUserId);

        List<CustomerSubscriptionDTO> dtoList = new ArrayList<>();
        for (Subscription sub : subscriptions) {
            Plan plan = sub.getPlan();
            List<String> featureList = plan.getFeatures() != null ?
                    Arrays.asList(plan.getFeatures().split(",")) : new ArrayList<>();

            dtoList.add(new CustomerSubscriptionDTO(
                    sub.getId(),
                    plan.getId(),
                    plan.getName(),
                    plan.getCode(),
                    plan.getDescription(),
                    plan.getPrice(),
                    plan.getBillingCycle().name(),
                    sub.getStatus().name(),
                    sub.getStartDate(),
                    sub.getEndDate(),
                    sub.getRenewalDate(),
                    sub.isAutoRenew(),
                    featureList
            ));
        }
        return dtoList;
    }

    public List<CustomerInvoiceDTO> getCustomerInvoices(UserPrincipal principal, Long customerId) {
        Long verifiedUserId = resolveAndVerifyCustomerId(principal, customerId);
        List<Invoice> invoices = invoiceRepository.findCustomerInvoicesDetailed(verifiedUserId);

        List<CustomerInvoiceDTO> dtoList = new ArrayList<>();
        for (Invoice inv : invoices) {
            String planName = (inv.getSubscription() != null && inv.getSubscription().getPlan() != null)
                    ? inv.getSubscription().getPlan().getName() : "Direct Plan";

            dtoList.add(new CustomerInvoiceDTO(
                    inv.getId(),
                    inv.getInvoiceNumber(),
                    inv.getSubscription() != null ? inv.getSubscription().getId() : null,
                    planName,
                    inv.getAmount(),
                    inv.getTax(),
                    inv.getTotalAmount(),
                    inv.getPaidAmount(),
                    inv.getOutstandingAmount(),
                    inv.getStatus().name(),
                    inv.getIssueDate(),
                    inv.getDueDate(),
                    inv.getPaidDate()
            ));
        }
        return dtoList;
    }

    public List<CustomerPaymentDTO> getCustomerPayments(UserPrincipal principal, Long customerId) {
        Long verifiedUserId = resolveAndVerifyCustomerId(principal, customerId);
        List<Payment> payments = paymentRepository.findCustomerPaymentsDetailed(verifiedUserId);

        List<CustomerPaymentDTO> dtoList = new ArrayList<>();
        for (Payment p : payments) {
            dtoList.add(new CustomerPaymentDTO(
                    p.getId(),
                    p.getPaymentReference(),
                    p.getInvoice() != null ? p.getInvoice().getId() : null,
                    p.getInvoice() != null ? p.getInvoice().getInvoiceNumber() : "N/A",
                    p.getAmount(),
                    p.getPaymentMethod().name(),
                    p.getStatus().name(),
                    p.getPaymentDate(),
                    p.getNotes()
            ));
        }
        return dtoList;
    }
}
