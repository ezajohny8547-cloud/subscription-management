package com.subscription.payment.controller;

import com.subscription.common.dto.ApiResponse;
import com.subscription.payment.dto.PaymentResponse;
import com.subscription.payment.dto.PaymentSummaryResponse;
import com.subscription.payment.dto.RecordPaymentRequest;
import com.subscription.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/api/invoices/{id}/payments")
    public ResponseEntity<ApiResponse<PaymentResponse>> recordPayment(
            @PathVariable("id") Long invoiceId,
            @Valid @RequestBody RecordPaymentRequest request) {
        request.setInvoiceId(invoiceId);
        PaymentResponse response = paymentService.recordPayment(invoiceId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment recorded successfully", response));
    }

    @GetMapping("/api/invoices/{id}/payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentsByInvoice(@PathVariable("id") Long invoiceId) {
        List<PaymentResponse> list = paymentService.getPaymentsByInvoiceId(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/api/payments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments() {
        List<PaymentResponse> list = paymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/api/payments/summary")
    public ResponseEntity<ApiResponse<PaymentSummaryResponse>> getPaymentSummary() {
        PaymentSummaryResponse summary = paymentService.getPaymentSummary();
        return ResponseEntity.ok(ApiResponse.success("Payment summary retrieved", summary));
    }
}
