package com.subscription.product.service;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.product.dto.ProductVariantDTO;
import com.subscription.product.entity.Product;
import com.subscription.product.entity.ProductVariant;
import com.subscription.product.repository.ProductRepository;
import com.subscription.product.repository.ProductVariantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public ProductVariantService(ProductVariantRepository variantRepository,
                                 ProductRepository productRepository,
                                 ProductService productService) {
        this.variantRepository = variantRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<ProductVariantDTO> getVariantsByProductId(Long productId) {
        // Validate product exists
        productService.findEntityById(productId);
        return variantRepository.findByProductProductId(productId).stream()
                .map(productService::toVariantDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductVariantDTO getVariantById(Long variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));
        return productService.toVariantDTO(variant);
    }

    public ProductVariantDTO addVariant(Long productId, ProductVariantDTO dto) {
        Product product = productService.findEntityById(productId);
        validateVariant(dto, null);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setVariantName(dto.getVariantName().trim());
        variant.setVariantType(dto.getVariantType().trim().toUpperCase());
        variant.setVariantValue(dto.getVariantValue().trim());
        variant.setPriceAdjustment(dto.getPriceAdjustment() != null ? dto.getPriceAdjustment() : BigDecimal.ZERO);
        variant.setSku(dto.getSku() != null && !dto.getSku().trim().isEmpty() ? dto.getSku().trim() : generateSku(product, dto));
        variant.setStockQuantity(dto.getStockQuantity() != null ? dto.getStockQuantity() : 0);
        variant.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);

        // Check if effective price becomes negative
        BigDecimal effective = product.getSalesPrice().add(variant.getPriceAdjustment());
        if (effective.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Price adjustment cannot reduce effective product price below zero.");
        }

        ProductVariant saved = variantRepository.save(variant);
        return productService.toVariantDTO(saved);
    }

    public ProductVariantDTO updateVariant(Long productId, Long variantId, ProductVariantDTO dto) {
        Product product = productService.findEntityById(productId);
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));

        if (!variant.getProduct().getProductId().equals(productId)) {
            throw new BusinessRuleException("Variant does not belong to the specified product.");
        }

        validateVariant(dto, variantId);

        variant.setVariantName(dto.getVariantName().trim());
        variant.setVariantType(dto.getVariantType().trim().toUpperCase());
        variant.setVariantValue(dto.getVariantValue().trim());
        variant.setPriceAdjustment(dto.getPriceAdjustment() != null ? dto.getPriceAdjustment() : BigDecimal.ZERO);
        if (dto.getSku() != null && !dto.getSku().trim().isEmpty()) {
            variant.setSku(dto.getSku().trim());
        }
        if (dto.getStockQuantity() != null) {
            variant.setStockQuantity(dto.getStockQuantity());
        }
        if (dto.getIsAvailable() != null) {
            variant.setIsAvailable(dto.getIsAvailable());
        }

        BigDecimal effective = product.getSalesPrice().add(variant.getPriceAdjustment());
        if (effective.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Price adjustment cannot reduce effective product price below zero.");
        }

        ProductVariant updated = variantRepository.save(variant);
        return productService.toVariantDTO(updated);
    }

    public void deleteVariant(Long productId, Long variantId) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", variantId));
        if (!variant.getProduct().getProductId().equals(productId)) {
            throw new BusinessRuleException("Variant does not belong to the specified product.");
        }
        variantRepository.delete(variant);
    }

    private void validateVariant(ProductVariantDTO dto, Long currentVariantId) {
        if (dto.getVariantName() == null || dto.getVariantName().trim().isEmpty()) {
            throw new BusinessRuleException("Variant name is required.");
        }
        if (dto.getVariantType() == null || dto.getVariantType().trim().isEmpty()) {
            throw new BusinessRuleException("Variant type is required (e.g. BRAND, STORAGE, TIER).");
        }
        if (dto.getVariantValue() == null || dto.getVariantValue().trim().isEmpty()) {
            throw new BusinessRuleException("Variant value is required.");
        }
        if (dto.getStockQuantity() != null && dto.getStockQuantity() < 0) {
            throw new BusinessRuleException("Stock quantity cannot be negative.");
        }
        if (dto.getSku() != null && !dto.getSku().trim().isEmpty()) {
            boolean exists = currentVariantId == null
                    ? variantRepository.existsBySku(dto.getSku().trim())
                    : variantRepository.existsBySkuAndVariantIdNot(dto.getSku().trim(), currentVariantId);
            if (exists) {
                throw new BusinessRuleException("SKU '" + dto.getSku() + "' is already in use by another variant.");
            }
        }
    }

    private String generateSku(Product product, ProductVariantDTO dto) {
        String prodPrefix = product.getName().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (prodPrefix.length() > 4) prodPrefix = prodPrefix.substring(0, 4);
        String valPrefix = dto.getVariantValue().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (valPrefix.length() > 4) valPrefix = valPrefix.substring(0, 4);
        return String.format("%s-%s-%d", prodPrefix, valPrefix, System.currentTimeMillis() % 10000);
    }
}
