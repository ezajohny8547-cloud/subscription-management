package com.subscription.billing;

import com.subscription.billing.dto.CreateDiscountRequest;
import com.subscription.billing.dto.DiscountResponse;
import com.subscription.billing.entity.Discount;
import com.subscription.billing.entity.DiscountType;
import com.subscription.billing.repository.DiscountRepository;
import com.subscription.billing.service.DiscountService;
import com.subscription.common.exception.BusinessRuleException;
import com.subscription.model.Customer;
import com.subscription.model.Product;
import com.subscription.model.BillingInterval;
import com.subscription.repository.CustomerRepository;
import com.subscription.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DiscountLimitAndConcurrencyTest {

    @Autowired
    private DiscountService discountService;

    @Autowired
    private DiscountRepository discountRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    private Customer customer;
    private Product productA;
    private Product productB;

    @BeforeEach
    void setUp() {
        customer = new Customer("Discount Tester", "discount@test.com", "789 Pine St", "US", "CA");
        customer = customerRepository.save(customer);

        productA = new Product("PROD-A", "Product A", new BigDecimal("50.00"), BillingInterval.MONTHLY);
        productA = productRepository.save(productA);

        productB = new Product("PROD-B", "Product B", new BigDecimal("80.00"), BillingInterval.MONTHLY);
        productB = productRepository.save(productB);
    }

    @Test
    @DisplayName("Discount Limit: Stops Applying When Max Usage Count Is Reached")
    void testDiscountMaxUsageLimit() {
        CreateDiscountRequest req = new CreateDiscountRequest();
        req.setCode("LIMITED2");
        req.setDescription("Limited to 2 usages");
        req.setDiscountType(DiscountType.FIXED_AMOUNT);
        req.setDiscountValue(new BigDecimal("10.00"));
        req.setMaxUsageCount(2);

        DiscountResponse created = discountService.createDiscount(req);
        assertEquals(2, created.getMaxUsageCount());
        assertEquals(0, created.getCurrentUsageCount());

        LocalDate today = LocalDate.now();

        // 1st usage: Valid
        BigDecimal disc1 = discountService.evaluateAndCalculateDiscount("LIMITED2", new BigDecimal("100.00"), 1, null, null, today);
        assertEquals(new BigDecimal("10.00"), disc1);
        discountService.recordDiscountUsage("LIMITED2", 101L, customer, disc1);

        // 2nd usage: Valid
        BigDecimal disc2 = discountService.evaluateAndCalculateDiscount("LIMITED2", new BigDecimal("100.00"), 1, null, null, today);
        assertEquals(new BigDecimal("10.00"), disc2);
        discountService.recordDiscountUsage("LIMITED2", 102L, customer, disc2);

        // 3rd usage: Reached limit, throws BusinessRuleException
        assertThrows(BusinessRuleException.class, () -> {
            discountService.evaluateAndCalculateDiscount("LIMITED2", new BigDecimal("100.00"), 1, null, null, today);
        });
    }

    @Test
    @DisplayName("Discount Expiration: Rejected When Out of Date Range")
    void testDiscountDateExpiration() {
        CreateDiscountRequest req = new CreateDiscountRequest();
        req.setCode("EXPIRED_PROMO");
        req.setDiscountType(DiscountType.PERCENTAGE);
        req.setDiscountValue(new BigDecimal("15.00"));
        req.setStartDate(LocalDate.of(2025, 1, 1));
        req.setEndDate(LocalDate.of(2025, 12, 31));

        discountService.createDiscount(req);

        // Evaluating with reference date in 2026 should fail
        assertThrows(BusinessRuleException.class, () -> {
            discountService.evaluateAndCalculateDiscount(
                    "EXPIRED_PROMO",
                    new BigDecimal("100.00"),
                    1,
                    null,
                    null,
                    LocalDate.of(2026, 6, 1)
            );
        });
    }

    @Test
    @DisplayName("Discount Minimum Purchase and Quantity Enforcement")
    void testMinimumPurchaseAndQuantity() {
        CreateDiscountRequest req = new CreateDiscountRequest();
        req.setCode("MINBUY50");
        req.setDiscountType(DiscountType.FIXED_AMOUNT);
        req.setDiscountValue(new BigDecimal("10.00"));
        req.setMinPurchaseAmount(new BigDecimal("50.00"));
        req.setMinQuantity(2);

        discountService.createDiscount(req);

        LocalDate today = LocalDate.now();

        // Purchase amount too low ($40 < $50)
        assertThrows(BusinessRuleException.class, () -> {
            discountService.evaluateAndCalculateDiscount("MINBUY50", new BigDecimal("40.00"), 2, null, null, today);
        });

        // Quantity too low (1 < 2)
        assertThrows(BusinessRuleException.class, () -> {
            discountService.evaluateAndCalculateDiscount("MINBUY50", new BigDecimal("60.00"), 1, null, null, today);
        });

        // Meets both: Valid
        BigDecimal disc = discountService.evaluateAndCalculateDiscount("MINBUY50", new BigDecimal("60.00"), 2, null, null, today);
        assertEquals(new BigDecimal("10.00"), disc);
    }

    @Test
    @DisplayName("Discount Product-Specific Restriction")
    void testProductSpecificDiscount() {
        CreateDiscountRequest req = new CreateDiscountRequest();
        req.setCode("PRODUCT_A_ONLY");
        req.setDiscountType(DiscountType.PERCENTAGE);
        req.setDiscountValue(new BigDecimal("25.00"));
        req.setApplicableProductId(productA.getId());

        discountService.createDiscount(req);

        LocalDate today = LocalDate.now();

        // Attempt on Product B should fail
        assertThrows(BusinessRuleException.class, () -> {
            discountService.evaluateAndCalculateDiscount("PRODUCT_A_ONLY", new BigDecimal("80.00"), 1, productB.getId(), null, today);
        });

        // Attempt on Product A succeeds
        BigDecimal disc = discountService.evaluateAndCalculateDiscount("PRODUCT_A_ONLY", new BigDecimal("50.00"), 1, productA.getId(), null, today);
        assertEquals(new BigDecimal("12.50"), disc);
    }
}
