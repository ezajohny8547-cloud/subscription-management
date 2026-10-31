package com.subscription.billing;

import com.subscription.billing.dto.CreateInvoiceRequest;
import com.subscription.billing.dto.InvoiceLineRequest;
import com.subscription.billing.dto.InvoiceResponse;
import com.subscription.billing.entity.Discount;
import com.subscription.billing.entity.DiscountType;
import com.subscription.billing.entity.InvoiceStatus;
import com.subscription.billing.entity.TaxRule;
import com.subscription.billing.repository.DiscountRepository;
import com.subscription.billing.repository.TaxRuleRepository;
import com.subscription.billing.service.InvoiceService;
import com.subscription.model.Customer;
import com.subscription.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class InvoiceCalculationTest {

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private TaxRuleRepository taxRuleRepository;

    @Autowired
    private DiscountRepository discountRepository;

    private Customer testCustomer;

    @BeforeEach
    void setUp() {
        testCustomer = new Customer("Test Customer", "test@customer.com", "123 Main St", "US", "California");
        testCustomer = customerRepository.save(testCustomer);

        // Tax rule: 10%
        TaxRule rule = new TaxRule("Test VAT", new BigDecimal("10.00"), "US", "California", "10% test tax");
        taxRuleRepository.save(rule);

        // Percentage discount: 20%
        Discount percentDisc = new Discount("SAVE20", "20% off", DiscountType.PERCENTAGE, new BigDecimal("20.00"));
        discountRepository.save(percentDisc);

        // Fixed discount: $15 off
        Discount fixedDisc = new Discount("FLAT15", "$15 off", DiscountType.FIXED_AMOUNT, new BigDecimal("15.00"));
        discountRepository.save(fixedDisc);
    }

    @Test
    @DisplayName("Invoice Total Calculation: Subtotal, 20% Discount, and 10% Tax")
    void testInvoiceTotalsWithPercentageDiscountAndTax() {
        CreateInvoiceRequest req = new CreateInvoiceRequest();
        req.setCustomerId(testCustomer.getId());
        req.setDiscountCode("SAVE20");

        // 2 units @ $100.00 = $200.00 subtotal
        InvoiceLineRequest line = new InvoiceLineRequest(1L, "Enterprise Plan", "Tier 1", 2, new BigDecimal("100.00"));
        req.setLines(Collections.singletonList(line));

        InvoiceResponse response = invoiceService.createInvoice(req);

        assertNotNull(response);
        assertEquals(new BigDecimal("200.00"), response.getSubtotal());

        // 20% discount on 200 = 40.00
        assertEquals(new BigDecimal("40.00"), response.getDiscountAmount());

        // Net taxable = 200 - 40 = 160.00
        // 10% tax on 160 = 16.00
        assertEquals(new BigDecimal("16.00"), response.getTaxAmount());

        // Total = 160 + 16 = 176.00
        assertEquals(new BigDecimal("176.00"), response.getTotalAmount());
        assertEquals(new BigDecimal("176.00"), response.getOutstandingBalance());
        assertEquals(new BigDecimal("0.00"), response.getAmountPaid());
        assertEquals(InvoiceStatus.DRAFT, response.getStatus());
    }

    @Test
    @DisplayName("Invoice Total Calculation: Subtotal, Fixed Discount, and Tax")
    void testInvoiceTotalsWithFixedDiscountAndTax() {
        CreateInvoiceRequest req = new CreateInvoiceRequest();
        req.setCustomerId(testCustomer.getId());
        req.setDiscountCode("FLAT15");

        // 1 unit @ $100.00
        InvoiceLineRequest line = new InvoiceLineRequest(1L, "Pro Plan", "Tier 2", 1, new BigDecimal("100.00"));
        req.setLines(Collections.singletonList(line));

        InvoiceResponse response = invoiceService.createInvoice(req);

        assertEquals(new BigDecimal("100.00"), response.getSubtotal());
        assertEquals(new BigDecimal("15.00"), response.getDiscountAmount());

        // Net taxable = 100 - 15 = 85.00
        // 10% tax on 85.00 = 8.50
        assertEquals(new BigDecimal("8.50"), response.getTaxAmount());

        // Total = 85.00 + 8.50 = 93.50
        assertEquals(new BigDecimal("93.50"), response.getTotalAmount());
        assertEquals(new BigDecimal("93.50"), response.getOutstandingBalance());
    }

    @Test
    @DisplayName("Invoice Status Transition: DRAFT -> CONFIRMED")
    void testConfirmInvoice() {
        CreateInvoiceRequest req = new CreateInvoiceRequest();
        req.setCustomerId(testCustomer.getId());
        InvoiceLineRequest line = new InvoiceLineRequest(1L, "Basic Plan", "Tier 1", 1, new BigDecimal("50.00"));
        req.setLines(Collections.singletonList(line));

        InvoiceResponse draft = invoiceService.createInvoice(req);
        assertEquals(InvoiceStatus.DRAFT, draft.getStatus());

        InvoiceResponse confirmed = invoiceService.confirmInvoice(draft.getId());
        assertEquals(InvoiceStatus.CONFIRMED, confirmed.getStatus());
    }
}
