package com.subscription.billing.service;

import com.subscription.billing.dto.*;
import com.subscription.billing.entity.*;
import com.subscription.billing.repository.InvoiceRepository;
import com.subscription.billing.repository.TaxRuleRepository;
import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.InvalidStatusTransitionException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.model.Customer;
import com.subscription.model.Subscription;
import com.subscription.repository.CustomerRepository;
import com.subscription.repository.SubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TaxCalculationService taxCalculationService;
    private final DiscountService discountService;
    private final TaxRuleRepository taxRuleRepository;

    private static final AtomicLong INVOICE_SEQ = new AtomicLong(System.currentTimeMillis() % 100000);

    public InvoiceService(InvoiceRepository invoiceRepository,
                          CustomerRepository customerRepository,
                          SubscriptionRepository subscriptionRepository,
                          TaxCalculationService taxCalculationService,
                          DiscountService discountService,
                          TaxRuleRepository taxRuleRepository) {
        this.invoiceRepository = invoiceRepository;
        this.customerRepository = customerRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.taxCalculationService = taxCalculationService;
        this.discountService = discountService;
        this.taxRuleRepository = taxRuleRepository;
    }

    public synchronized String generateNextInvoiceNumber() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        long seq = INVOICE_SEQ.incrementAndGet();
        return String.format("INV-%s-%04d", datePrefix, seq % 10000);
    }

    @Transactional
    public InvoiceResponse createInvoice(CreateInvoiceRequest request) {
        Customer customer;
        Subscription subscription = null;

        if (request.getSubscriptionId() != null) {
            subscription = subscriptionRepository.findById(request.getSubscriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with ID: " + request.getSubscriptionId()));
            customer = subscription.getCustomer();
        } else if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + request.getCustomerId()));
        } else {
            throw new BusinessRuleException("Either customerId or subscriptionId must be provided");
        }

        LocalDate invoiceDate = request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now();
        LocalDate dueDate = request.getDueDate() != null ? request.getDueDate() : invoiceDate.plusDays(30);

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateNextInvoiceNumber());
        invoice.setCustomer(customer);
        invoice.setSubscription(subscription);
        invoice.setInvoiceDate(invoiceDate);
        invoice.setDueDate(dueDate);
        invoice.setBillingPeriodStart(request.getBillingPeriodStart());
        invoice.setBillingPeriodEnd(request.getBillingPeriodEnd());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setPaymentStatus(PaymentStatus.UNPAID);
        invoice.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        invoice.setNotes(request.getNotes());

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQty = 0;
        Long firstProductId = null;

        for (InvoiceLineRequest lineReq : request.getLines()) {
            InvoiceLine line = new InvoiceLine(
                    lineReq.getProductId(),
                    lineReq.getProductName(),
                    lineReq.getDescription(),
                    lineReq.getQuantity(),
                    lineReq.getUnitPrice().setScale(2, RoundingMode.HALF_UP)
            );
            invoice.addLine(line);
            subtotal = subtotal.add(line.getSubtotal());
            totalQty += line.getQuantity();
            if (firstProductId == null && lineReq.getProductId() != null) {
                firstProductId = lineReq.getProductId();
            }
        }

        invoice.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));

        // Evaluate and apply discount if provided
        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (request.getDiscountCode() != null && !request.getDiscountCode().trim().isEmpty()) {
            discountAmount = discountService.evaluateAndCalculateDiscount(
                    request.getDiscountCode(),
                    subtotal,
                    totalQty,
                    firstProductId,
                    subscription != null ? subscription.getId() : null,
                    invoiceDate
            );
            invoice.setDiscountCode(request.getDiscountCode().trim().toUpperCase());
        }
        invoice.setDiscountAmount(discountAmount);

        // Tax calculation on net taxable amount (subtotal - discount)
        BigDecimal netTaxable = subtotal.subtract(discountAmount);
        if (netTaxable.compareTo(BigDecimal.ZERO) < 0) {
            netTaxable = BigDecimal.ZERO;
        }

        TaxRule applicableTaxRule = taxCalculationService.determineApplicableTaxRule(customer.getCountry(), customer.getState());
        BigDecimal taxRate = applicableTaxRule != null ? applicableTaxRule.getRatePercentage() : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = taxCalculationService.calculateTaxAmount(netTaxable, taxRate);

        invoice.setTaxRate(taxRate);
        invoice.setTaxAmount(taxAmount);
        invoice.setTaxRuleName(applicableTaxRule != null ? applicableTaxRule.getRuleName() : "None");

        BigDecimal totalAmount = netTaxable.add(taxAmount).setScale(2, RoundingMode.HALF_UP);
        invoice.setTotalAmount(totalAmount);
        invoice.setOutstandingBalance(totalAmount);

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Transactional
    public InvoiceResponse confirmInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new InvalidStatusTransitionException("Cannot confirm invoice in status: " + invoice.getStatus() + ". Only DRAFT invoices can be confirmed.");
        }

        // Record discount usage atomically if code was applied
        if (invoice.getDiscountCode() != null && invoice.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discountService.recordDiscountUsage(invoice.getDiscountCode(), invoice.getId(), invoice.getCustomer(), invoice.getDiscountAmount());
        }

        invoice.setStatus(InvoiceStatus.CONFIRMED);

        // If totalAmount is zero, automatically mark as PAID
        if (invoice.getTotalAmount().compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaymentStatus(PaymentStatus.PAID);
            invoice.setOutstandingBalance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long invoiceId, String reason) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvalidStatusTransitionException("PAID invoices cannot be cancelled. Issue a credit note or refund.");
        }

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Invoice is already CANCELLED.");
        }

        if (invoice.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            throw new InvalidStatusTransitionException("Cannot cancel an invoice with payments already recorded. Outstanding balance: " + invoice.getOutstandingBalance());
        }

        invoice.setStatus(InvoiceStatus.CANCELLED);
        if (reason != null && !reason.trim().isEmpty()) {
            invoice.setNotes((invoice.getNotes() != null ? invoice.getNotes() + "\n" : "") + "Cancelled: " + reason);
        }

        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Transactional
    public InvoiceResponse sendInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Cannot send a cancelled invoice.");
        }

        invoice.setSentAt(LocalDateTime.now());
        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + id));
        return mapToResponse(invoice);
    }

    public List<InvoiceResponse> getInvoices(String filterStatus, Long customerId, Long subscriptionId) {
        List<Invoice> list;

        if (customerId != null) {
            list = invoiceRepository.findByCustomerId(customerId);
        } else if (subscriptionId != null) {
            list = invoiceRepository.findBySubscriptionId(subscriptionId);
        } else if (filterStatus != null && !filterStatus.trim().isEmpty()) {
            String upper = filterStatus.trim().toUpperCase();
            LocalDate today = LocalDate.now();

            switch (upper) {
                case "DRAFT":
                    list = invoiceRepository.findByStatus(InvoiceStatus.DRAFT);
                    break;
                case "CONFIRMED":
                    list = invoiceRepository.findByStatus(InvoiceStatus.CONFIRMED);
                    break;
                case "PAID":
                    list = invoiceRepository.findByStatus(InvoiceStatus.PAID);
                    break;
                case "CANCELLED":
                    list = invoiceRepository.findByStatus(InvoiceStatus.CANCELLED);
                    break;
                case "PARTIALLY_PAID":
                    list = invoiceRepository.findPartiallyPaidInvoices(InvoiceStatus.CONFIRMED);
                    break;
                case "UNPAID":
                    list = invoiceRepository.findUnpaidInvoices(InvoiceStatus.CONFIRMED);
                    break;
                case "OVERDUE":
                    list = invoiceRepository.findOverdueInvoices(today);
                    break;
                default:
                    list = invoiceRepository.findAll();
                    break;
            }
        } else {
            list = invoiceRepository.findAll();
        }

        return list.stream()
                .sorted(Comparator.comparing(Invoice::getId).reversed())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public InvoiceSummaryResponse getInvoiceSummary() {
        InvoiceSummaryResponse summary = new InvoiceSummaryResponse();
        LocalDate today = LocalDate.now();

        List<Invoice> all = invoiceRepository.findAll();
        summary.setTotalInvoices(all.size());

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        long draft = 0;
        long confirmed = 0;
        long paid = 0;
        long partiallyPaid = 0;
        long unpaid = 0;
        long overdue = 0;
        BigDecimal overdueAmount = BigDecimal.ZERO;

        for (Invoice inv : all) {
            totalAmount = totalAmount.add(inv.getTotalAmount());
            totalPaid = totalPaid.add(inv.getAmountPaid());
            totalOutstanding = totalOutstanding.add(inv.getOutstandingBalance());

            if (inv.getStatus() == InvoiceStatus.DRAFT) {
                draft++;
            } else if (inv.getStatus() == InvoiceStatus.CONFIRMED) {
                confirmed++;
                if (inv.getAmountPaid().compareTo(BigDecimal.ZERO) == 0) {
                    unpaid++;
                } else if (inv.getAmountPaid().compareTo(inv.getTotalAmount()) < 0) {
                    partiallyPaid++;
                }

                if (inv.isOverdue(today)) {
                    overdue++;
                    overdueAmount = overdueAmount.add(inv.getOutstandingBalance());
                }
            } else if (inv.getStatus() == InvoiceStatus.PAID) {
                paid++;
            }
        }

        summary.setTotalAmountSum(totalAmount.setScale(2, RoundingMode.HALF_UP));
        summary.setTotalPaidSum(totalPaid.setScale(2, RoundingMode.HALF_UP));
        summary.setOutstandingBalanceSum(totalOutstanding.setScale(2, RoundingMode.HALF_UP));
        summary.setDraftCount(draft);
        summary.setConfirmedCount(confirmed);
        summary.setPaidCount(paid);
        summary.setPartiallyPaidCount(partiallyPaid);
        summary.setUnpaidCount(unpaid);
        summary.setOverdueCount(overdue);
        summary.setOverdueAmountSum(overdueAmount.setScale(2, RoundingMode.HALF_UP));

        return summary;
    }

    public InvoiceResponse mapToResponse(Invoice invoice) {
        InvoiceResponse res = new InvoiceResponse();
        res.setId(invoice.getId());
        res.setInvoiceNumber(invoice.getInvoiceNumber());
        res.setCustomerId(invoice.getCustomer().getId());
        res.setCustomerName(invoice.getCustomerName());
        res.setCustomerEmail(invoice.getCustomerEmail());
        res.setBillingAddress(invoice.getBillingAddress());
        res.setInvoiceDate(invoice.getInvoiceDate());
        res.setDueDate(invoice.getDueDate());
        res.setBillingPeriodStart(invoice.getBillingPeriodStart());
        res.setBillingPeriodEnd(invoice.getBillingPeriodEnd());
        res.setSubtotal(invoice.getSubtotal());
        res.setTaxRate(invoice.getTaxRate());
        res.setTaxAmount(invoice.getTaxAmount());
        res.setTaxRuleName(invoice.getTaxRuleName());
        res.setDiscountCode(invoice.getDiscountCode());
        res.setDiscountAmount(invoice.getDiscountAmount());
        res.setTotalAmount(invoice.getTotalAmount());
        res.setAmountPaid(invoice.getAmountPaid());
        res.setOutstandingBalance(invoice.getOutstandingBalance());
        res.setStatus(invoice.getStatus());
        res.setPaymentStatus(invoice.getPaymentStatus());
        res.setOverdue(invoice.isOverdue(LocalDate.now()));
        res.setSentAt(invoice.getSentAt());
        res.setNotes(invoice.getNotes());
        res.setCreatedAt(invoice.getCreatedAt());
        res.setUpdatedAt(invoice.getUpdatedAt());

        if (invoice.getSubscription() != null) {
            res.setSubscriptionId(invoice.getSubscription().getId());
            res.setSubscriptionNumber(invoice.getSubscription().getSubscriptionNumber());
        }

        if (invoice.getLines() != null) {
            List<InvoiceLineResponse> lines = invoice.getLines().stream().map(line -> {
                InvoiceLineResponse lr = new InvoiceLineResponse();
                lr.setId(line.getId());
                lr.setProductId(line.getProductId());
                lr.setProductName(line.getProductName());
                lr.setDescription(line.getDescription());
                lr.setQuantity(line.getQuantity());
                lr.setUnitPrice(line.getUnitPrice());
                lr.setSubtotal(line.getSubtotal());
                lr.setTaxRate(line.getTaxRate());
                lr.setTaxAmount(line.getTaxAmount());
                lr.setDiscountAmount(line.getDiscountAmount());
                lr.setLineTotal(line.getLineTotal());
                return lr;
            }).collect(Collectors.toList());
            res.setLines(lines);
        }

        return res;
    }
}
