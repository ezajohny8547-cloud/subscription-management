package com.subscription.billing.repository;

import com.subscription.billing.entity.DiscountUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountUsageRepository extends JpaRepository<DiscountUsage, Long> {
    List<DiscountUsage> findByDiscountId(Long discountId);

    List<DiscountUsage> findByInvoiceId(Long invoiceId);

    long countByDiscountIdAndCustomerId(Long discountId, Long customerId);
}
