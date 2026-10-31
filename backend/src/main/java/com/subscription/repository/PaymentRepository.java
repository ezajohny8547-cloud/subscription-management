package com.subscription.repository;

import com.subscription.entity.Payment;
import com.subscription.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserId(Long userId);

    Page<Payment> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal calculateSuccessfulPaymentsSum();

    @Query("SELECT p.paymentMethod, COUNT(p), COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS' GROUP BY p.paymentMethod")
    List<Object[]> getPaymentsByMethodBreakdown();

    @Query("SELECT p FROM Payment p JOIN FETCH p.invoice JOIN FETCH p.user WHERE p.user.id = :userId ORDER BY p.paymentDate DESC")
    List<Payment> findCustomerPaymentsDetailed(@Param("userId") Long userId);

    @Query("SELECT p FROM Payment p WHERE p.status = 'SUCCESS' AND p.paymentDate >= :fromDate ORDER BY p.paymentDate ASC")
    List<Payment> findSuccessfulPaymentsSince(@Param("fromDate") LocalDateTime fromDate);
}
