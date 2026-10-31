package com.subscription.billing.controller;

import com.subscription.billing.dto.CreateDiscountRequest;
import com.subscription.billing.dto.DiscountResponse;
import com.subscription.billing.service.DiscountService;
import com.subscription.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discounts")
@CrossOrigin(origins = "*")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DiscountResponse>> createDiscount(@Valid @RequestBody CreateDiscountRequest request) {
        DiscountResponse response = discountService.createDiscount(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Discount rule created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DiscountResponse>>> getDiscounts() {
        List<DiscountResponse> list = discountService.getAllDiscounts();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DiscountResponse>> getDiscountById(@PathVariable Long id) {
        DiscountResponse response = discountService.getDiscountById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<DiscountResponse>> toggleDiscount(@PathVariable Long id) {
        DiscountResponse response = discountService.toggleDiscountStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Discount status updated successfully", response));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateDiscount(
            @RequestParam String code,
            @RequestParam BigDecimal subtotal,
            @RequestParam(defaultValue = "1") int quantity,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long subscriptionId) {
        BigDecimal discountAmount = discountService.evaluateAndCalculateDiscount(
                code,
                subtotal,
                quantity,
                productId,
                subscriptionId,
                LocalDate.now()
        );
        Map<String, Object> data = new HashMap<>();
        data.put("code", code);
        data.put("valid", true);
        data.put("discountAmount", discountAmount);
        data.put("netSubtotal", subtotal.subtract(discountAmount));
        return ResponseEntity.ok(ApiResponse.success("Discount code is valid", data));
    }
}
