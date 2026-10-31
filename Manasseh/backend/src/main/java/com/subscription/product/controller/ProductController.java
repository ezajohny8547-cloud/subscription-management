package com.subscription.product.controller;

import com.subscription.common.ApiResponse;
import com.subscription.product.dto.ProductDTO;
import com.subscription.product.dto.ProductVariantDTO;
import com.subscription.product.entity.ProductType;
import com.subscription.product.service.ProductService;
import com.subscription.product.service.ProductVariantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Product and Variant management.
 * Base path: /api/products
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductVariantService variantService;

    public ProductController(ProductService productService, ProductVariantService variantService) {
        this.productService = productService;
        this.variantService = variantService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getAllProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProductType type,
            @RequestParam(required = false) Boolean available) {
        List<ProductDTO> products = productService.searchProducts(search, type, available);
        return ResponseEntity.ok(ApiResponse.ok("Products retrieved successfully", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> getProductById(@PathVariable Long id) {
        ProductDTO product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.ok(product));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductDTO>> createProduct(@Valid @RequestBody ProductDTO dto) {
        ProductDTO created = productService.createProduct(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Product created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDTO>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO dto) {
        ProductDTO updated = productService.updateProduct(id, dto);
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully", updated));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<ProductDTO>> toggleAvailability(@PathVariable Long id) {
        ProductDTO updated = productService.toggleAvailability(id);
        return ResponseEntity.ok(ApiResponse.ok("Product availability updated", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.ok("Product deleted successfully", null));
    }

    // =========================================================================
    // Product Variant Endpoints
    // =========================================================================

    @GetMapping("/{productId}/variants")
    public ResponseEntity<ApiResponse<List<ProductVariantDTO>>> getVariants(@PathVariable Long productId) {
        List<ProductVariantDTO> variants = variantService.getVariantsByProductId(productId);
        return ResponseEntity.ok(ApiResponse.ok(variants));
    }

    @GetMapping("/{productId}/variants/{variantId}")
    public ResponseEntity<ApiResponse<ProductVariantDTO>> getVariant(
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        ProductVariantDTO variant = variantService.getVariantById(variantId);
        return ResponseEntity.ok(ApiResponse.ok(variant));
    }

    @PostMapping("/{productId}/variants")
    public ResponseEntity<ApiResponse<ProductVariantDTO>> addVariant(
            @PathVariable Long productId,
            @Valid @RequestBody ProductVariantDTO dto) {
        ProductVariantDTO created = variantService.addVariant(productId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Variant added successfully", created));
    }

    @PutMapping("/{productId}/variants/{variantId}")
    public ResponseEntity<ApiResponse<ProductVariantDTO>> updateVariant(
            @PathVariable Long productId,
            @PathVariable Long variantId,
            @Valid @RequestBody ProductVariantDTO dto) {
        ProductVariantDTO updated = variantService.updateVariant(productId, variantId, dto);
        return ResponseEntity.ok(ApiResponse.ok("Variant updated successfully", updated));
    }

    @DeleteMapping("/{productId}/variants/{variantId}")
    public ResponseEntity<ApiResponse<Void>> deleteVariant(
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        variantService.deleteVariant(productId, variantId);
        return ResponseEntity.ok(ApiResponse.ok("Variant deleted successfully", null));
    }
}
