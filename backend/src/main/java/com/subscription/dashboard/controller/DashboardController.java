package com.subscription.dashboard.controller;

import com.subscription.common.ApiResponse;
import com.subscription.dashboard.dto.DashboardChartsDTO;
import com.subscription.dashboard.dto.DashboardStatsDTO;
import com.subscription.dashboard.dto.RenewalItemDTO;
import com.subscription.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getStats() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics retrieved successfully", stats));
    }

    @GetMapping("/charts")
    public ResponseEntity<ApiResponse<DashboardChartsDTO>> getCharts() {
        DashboardChartsDTO charts = dashboardService.getDashboardCharts();
        return ResponseEntity.ok(ApiResponse.success("Dashboard charts retrieved successfully", charts));
    }

    @GetMapping("/renewals")
    public ResponseEntity<ApiResponse<List<RenewalItemDTO>>> getUpcomingRenewals(
            @RequestParam(defaultValue = "10") int limit) {
        List<RenewalItemDTO> renewals = dashboardService.getUpcomingRenewals(limit);
        return ResponseEntity.ok(ApiResponse.success("Upcoming renewals retrieved successfully", renewals));
    }
}
