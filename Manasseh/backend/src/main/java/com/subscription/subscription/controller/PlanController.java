package com.subscription.subscription.controller;

import com.subscription.common.ApiResponse;
import com.subscription.subscription.dto.PlanDTO;
import com.subscription.subscription.entity.BillingInterval;
import com.subscription.subscription.entity.PlanStatus;
import com.subscription.subscription.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Subscription Plan management.
 * Base path: /api/plans
 */
@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanDTO>>> getAllPlans(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BillingInterval interval,
            @RequestParam(required = false) PlanStatus status) {
        List<PlanDTO> plans = planService.searchPlans(search, interval, status);
        return ResponseEntity.ok(ApiResponse.ok("Plans retrieved successfully", plans));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<PlanDTO>>> getAvailablePlans() {
        List<PlanDTO> availablePlans = planService.getActiveAvailablePlans();
        return ResponseEntity.ok(ApiResponse.ok("Currently available plans", availablePlans));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanDTO>> getPlanById(@PathVariable Long id) {
        PlanDTO plan = planService.getPlanById(id);
        return ResponseEntity.ok(ApiResponse.ok(plan));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PlanDTO>> createPlan(@Valid @RequestBody PlanDTO dto) {
        PlanDTO created = planService.createPlan(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Plan created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanDTO>> updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody PlanDTO dto) {
        PlanDTO updated = planService.updatePlan(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Plan updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PlanDTO>> updatePlanStatus(
            @PathVariable Long id,
            @RequestParam PlanStatus status) {
        PlanDTO updated = planService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Plan status updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.ok("Plan deleted successfully", null));
    }
}
