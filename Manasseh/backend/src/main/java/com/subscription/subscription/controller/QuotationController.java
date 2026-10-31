package com.subscription.subscription.controller;

import com.subscription.common.ApiResponse;
import com.subscription.subscription.dto.QuotationDTO;
import com.subscription.subscription.dto.QuotationTemplateDTO;
import com.subscription.subscription.dto.SubscriptionDTO;
import com.subscription.subscription.entity.QuotationStatus;
import com.subscription.subscription.service.QuotationService;
import com.subscription.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Quotation management.
 * Base path: /api/quotations
 */
@RestController
@RequestMapping("/api/quotations")
public class QuotationController {

    private final QuotationService quotationService;
    private final SubscriptionService subscriptionService;

    public QuotationController(QuotationService quotationService, SubscriptionService subscriptionService) {
        this.quotationService = quotationService;
        this.subscriptionService = subscriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<QuotationDTO>>> getAllQuotations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) QuotationStatus status,
            @RequestParam(required = false) Long customerId) {
        List<QuotationDTO> quotations = quotationService.searchQuotations(search, status, customerId);
        return ResponseEntity.ok(ApiResponse.ok("Quotations retrieved successfully", quotations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationDTO>> getQuotationById(@PathVariable Long id) {
        QuotationDTO quotation = quotationService.getQuotationById(id);
        return ResponseEntity.ok(ApiResponse.ok(quotation));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QuotationDTO>> createQuotation(@Valid @RequestBody QuotationDTO dto) {
        QuotationDTO created = quotationService.createQuotation(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Quotation created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuotationDTO>> updateQuotation(
            @PathVariable Long id,
            @Valid @RequestBody QuotationDTO dto) {
        QuotationDTO updated = quotationService.updateQuotation(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Quotation updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<QuotationDTO>> updateStatus(
            @PathVariable Long id,
            @RequestParam QuotationStatus status) {
        QuotationDTO updated = quotationService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Quotation status updated", updated));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<ApiResponse<SubscriptionDTO>> convertToSubscription(@PathVariable Long id) {
        SubscriptionDTO subscription = subscriptionService.convertQuotationToSubscription(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Quotation converted to subscription successfully", subscription));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuotation(@PathVariable Long id) {
        quotationService.deleteQuotation(id);
        return ResponseEntity.ok(ApiResponse.ok("Quotation deleted successfully", null));
    }

    // =========================================================================
    // Reusable Quotation Templates
    // =========================================================================

    @GetMapping("/templates")
    public ResponseEntity<ApiResponse<List<QuotationTemplateDTO>>> getTemplates() {
        List<QuotationTemplateDTO> templates = quotationService.getActiveTemplates();
        return ResponseEntity.ok(ApiResponse.ok("Active quotation templates", templates));
    }

    @PostMapping("/templates")
    public ResponseEntity<ApiResponse<QuotationTemplateDTO>> createTemplate(@Valid @RequestBody QuotationTemplateDTO dto) {
        QuotationTemplateDTO created = quotationService.createTemplate(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Quotation template created", created));
    }
}
