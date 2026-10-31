package com.subscription.payment.repository;

import com.subscription.payment.entity.Payment;
import com.subscription.payment.entity.PaymentRecordStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillingPaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    List<Payment> findByInvoiceId(Long invoiceId);

    List<Payment> findByStatus(PaymentRecordStatus status);

    @Query("SELECT COUNT(p), COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'COMPLETED'")
    List<Object[]> getPaymentMetrics();
}

