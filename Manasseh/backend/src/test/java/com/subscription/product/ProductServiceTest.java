package com.subscription.product;

import com.subscription.common.exception.BusinessRuleException;
import com.subscription.product.dto.ProductDTO;
import com.subscription.product.dto.ProductVariantDTO;
import com.subscription.product.entity.Product;
import com.subscription.product.entity.ProductType;
import com.subscription.product.entity.ProductVariant;
import com.subscription.product.repository.ProductRepository;
import com.subscription.product.repository.ProductVariantRepository;
import com.subscription.product.service.ProductService;
import com.subscription.product.service.ProductVariantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @InjectMocks
    private ProductService productService;

    private ProductVariantService variantService;

    @BeforeEach
    void setUp() {
        variantService = new ProductVariantService(variantRepository, productRepository, productService);
    }

    @Test
    @DisplayName("Create product with valid price and attributes succeeds")
    void testCreateProductSuccess() {
        ProductDTO dto = new ProductDTO();
        dto.setName("Cloud Storage");
        dto.setType(ProductType.DIGITAL);
        dto.setSalesPrice(new BigDecimal("1000.00"));
        dto.setCostPrice(new BigDecimal("400.00"));
        dto.setNotes("High reliability");

        Product saved = new Product("Cloud Storage", ProductType.DIGITAL, new BigDecimal("1000.00"), new BigDecimal("400.00"), "High reliability", true);
        saved.setProductId(1L);

        when(productRepository.save(any(Product.class))).thenReturn(saved);

        ProductDTO result = productService.createProduct(dto);
        assertNotNull(result);
        assertEquals(1L, result.getProductId());
        assertEquals("Cloud Storage", result.getName());
    }

    @Test
    @DisplayName("Create product with zero or negative price throws BusinessRuleException")
    void testCreateProductInvalidPrice() {
        ProductDTO dto = new ProductDTO();
        dto.setName("Invalid Product");
        dto.setType(ProductType.PHYSICAL);
        dto.setSalesPrice(BigDecimal.ZERO);

        assertThrows(BusinessRuleException.class, () -> productService.createProduct(dto));
    }

    @Test
    @DisplayName("Support product variants with configurable brand price adjustment (+560.00)")
    void testVariantConfigurablePriceAdjustment() {
        Product product = new Product("Enterprise Router", ProductType.PHYSICAL, new BigDecimal("2000.00"), new BigDecimal("1200.00"), null, true);
        product.setProductId(10L);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ProductVariantDTO variantDto = new ProductVariantDTO();
        variantDto.setVariantName("Brand Pro Edition");
        variantDto.setVariantType("BRAND");
        variantDto.setVariantValue("Cisco-Compatible");
        variantDto.setPriceAdjustment(new BigDecimal("560.00")); // Configurable +560.00
        variantDto.setSku("RTR-BRAND-560");
        variantDto.setStockQuantity(25);

        ProductVariant savedVariant = new ProductVariant(product, "Brand Pro Edition", "BRAND", "Cisco-Compatible",
                new BigDecimal("560.00"), "RTR-BRAND-560", 25, true);
        savedVariant.setVariantId(101L);

        when(variantRepository.save(any(ProductVariant.class))).thenReturn(savedVariant);

        ProductVariantDTO result = variantService.addVariant(10L, variantDto);
        assertNotNull(result);
        assertEquals(new BigDecimal("560.00"), result.getPriceAdjustment());
        assertEquals(new BigDecimal("2560.00"), result.getEffectivePrice());
    }
}
