package com.subscription.payment.service;

import com.subscription.billing.entity.Invoice;
import com.subscription.billing.entity.InvoiceStatus;
import com.subscription.billing.entity.PaymentStatus;
import com.subscription.billing.repository.InvoiceRepository;
import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.DuplicateResourceException;
import com.subscription.common.exception.InvalidStatusTransitionException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.payment.dto.PaymentResponse;
import com.subscription.payment.dto.PaymentSummaryResponse;
import com.subscription.payment.dto.RecordPaymentRequest;
import com.subscription.payment.entity.Payment;
import com.subscription.payment.entity.PaymentRecordStatus;
import com.subscription.payment.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    private static final AtomicLong PAYMENT_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    public PaymentService(PaymentRepository paymentRepository, InvoiceRepository invoiceRepository) {
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public synchronized String generatePaymentReference() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long seq = PAYMENT_SEQ.incrementAndGet();
        return String.format("PAY-%s-%04d", datePrefix, seq % 10000);
    }

    @Transactional
    public PaymentResponse recordPayment(Long invoiceId, RecordPaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        // Validate invoice status for payments
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            throw new InvalidStatusTransitionException("Cannot record payment for a DRAFT invoice. Confirm the invoice first.");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Cannot record payment for a CANCELLED invoice.");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BusinessRuleException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid. Outstanding balance is $0.00.");
        }

        BigDecimal paymentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (paymentAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Payment amount must be strictly greater than zero");
        }

        BigDecimal currentOutstanding = invoice.getOutstandingBalance().setScale(2, RoundingMode.HALF_UP);

        // Strict overpayment prevention: Outstanding balance = Total payable − Total payments allocated
        if (paymentAmount.compareTo(currentOutstanding) > 0) {
            throw new BusinessRuleException(String.format(
                    "Overpayment rejected. Payment amount of $%.2f exceeds current outstanding balance of $%.2f",
                    paymentAmount, currentOutstanding
            ));
        }

        // Generate or validate payment reference uniqueness
        String paymentRef = request.getPaymentReference();
        if (paymentRef == null || paymentRef.trim().isEmpty()) {
            paymentRef = generatePaymentReference();
        } else {
            paymentRef = paymentRef.trim().toUpperCase();
            if (paymentRepository.findByPaymentReference(paymentRef).isPresent()) {
                throw new DuplicateResourceException("Payment with reference '" + paymentRef + "' has already been recorded");
            }
        }

        LocalDateTime paymentDate = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now();

        Payment payment = new Payment(
                paymentRef,
                invoice,
                request.getPaymentMethod(),
                paymentAmount,
                paymentDate,
                request.getNotes()
        );
        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice financial calculations
        BigDecimal newAmountPaid = invoice.getAmountPaid().add(paymentAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal newOutstanding = invoice.getTotalAmount().subtract(newAmountPaid).setScale(2, RoundingMode.HALF_UP);

        invoice.setAmountPaid(newAmountPaid);
        invoice.setOutstandingBalance(newOutstanding);

        if (newOutstanding.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaymentStatus(PaymentStatus.PAID);
        } else {
            invoice.setPaymentStatus(PaymentStatus.PARTIALLY_PAID);
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);

        return mapToResponse(savedPayment, savedInvoice);
    }

    public List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        return paymentRepository.findByInvoiceId(invoiceId).stream()
                .sorted(Comparator.comparing(Payment::getId).reversed())
                .map(p -> mapToResponse(p, invoice))
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .sorted(Comparator.comparing(Payment::getId).reversed())
                .map(p -> mapToResponse(p, p.getInvoice()))
                .collect(Collectors.toList());
    }

    public PaymentSummaryResponse getPaymentSummary() {
        List<Object[]> metrics = paymentRepository.getPaymentMetrics();
        if (metrics != null && !metrics.isEmpty() && metrics.get(0) != null) {
            Object[] row = metrics.get(0);
            long count = row[0] != null ? ((Number) row[0]).longValue() : 0L;
            BigDecimal totalAmount = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            return new PaymentSummaryResponse(count, totalAmount.setScale(2, RoundingMode.HALF_UP));
        }
        return new PaymentSummaryResponse(0L, BigDecimal.ZERO);
    }

    private PaymentResponse mapToResponse(Payment payment, Invoice invoice) {
        PaymentResponse res = new PaymentResponse();
        res.setId(payment.getId());
        res.setPaymentReference(payment.getPaymentReference());
        res.setInvoiceId(invoice.getId());
        res.setInvoiceNumber(invoice.getInvoiceNumber());
        res.setPaymentMethod(payment.getPaymentMethod());
        res.setAmount(payment.getAmount());
        res.setPaymentDate(payment.getPaymentDate());
        res.setNotes(payment.getNotes());
        res.setStatus(payment.getStatus());
        res.setOutstandingBalanceAfterPayment(invoice.getOutstandingBalance());
        res.setInvoiceStatusAfterPayment(invoice.getStatus());
        res.setCreatedAt(payment.getCreatedAt());
        return res;
    }
}
