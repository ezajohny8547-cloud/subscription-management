package com.subscription.billing.controller;

import com.subscription.billing.dto.CreateTaxRuleRequest;
import com.subscription.billing.dto.TaxRuleResponse;
import com.subscription.billing.entity.TaxRule;
import com.subscription.billing.repository.TaxRuleRepository;
import com.subscription.common.ApiResponse;
import com.subscription.common.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tax-rules")
@CrossOrigin(origins = "*")
public class TaxRuleController {

    private final TaxRuleRepository taxRuleRepository;

    public TaxRuleController(TaxRuleRepository taxRuleRepository) {
        this.taxRuleRepository = taxRuleRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaxRuleResponse>>> getTaxRules() {
        List<TaxRuleResponse> list = taxRuleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaxRuleResponse>> createTaxRule(@Valid @RequestBody CreateTaxRuleRequest request) {
        TaxRule taxRule = new TaxRule(
                request.getRuleName(),
                request.getRatePercentage().setScale(2, RoundingMode.HALF_UP),
                request.getCountry(),
                request.getState(),
                request.getDescription()
        );
        TaxRule saved = taxRuleRepository.save(taxRule);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tax rule created successfully", mapToResponse(saved)));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<TaxRuleResponse>> toggleTaxRule(@PathVariable Long id) {
        TaxRule rule = taxRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tax rule not found with ID: " + id));
        rule.setActive(!rule.isActive());
        TaxRule saved = taxRuleRepository.save(rule);
        return ResponseEntity.ok(ApiResponse.success("Tax rule status updated", mapToResponse(saved)));
    }

    private TaxRuleResponse mapToResponse(TaxRule rule) {
        TaxRuleResponse res = new TaxRuleResponse();
        res.setId(rule.getId());
        res.setRuleName(rule.getRuleName());
        res.setRatePercentage(rule.getRatePercentage());
        res.setCountry(rule.getCountry());
        res.setState(rule.getState());
        res.setActive(rule.isActive());
        res.setDescription(rule.getDescription());
        return res;
    }
}

