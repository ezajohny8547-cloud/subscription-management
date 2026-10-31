package com.subscription.subscription.controller;

import com.subscription.common.ApiResponse;
import com.subscription.subscription.dto.SubscriptionDTO;
import com.subscription.subscription.dto.SubscriptionTransitionRequest;
import com.subscription.subscription.entity.SubscriptionStatus;
import com.subscription.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Subscription lifecycle management.
 * Base path: /api/subscriptions
 */
@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionDTO>>> getAllSubscriptions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) SubscriptionStatus status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long planId) {
        List<SubscriptionDTO> subscriptions = subscriptionService.searchSubscriptions(search, status, customerId, planId);
        return ResponseEntity.ok(ApiResponse.ok("Subscriptions retrieved successfully", subscriptions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> getSubscriptionById(@PathVariable Long id) {
        SubscriptionDTO subscription = subscriptionService.getSubscriptionById(id);
        return ResponseEntity.ok(ApiResponse.ok(subscription));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionDTO>> createSubscription(@Valid @RequestBody SubscriptionDTO dto) {
        SubscriptionDTO created = subscriptionService.createSubscription(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Subscription created successfully", created));
    }

    @PostMapping("/{id}/transition")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> transitionStatus(
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionTransitionRequest request) {
        SubscriptionDTO updated = subscriptionService.transitionStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Subscription status updated successfully", updated));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> activateSubscription(@PathVariable Long id) {
        SubscriptionDTO updated = subscriptionService.activateSubscription(id);
        return ResponseEntity.ok(ApiResponse.ok("Subscription activated successfully", updated));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> pauseSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : "Customer requested pause";
        SubscriptionDTO updated = subscriptionService.pauseSubscription(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Subscription paused", updated));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> resumeSubscription(@PathVariable Long id) {
        SubscriptionDTO updated = subscriptionService.resumeSubscription(id);
        return ResponseEntity.ok(ApiResponse.ok("Subscription resumed successfully", updated));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> renewSubscription(@PathVariable Long id) {
        SubscriptionDTO updated = subscriptionService.renewSubscription(id);
        return ResponseEntity.ok(ApiResponse.ok("Subscription renewed successfully", updated));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> closeSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null) ? body.get("reason") : "Early termination requested";
        SubscriptionDTO updated = subscriptionService.closeSubscriptionEarly(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Subscription closed successfully", updated));
    }

    @PostMapping("/process-auto-close")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerAutoClose() {
        int count = subscriptionService.processAutomaticClosures();
        return ResponseEntity.ok(ApiResponse.ok("Automatic closure process executed",
                Map.of("processedCount", count, "status", "SUCCESS")));
    }
}
