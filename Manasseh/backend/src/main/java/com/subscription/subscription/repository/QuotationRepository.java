package com.subscription.subscription.repository;

import com.subscription.subscription.entity.Quotation;
import com.subscription.subscription.entity.QuotationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    Optional<Quotation> findByQuotationNumber(String quotationNumber);

    List<Quotation> findByCustomerId(Long customerId);

    List<Quotation> findByStatus(QuotationStatus status);

    @Query("SELECT q FROM Quotation q WHERE " +
           "(:search IS NULL OR LOWER(q.quotationNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(q.customerName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "   OR LOWER(q.customerEmail) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:status IS NULL OR q.status = :status) AND " +
           "(:customerId IS NULL OR q.customerId = :customerId) " +
           "ORDER BY q.createdAt DESC")
    List<Quotation> searchQuotations(@Param("search") String search,
                                    @Param("status") QuotationStatus status,
                                    @Param("customerId") Long customerId);
}
