package com.subscription.billing.controller;

import com.subscription.billing.dto.*;
import com.subscription.billing.service.InvoiceService;
import com.subscription.billing.service.RecurringBillingService;
import com.subscription.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final RecurringBillingService recurringBillingService;

    public InvoiceController(InvoiceService invoiceService, RecurringBillingService recurringBillingService) {
        this.invoiceService = invoiceService;
        this.recurringBillingService = recurringBillingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        InvoiceResponse response = invoiceService.createInvoice(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invoice created successfully in DRAFT status", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getInvoices(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long subscriptionId) {
        List<InvoiceResponse> list = invoiceService.getInvoices(status, customerId, subscriptionId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<InvoiceSummaryResponse>> getInvoiceSummary() {
        InvoiceSummaryResponse summary = invoiceService.getInvoiceSummary();
        return ResponseEntity.ok(ApiResponse.success("Invoice summary retrieved successfully", summary));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable Long id) {
        InvoiceResponse response = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<InvoiceResponse>> confirmInvoice(@PathVariable Long id) {
        InvoiceResponse response = invoiceService.confirmInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice confirmed successfully", response));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        InvoiceResponse response = invoiceService.cancelInvoice(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Invoice cancelled successfully", response));
    }

    @PutMapping("/{id}/send")
    public ResponseEntity<ApiResponse<InvoiceResponse>> sendInvoice(@PathVariable Long id) {
        InvoiceResponse response = invoiceService.sendInvoice(id);
        return ResponseEntity.ok(ApiResponse.success("Invoice marked as sent and notification dispatched", response));
    }

    @PostMapping("/billing/trigger-run")
    public ResponseEntity<ApiResponse<RecurringBillingRunResult>> triggerRecurringBilling(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate runDate = date != null ? date : LocalDate.now();
        RecurringBillingRunResult result = recurringBillingService.runRecurringBilling(runDate);
        return ResponseEntity.ok(ApiResponse.success("Recurring billing executed successfully", result));
    }
}
