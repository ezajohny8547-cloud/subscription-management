package com.subscription.product.repository;

import com.subscription.product.entity.Product;
import com.subscription.product.entity.ProductType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByIsAvailable(Boolean isAvailable);

    List<Product> findByType(ProductType type);

    List<Product> findByNameContainingIgnoreCase(String name);

   @Query("SELECT p FROM Product p WHERE " +
       "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
       "(:type IS NULL OR p.type = :type) AND " +
       "(:available IS NULL OR p.isAvailable = :available) " +
       "ORDER BY p.name ASC")
List<Product> searchProducts(@Param("query") String query,
                             @Param("type") ProductType type,
                             @Param("available") Boolean available);
