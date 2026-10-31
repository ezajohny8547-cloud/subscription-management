package com.subscription.dashboard;

import com.subscription.dashboard.dto.DashboardChartsDTO;
import com.subscription.dashboard.dto.DashboardStatsDTO;
import com.subscription.dashboard.service.DashboardService;
import com.subscription.entity.SubscriptionStatus;
import com.subscription.repository.InvoiceRepository;
import com.subscription.repository.PaymentRepository;
import com.subscription.repository.PlanRepository;
import com.subscription.repository.SubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PlanRepository planRepository;

    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        dashboardService = new DashboardService(subscriptionRepository, invoiceRepository, paymentRepository, planRepository);
    }

    @Test
    void testGetDashboardStats_computesCorrectAggregates() {
        when(subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE)).thenReturn(42L);
        when(invoiceRepository.calculateTotalInvoicedAmount()).thenReturn(BigDecimal.valueOf(15000.00));
        when(invoiceRepository.calculateTotalRevenueReceived()).thenReturn(BigDecimal.valueOf(12000.00));
        when(invoiceRepository.calculateTotalOutstandingBalance()).thenReturn(BigDecimal.valueOf(3000.00));
        when(invoiceRepository.countOverdueInvoices(any(LocalDate.class))).thenReturn(4L);
        when(subscriptionRepository.countUpcomingRenewals(any(LocalDate.class), any(LocalDate.class))).thenReturn(9L);

        DashboardStatsDTO stats = dashboardService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(42L, stats.getActiveSubscriptions());
        assertEquals(BigDecimal.valueOf(15000.00), stats.getTotalInvoiced());
        assertEquals(BigDecimal.valueOf(12000.00), stats.getRevenueReceived());
        assertEquals(BigDecimal.valueOf(3000.00), stats.getOutstandingBalances());
        assertEquals(4L, stats.getOverdueInvoices());
        assertEquals(9L, stats.getUpcomingRenewals());
    }

    @Test
    void testGetDashboardCharts_returnsNonNullDistributions() {
        List<Object[]> statusList = new ArrayList<>();
        statusList.add(new Object[]{"ACTIVE", 30L});
        statusList.add(new Object[]{"CANCELLED", 5L});
        when(subscriptionRepository.countSubscriptionsByStatusGroup()).thenReturn(statusList);

        when(invoiceRepository.findAll()).thenReturn(Collections.emptyList());
        when(invoiceRepository.getInvoiceStatusBreakdown()).thenReturn(Collections.emptyList());
        when(subscriptionRepository.countSubscriptionsByPlanGroup()).thenReturn(Collections.emptyList());
        when(paymentRepository.getPaymentsByMethodBreakdown()).thenReturn(Collections.emptyList());

        DashboardChartsDTO charts = dashboardService.getDashboardCharts();

        assertNotNull(charts);
        assertEquals(6, charts.getRevenueOverTime().size());
        assertEquals(2, charts.getSubscriptionStatusDistribution().size());
        assertEquals("ACTIVE", charts.getSubscriptionStatusDistribution().get(0).getLabel());
        assertEquals(85.7, charts.getSubscriptionStatusDistribution().get(0).getPercentage());
    }
}
