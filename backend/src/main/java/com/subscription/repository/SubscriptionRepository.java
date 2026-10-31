package com.subscription.repository;

import com.subscription.model.Subscription;
import com.subscription.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findBySubscriptionNumber(String subscriptionNumber);

    List<Subscription> findByCustomerId(Long customerId);

    @Query("SELECT s FROM Subscription s WHERE s.status = :status AND s.nextBillingDate <= :referenceDate")
    List<Subscription> findDueSubscriptions(
            @Param("status") SubscriptionStatus status,
            @Param("referenceDate") LocalDate referenceDate
    );
}
