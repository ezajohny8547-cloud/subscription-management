package com.subscription.subscription;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.product.repository.ProductRepository;
import com.subscription.product.service.ProductService;
import com.subscription.subscription.entity.BillingInterval;
import com.subscription.subscription.entity.Plan;
import com.subscription.subscription.entity.PlanStatus;
import com.subscription.subscription.repository.PlanRepository;
import com.subscription.subscription.service.PlanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class PlanServiceTest {

    @Mock
    private PlanRepository planRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductService productService;

    private PlanService planService;

    @BeforeEach
    void setUp() {
        planService = new PlanService(planRepository, productRepository, productService);
    }

    @Test
    @DisplayName("Validate plan availability succeeds when active and within date window")
    void testValidatePlanAvailabilitySuccess() {
        Plan plan = new Plan();
        plan.setPlanName("Pro SaaS");
        plan.setStatus(PlanStatus.ACTIVE);
        plan.setAvailabilityStartDate(LocalDate.now().minusDays(10));
        plan.setAvailabilityEndDate(LocalDate.now().plusDays(10));

        assertDoesNotThrow(() -> planService.validatePlanAvailability(plan, LocalDate.now()));
    }

    @Test
    @DisplayName("Validate plan availability fails when plan is INACTIVE")
    void testValidatePlanAvailabilityInactive() {
        Plan plan = new Plan();
        plan.setPlanName("Retired Plan");
        plan.setStatus(PlanStatus.INACTIVE);
        plan.setAvailabilityStartDate(LocalDate.now().minusDays(10));
        plan.setAvailabilityEndDate(LocalDate.now().plusDays(10));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> planService.validatePlanAvailability(plan, LocalDate.now()));
        assertTrue(ex.getMessage().contains("not active"));
    }

    @Test
    @DisplayName("Validate plan availability fails when current date is past end date")
    void testValidatePlanAvailabilityExpired() {
        Plan plan = new Plan();
        plan.setPlanName("Summer Promo Plan");
        plan.setStatus(PlanStatus.ACTIVE);
        plan.setAvailabilityStartDate(LocalDate.now().minusDays(30));
        plan.setAvailabilityEndDate(LocalDate.now().minusDays(1)); // Expired yesterday

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> planService.validatePlanAvailability(plan, LocalDate.now()));
        assertTrue(ex.getMessage().contains("has expired"));
    }
}
