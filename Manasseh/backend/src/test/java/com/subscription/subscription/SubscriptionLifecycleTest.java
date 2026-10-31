package com.subscription.subscription;

import com.subscription.common.exception.InvalidStateTransitionException;
import com.subscription.subscription.dto.SubscriptionDTO;
import com.subscription.subscription.dto.SubscriptionTransitionRequest;
import com.subscription.subscription.entity.*;
import com.subscription.subscription.repository.SubscriptionHistoryRepository;
import com.subscription.subscription.repository.SubscriptionRepository;
import com.subscription.subscription.service.PlanService;
import com.subscription.subscription.service.QuotationService;
import com.subscription.subscription.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionLifecycleTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private SubscriptionHistoryRepository historyRepository;

    @Mock
    private PlanService planService;

    @Mock
    private QuotationService quotationService;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private Subscription testSubscription;
    private Plan testPlan;

    @BeforeEach
    void setUp() {
        testPlan = new Plan();
        testPlan.setPlanId(1L);
        testPlan.setPlanName("Pro Plan");
        testPlan.setStatus(PlanStatus.ACTIVE);
        testPlan.setBillingInterval(BillingInterval.MONTHLY);
        testPlan.setAvailabilityStartDate(LocalDate.now().minusDays(10));
        testPlan.setAvailabilityEndDate(LocalDate.now().plusMonths(6));
        testPlan.setMinimumQuantity(1);

        testSubscription = new Subscription();
        testSubscription.setSubscriptionId(100L);
        testSubscription.setSubscriptionNumber("SUB-2026-0001");
        testSubscription.setCustomerId(1L);
        testSubscription.setCustomerName("Acme Corp");
        testSubscription.setCustomerEmail("billing@acme.com");
        testSubscription.setPlan(testPlan);
        testSubscription.setStartDate(LocalDate.now());
        testSubscription.setExpiryDate(LocalDate.now().plusMonths(1));
        testSubscription.setNextBillingDate(LocalDate.now());
        testSubscription.setStatus(SubscriptionStatus.DRAFT);
    }

    @Test
    @DisplayName("Status progression from DRAFT to CONFIRMED succeeds")
    void testDraftToConfirmed() {
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionTransitionRequest req = new SubscriptionTransitionRequest(SubscriptionStatus.CONFIRMED, "Contract signed", "STAFF");
        SubscriptionDTO result = subscriptionService.transitionStatus(100L, req);

        assertEquals(SubscriptionStatus.CONFIRMED, result.getStatus());
        verify(historyRepository).save(any(SubscriptionHistory.class));
    }

    @Test
    @DisplayName("Status progression from CONFIRMED to ACTIVE succeeds")
    void testConfirmedToActive() {
        testSubscription.setStatus(SubscriptionStatus.CONFIRMED);
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionDTO result = subscriptionService.activateSubscription(100L);

        assertEquals(SubscriptionStatus.ACTIVE, result.getStatus());
    }

    @Test
    @DisplayName("Pausing and resuming an active subscription succeeds")
    void testPauseAndResume() {
        testSubscription.setStatus(SubscriptionStatus.ACTIVE);
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        // Pause
        SubscriptionDTO paused = subscriptionService.pauseSubscription(100L, "Temporary maintenance");
        assertEquals(SubscriptionStatus.PAUSED, paused.getStatus());

        // Resume
        SubscriptionDTO resumed = subscriptionService.resumeSubscription(100L);
        assertEquals(SubscriptionStatus.ACTIVE, resumed.getStatus());
    }

    @Test
    @DisplayName("Invalid state transition throws InvalidStateTransitionException")
    void testInvalidTransitionThrowsException() {
        testSubscription.setStatus(SubscriptionStatus.CLOSED);
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(testSubscription));

        // Cannot transition from CLOSED to ACTIVE
        SubscriptionTransitionRequest req = new SubscriptionTransitionRequest(SubscriptionStatus.ACTIVE, "Reactivate", "STAFF");
        assertThrows(InvalidStateTransitionException.class, () -> subscriptionService.transitionStatus(100L, req));
    }

    @Test
    @DisplayName("Renewing an active subscription extends expiry and advances next billing date")
    void testRenewal() {
        testSubscription.setStatus(SubscriptionStatus.ACTIVE);
        LocalDate oldExpiry = testSubscription.getExpiryDate();
        when(subscriptionRepository.findById(100L)).thenReturn(Optional.of(testSubscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        SubscriptionDTO renewed = subscriptionService.renewSubscription(100L);

        assertEquals(SubscriptionStatus.ACTIVE, renewed.getStatus());
        assertEquals(oldExpiry.plusMonths(1), renewed.getExpiryDate());
        assertEquals(1, renewed.getBillingCyclesCompleted());
    }
}
