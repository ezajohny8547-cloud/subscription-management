package com.subscription.subscription.repository;

import com.subscription.subscription.entity.BillingInterval;
import com.subscription.subscription.entity.Plan;
import com.subscription.subscription.entity.PlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    Optional<Plan> findByPlanCode(String planCode);

    boolean existsByPlanCode(String planCode);

    boolean existsByPlanCodeAndPlanIdNot(String planCode, Long planId);

    List<Plan> findByStatus(PlanStatus status);

    List<Plan> findByBillingInterval(BillingInterval interval);

    @Query("SELECT p FROM Plan p WHERE p.status = 'ACTIVE' " +
           "AND :currentDate >= p.availabilityStartDate " +
           "AND :currentDate <= p.availabilityEndDate")
    List<Plan> findActiveAndAvailablePlans(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT p FROM Plan p WHERE " +
           "(:query IS NULL OR LOWER(p.planName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.planCode) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:interval IS NULL OR p.billingInterval = :interval) AND " +
           "(:status IS NULL OR p.status = :status)")
    List<Plan> searchPlans(@Param("query") String query,
                           @Param("interval") BillingInterval interval,
                           @Param("status") PlanStatus status);
}
