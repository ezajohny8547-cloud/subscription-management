package com.subscription.billing.service;

import com.subscription.billing.entity.TaxRule;
import com.subscription.billing.repository.TaxRuleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
public class TaxCalculationService {

    private final TaxRuleRepository taxRuleRepository;

    public TaxCalculationService(TaxRuleRepository taxRuleRepository) {
        this.taxRuleRepository = taxRuleRepository;
    }

    public TaxRule determineApplicableTaxRule(String country, String state) {
        if (country != null && state != null) {
            Optional<TaxRule> stateRule = taxRuleRepository.findByCountryAndStateAndActiveTrue(country, state);
            if (stateRule.isPresent()) {
                return stateRule.get();
            }
        }
        if (country != null) {
            Optional<TaxRule> countryRule = taxRuleRepository.findByCountryAndStateIsNullAndActiveTrue(country);
            if (countryRule.isPresent()) {
                return countryRule.get();
            }
        }
        // Fallback to any active default tax rule
        List<TaxRule> activeRules = taxRuleRepository.findByActiveTrue();
        if (!activeRules.isEmpty()) {
            return activeRules.get(0);
        }
        return null;
    }

    public BigDecimal calculateTaxAmount(BigDecimal taxableBase, BigDecimal ratePercentage) {
        if (taxableBase == null || ratePercentage == null || taxableBase.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return taxableBase.multiply(ratePercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
