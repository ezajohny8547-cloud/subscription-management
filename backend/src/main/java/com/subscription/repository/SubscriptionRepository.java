package com.subscription.repository;

import com.subscription.entity.Subscription;
import com.subscription.entity.SubscriptionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long>, JpaSpecificationExecutor<Subscription> {

    long countByStatus(SubscriptionStatus status);

    List<Subscription> findByUserId(Long userId);

    Page<Subscription> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT s FROM Subscription s JOIN FETCH s.user JOIN FETCH s.plan WHERE s.status = 'ACTIVE' AND s.renewalDate BETWEEN :today AND :targetDate ORDER BY s.renewalDate ASC")
    List<Subscription> findUpcomingRenewals(@Param("today") LocalDate today, @Param("targetDate") LocalDate targetDate, Pageable pageable);

    @Query("SELECT s.status, COUNT(s) FROM Subscription s GROUP BY s.status")
    List<Object[]> countSubscriptionsByStatusGroup();

    @Query("SELECT s.plan.name, COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' GROUP BY s.plan.name")
    List<Object[]> countSubscriptionsByPlanGroup();

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.renewalDate BETWEEN :today AND :targetDate")
    long countUpcomingRenewals(@Param("today") LocalDate today, @Param("targetDate") LocalDate targetDate);
}
