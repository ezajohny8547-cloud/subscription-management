package com.subscription.repository;

import com.subscription.model.Subscription;
import com.subscription.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BillingSubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByStatusAndNextBillingDateLessThanEqual(
            SubscriptionStatus status, LocalDate date);
}
