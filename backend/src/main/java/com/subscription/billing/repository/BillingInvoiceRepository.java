package com.subscription.billing.repository;

import com.subscription.billing.entity.Invoice;
import com.subscription.billing.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByCustomerId(Long customerId);

    List<Invoice> findBySubscriptionId(Long subscriptionId);

    List<Invoice> findByStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.status = :status AND i.amountPaid > 0 AND i.amountPaid < i.totalAmount")
    List<Invoice> findPartiallyPaidInvoices(@Param("status") InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.status = :status AND i.amountPaid = 0")
    List<Invoice> findUnpaidInvoices(@Param("status") InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE i.status = 'CONFIRMED' AND i.dueDate < :currentDate AND i.outstandingBalance > 0")
    List<Invoice> findOverdueInvoices(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(i), COALESCE(SUM(i.totalAmount), 0), COALESCE(SUM(i.amountPaid), 0), COALESCE(SUM(i.outstandingBalance), 0) FROM Invoice i")
    List<Object[]> getOverallInvoiceMetrics();

    @Query("SELECT COUNT(i), COALESCE(SUM(i.outstandingBalance), 0) FROM Invoice i WHERE i.status = 'CONFIRMED' AND i.dueDate < :currentDate AND i.outstandingBalance > 0")
    List<Object[]> getOverdueMetrics(@Param("currentDate") LocalDate currentDate);

    @Query("SELECT COUNT(i), COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status = :status")
    List<Object[]> getMetricsByStatus(@Param("status") InvoiceStatus status);
}

