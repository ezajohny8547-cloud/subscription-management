package com.subscription.billing.repository;

import com.subscription.billing.entity.TaxRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxRuleRepository extends JpaRepository<TaxRule, Long> {
    List<TaxRule> findByActiveTrue();

    Optional<TaxRule> findByCountryAndStateAndActiveTrue(String country, String state);

    Optional<TaxRule> findByCountryAndStateIsNullAndActiveTrue(String country);
}
