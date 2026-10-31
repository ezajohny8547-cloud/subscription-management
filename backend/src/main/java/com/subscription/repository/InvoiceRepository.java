package com.subscription.repository;

import com.subscription.entity.Invoice;
import com.subscription.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    List<Invoice> findByUserId(Long userId);

    Page<Invoice> findByUserId(Long userId, Pageable pageable);

    long countByStatus(InvoiceStatus status);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = 'OVERDUE' OR (i.status = 'PENDING' AND i.dueDate < :today)")
    long countOverdueInvoices(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status <> 'CANCELLED'")
    BigDecimal calculateTotalInvoicedAmount();

    @Query("SELECT COALESCE(SUM(i.paidAmount), 0) FROM Invoice i")
    BigDecimal calculateTotalRevenueReceived();

    @Query("SELECT COALESCE(SUM(i.outstandingAmount), 0) FROM Invoice i WHERE i.status <> 'CANCELLED'")
    BigDecimal calculateTotalOutstandingBalance();

    @Query("SELECT COALESCE(SUM(i.outstandingAmount), 0) FROM Invoice i WHERE i.user.id = :userId AND i.status <> 'CANCELLED'")
    BigDecimal calculateCustomerOutstandingBalance(@Param("userId") Long userId);

    @Query("SELECT i.status, COUNT(i), COALESCE(SUM(i.totalAmount), 0) FROM Invoice i GROUP BY i.status")
    List<Object[]> getInvoiceStatusBreakdown();

    @Query("SELECT i FROM Invoice i JOIN FETCH i.user LEFT JOIN FETCH i.subscription s LEFT JOIN FETCH s.plan WHERE i.user.id = :userId ORDER BY i.issueDate DESC")
    List<Invoice> findCustomerInvoicesDetailed(@Param("userId") Long userId);
}
