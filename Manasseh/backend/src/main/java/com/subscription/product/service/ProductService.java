package com.subscription.product.service;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.common.exception.ResourceNotFoundException;
import com.subscription.product.dto.ProductDTO;
import com.subscription.product.dto.ProductVariantDTO;
import com.subscription.product.entity.Product;
import com.subscription.product.entity.ProductType;
import com.subscription.product.entity.ProductVariant;
import com.subscription.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductDTO> searchProducts(String query, ProductType type, Boolean isAvailable) {
        List<Product> products = productRepository.searchProducts(
                (query != null && !query.trim().isEmpty()) ? query.trim() : null,
                type,
                isAvailable
        );
        return products.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = findEntityById(id);
        return toDTO(product);
    }

    @Transactional(readOnly = true)
    public Product findEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public ProductDTO createProduct(ProductDTO dto) {
        validateProduct(dto);
        Product product = new Product();
        product.setName(dto.getName().trim());
        product.setType(dto.getType());
        product.setSalesPrice(dto.getSalesPrice());
        product.setCostPrice(dto.getCostPrice() != null ? dto.getCostPrice() : BigDecimal.ZERO);
        product.setNotes(dto.getNotes());
        product.setIsAvailable(dto.getIsAvailable() != null ? dto.getIsAvailable() : true);

        Product saved = productRepository.save(product);
        return toDTO(saved);
    }

    public ProductDTO updateProduct(Long id, ProductDTO dto) {
        validateProduct(dto);
        Product product = findEntityById(id);
        product.setName(dto.getName().trim());
        product.setType(dto.getType());
        product.setSalesPrice(dto.getSalesPrice());
        product.setCostPrice(dto.getCostPrice() != null ? dto.getCostPrice() : BigDecimal.ZERO);
        product.setNotes(dto.getNotes());
        if (dto.getIsAvailable() != null) {
            product.setIsAvailable(dto.getIsAvailable());
        }

        Product updated = productRepository.save(product);
        return toDTO(updated);
    }

    public ProductDTO toggleAvailability(Long id) {
        Product product = findEntityById(id);
        product.setIsAvailable(!Boolean.TRUE.equals(product.getIsAvailable()));
        Product updated = productRepository.save(product);
        return toDTO(updated);
    }

    public void deleteProduct(Long id) {
        Product product = findEntityById(id);
        productRepository.delete(product);
    }

    private void validateProduct(ProductDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new BusinessRuleException("Product name cannot be blank.");
        }
        if (dto.getType() == null) {
            throw new BusinessRuleException("Product type is required.");
        }
        if (dto.getSalesPrice() == null || dto.getSalesPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Product sales price must be strictly greater than zero.");
        }
        if (dto.getCostPrice() != null && dto.getCostPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("Product cost price cannot be negative.");
        }
    }

    public ProductDTO toDTO(Product entity) {
        if (entity == null) return null;
        ProductDTO dto = new ProductDTO();
        dto.setProductId(entity.getProductId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setSalesPrice(entity.getSalesPrice());
        dto.setCostPrice(entity.getCostPrice());
        dto.setNotes(entity.getNotes());
        dto.setIsAvailable(entity.getIsAvailable());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        if (entity.getVariants() != null) {
            dto.setVariants(entity.getVariants().stream()
                    .map(this::toVariantDTO)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public ProductVariantDTO toVariantDTO(ProductVariant variant) {
        if (variant == null) return null;
        ProductVariantDTO dto = new ProductVariantDTO();
        dto.setVariantId(variant.getVariantId());
        if (variant.getProduct() != null) {
            dto.setProductId(variant.getProduct().getProductId());
            dto.setProductName(variant.getProduct().getName());
        }
        dto.setVariantName(variant.getVariantName());
        dto.setVariantType(variant.getVariantType());
        dto.setVariantValue(variant.getVariantValue());
        dto.setPriceAdjustment(variant.getPriceAdjustment());
        dto.setEffectivePrice(variant.calculateEffectivePrice());
        dto.setSku(variant.getSku());
        dto.setStockQuantity(variant.getStockQuantity());
        dto.setIsAvailable(variant.getIsAvailable());
        dto.setCreatedAt(variant.getCreatedAt());
        dto.setUpdatedAt(variant.getUpdatedAt());
        return dto;
    }
}
