package com.subscription.dashboard.controller;

import com.subscription.common.ApiResponse;
import com.subscription.dashboard.dto.CustomerInvoiceDTO;
import com.subscription.dashboard.dto.CustomerPaymentDTO;
import com.subscription.dashboard.dto.CustomerPortalSummaryDTO;
import com.subscription.dashboard.dto.CustomerSubscriptionDTO;
import com.subscription.dashboard.service.CustomerPortalService;
import com.subscription.security.CurrentUser;
import com.subscription.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/portal")
@PreAuthorize("isAuthenticated()")
public class CustomerPortalController {

    private final CustomerPortalService portalService;

    public CustomerPortalController(CustomerPortalService portalService) {
        this.portalService = portalService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<CustomerPortalSummaryDTO>> getSummary(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) Long customerId) {
        CustomerPortalSummaryDTO summary = portalService.getCustomerPortalSummary(currentUser, customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer summary retrieved successfully", summary));
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<ApiResponse<List<CustomerSubscriptionDTO>>> getSubscriptions(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) Long customerId) {
        List<CustomerSubscriptionDTO> subscriptions = portalService.getCustomerSubscriptions(currentUser, customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer subscriptions retrieved successfully", subscriptions));
    }

    @GetMapping("/invoices")
    public ResponseEntity<ApiResponse<List<CustomerInvoiceDTO>>> getInvoices(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) Long customerId) {
        List<CustomerInvoiceDTO> invoices = portalService.getCustomerInvoices(currentUser, customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer invoices retrieved successfully", invoices));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<List<CustomerPaymentDTO>>> getPayments(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) Long customerId) {
        List<CustomerPaymentDTO> payments = portalService.getCustomerPayments(currentUser, customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer payments retrieved successfully", payments));
    }
}
