package com.subscription.subscription.repository;

import com.subscription.subscription.entity.Subscription;
import com.subscription.subscription.entity.SubscriptionStatus;
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

    List<Subscription> findByStatus(SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE " +
           "(:search IS NULL OR LOWER(s.subscriptionNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(s.customerName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(s.customerEmail) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:customerId IS NULL OR s.customerId = :customerId) AND " +
           "(:planId IS NULL OR s.plan.planId = :planId) " +
           "ORDER BY s.createdAt DESC")
    List<Subscription> searchSubscriptions(@Param("search") String search,
                                          @Param("status") SubscriptionStatus status,
                                          @Param("customerId") Long customerId,
                                          @Param("planId") Long planId);

    /**
     * Finds active subscriptions eligible for automatic closure according to plan settings.
     */
    @Query("SELECT s FROM Subscription s JOIN s.plan p WHERE s.status = 'ACTIVE' AND (" +
           "(p.autoClose = true AND s.expiryDate <= :today) OR " +
           "(p.autoCloseAfterCycles IS NOT NULL AND s.billingCyclesCompleted >= p.autoCloseAfterCycles)" +
           ")")
    List<Subscription> findSubscriptionsEligibleForAutoClose(@Param("today") LocalDate today);

    /**
     * Stored accurate billing query for Module 3 (Billing & Invoicing) to determine when invoices are due.
     */
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.nextBillingDate <= :dueLimit")
    List<Subscription> findSubscriptionsDueForBilling(@Param("dueLimit") LocalDate dueLimit);
}
