package com.subscription.billing.repository;

import com.subscription.billing.entity.BillingPeriodRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface BillingPeriodRecordRepository extends JpaRepository<BillingPeriodRecord, Long> {

    boolean existsBySubscriptionIdAndPeriodStartAndPeriodEnd(
            Long subscriptionId,
            LocalDate periodStart,
            LocalDate periodEnd
    );

    Optional<BillingPeriodRecord> findBySubscriptionIdAndPeriodStartAndPeriodEnd(
            Long subscriptionId,
            LocalDate periodStart,
            LocalDate periodEnd
    );
}
