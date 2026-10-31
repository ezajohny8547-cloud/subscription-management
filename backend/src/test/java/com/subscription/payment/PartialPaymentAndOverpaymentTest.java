package com.subscription.payment;

import com.subscription.billing.dto.CreateInvoiceRequest;
import com.subscription.billing.dto.InvoiceLineRequest;
import com.subscription.billing.dto.InvoiceResponse;
import com.subscription.billing.entity.InvoiceStatus;
import com.subscription.billing.entity.PaymentStatus;
import com.subscription.billing.service.InvoiceService;
import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.DuplicateResourceException;
import com.subscription.model.Customer;
import com.subscription.payment.dto.PaymentResponse;
import com.subscription.payment.dto.RecordPaymentRequest;
import com.subscription.payment.entity.PaymentMethod;
import com.subscription.payment.service.PaymentService;
import com.subscription.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class PartialPaymentAndOverpaymentTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private CustomerRepository customerRepository;

    private InvoiceResponse testInvoice;

    @BeforeEach
    void setUp() {
        Customer customer = new Customer("Payment Tester", "payment@test.com", "999 Oak Rd", "US", "CA");
        customer = customerRepository.save(customer);

        CreateInvoiceRequest req = new CreateInvoiceRequest();
        req.setCustomerId(customer.getId());

        // Invoice total = $100.00 (1 item @ $100.00, no tax/discount)
        InvoiceLineRequest line = new InvoiceLineRequest(1L, "Software Subscription", "Annual license", 1, new BigDecimal("100.00"));
        req.setLines(Collections.singletonList(line));

        InvoiceResponse draft = invoiceService.createInvoice(req);
        // Confirm invoice so it can accept payments
        testInvoice = invoiceService.confirmInvoice(draft.getId());
    }

    @Test
    @DisplayName("Partial Payments: Multiple Payments Correctly Reduce Outstanding Balance and Update Status")
    void testPartialPaymentsUntilFullyPaid() {
        assertEquals(new BigDecimal("100.00"), testInvoice.getTotalAmount());
        assertEquals(new BigDecimal("100.00"), testInvoice.getOutstandingBalance());
        assertEquals(InvoiceStatus.CONFIRMED, testInvoice.getStatus());

        // 1st partial payment: $40.00
        RecordPaymentRequest pay1 = new RecordPaymentRequest();
        pay1.setAmount(new BigDecimal("40.00"));
        pay1.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        pay1.setPaymentReference("PAY-PARTIAL-001");
        pay1.setNotes("First installment");

        PaymentResponse resp1 = paymentService.recordPayment(testInvoice.getId(), pay1);
        assertEquals(new BigDecimal("60.00"), resp1.getOutstandingBalanceAfterPayment());
        assertEquals(InvoiceStatus.CONFIRMED, resp1.getInvoiceStatusAfterPayment());

        InvoiceResponse updated1 = invoiceService.getInvoiceById(testInvoice.getId());
        assertEquals(new BigDecimal("40.00"), updated1.getAmountPaid());
        assertEquals(new BigDecimal("60.00"), updated1.getOutstandingBalance());
        assertEquals(PaymentStatus.PARTIALLY_PAID, updated1.getPaymentStatus());

        // 2nd partial payment: $60.00 (settles full balance)
        RecordPaymentRequest pay2 = new RecordPaymentRequest();
        pay2.setAmount(new BigDecimal("60.00"));
        pay2.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        pay2.setPaymentReference("PAY-PARTIAL-002");
        pay2.setNotes("Final settlement");

        PaymentResponse resp2 = paymentService.recordPayment(testInvoice.getId(), pay2);
        assertEquals(new BigDecimal("0.00"), resp2.getOutstandingBalanceAfterPayment());
        assertEquals(InvoiceStatus.PAID, resp2.getInvoiceStatusAfterPayment());

        InvoiceResponse updated2 = invoiceService.getInvoiceById(testInvoice.getId());
        assertEquals(new BigDecimal("100.00"), updated2.getAmountPaid());
        assertEquals(new BigDecimal("0.00"), updated2.getOutstandingBalance());
        assertEquals(InvoiceStatus.PAID, updated2.getStatus());
        assertEquals(PaymentStatus.PAID, updated2.getPaymentStatus());
    }

    @Test
    @DisplayName("Overpayment Prevention: Rejects Payments Exceeding Outstanding Balance")
    void testOverpaymentPrevention() {
        RecordPaymentRequest overpay = new RecordPaymentRequest();
        // Outstanding is $100, attempting $150
        overpay.setAmount(new BigDecimal("150.00"));
        overpay.setPaymentMethod(PaymentMethod.CREDIT_CARD);

        assertThrows(BusinessRuleException.class, () -> {
            paymentService.recordPayment(testInvoice.getId(), overpay);
        });

        // Verify balance was unchanged
        InvoiceResponse check = invoiceService.getInvoiceById(testInvoice.getId());
        assertEquals(new BigDecimal("100.00"), check.getOutstandingBalance());
        assertEquals(new BigDecimal("0.00"), check.getAmountPaid());
    }

    @Test
    @DisplayName("Zero or Negative Payment Amount Prevention")
    void testZeroOrNegativePaymentRejection() {
        RecordPaymentRequest invalidPay = new RecordPaymentRequest();
        invalidPay.setAmount(new BigDecimal("0.00"));
        invalidPay.setPaymentMethod(PaymentMethod.CASH);

        assertThrows(BusinessRuleException.class, () -> {
            paymentService.recordPayment(testInvoice.getId(), invalidPay);
        });
    }

    @Test
    @DisplayName("Duplicate Payment Reference Prevention")
    void testDuplicatePaymentReferenceRejection() {
        RecordPaymentRequest pay1 = new RecordPaymentRequest();
        pay1.setAmount(new BigDecimal("30.00"));
        pay1.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        pay1.setPaymentReference("REF-UNIQUE-1234");
        paymentService.recordPayment(testInvoice.getId(), pay1);

        // Attempt second payment with the exact same reference
        RecordPaymentRequest pay2 = new RecordPaymentRequest();
        pay2.setAmount(new BigDecimal("30.00"));
        pay2.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        pay2.setPaymentReference("REF-UNIQUE-1234");

        assertThrows(DuplicateResourceException.class, () -> {
            paymentService.recordPayment(testInvoice.getId(), pay2);
        });
    }
}
