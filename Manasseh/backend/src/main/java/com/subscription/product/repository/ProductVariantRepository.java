package com.subscription.product.repository;

import com.subscription.product.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    List<ProductVariant> findByProductProductId(Long productId);

    List<ProductVariant> findByProductProductIdAndIsAvailable(Long productId, Boolean isAvailable);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySkuAndVariantIdNot(String sku, Long variantId);

    boolean existsBySku(String sku);
}
