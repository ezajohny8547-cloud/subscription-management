import apiClient from './apiClient';

/**
 * Service for Product and Variant management endpoints (/api/products).
 */
export const productService = {
  /**
   * Search and retrieve products with optional query, type, and availability filters.
   * @param {Object} params - { search, type, available }
   */
  async getAllProducts(params = {}) {
    return apiClient.get('/api/products', params);
  },

  /**
   * Retrieve a single product by ID.
   * @param {number|string} id
   */
  async getProductById(id) {
    return apiClient.get(`/api/products/${id}`);
  },

  /**
   * Create a new product.
   * @param {Object} productData - { name, type, salesPrice, costPrice, notes, isAvailable }
   */
  async createProduct(productData) {
    return apiClient.post('/api/products', productData);
  },

  /**
   * Update an existing product.
   * @param {number|string} id
   * @param {Object} productData
   */
  async updateProduct(id, productData) {
    return apiClient.put(`/api/products/${id}`, productData);
  },

  /**
   * Toggle product availability status.
   * @param {number|string} id
   */
  async toggleProductAvailability(id) {
    return apiClient.patch(`/api/products/${id}/availability`);
  },

  /**
   * Delete a product.
   * @param {number|string} id
   */
  async deleteProduct(id) {
    return apiClient.delete(`/api/products/${id}`);
  },

  // =========================================================================
  // Product Variant Management
  // =========================================================================

  /**
   * List all variants belonging to a product.
   * @param {number|string} productId
   */
  async getProductVariants(productId) {
    return apiClient.get(`/api/products/${productId}/variants`);
  },

  /**
   * Retrieve a specific product variant.
   * @param {number|string} productId
   * @param {number|string} variantId
   */
  async getVariantById(productId, variantId) {
    return apiClient.get(`/api/products/${productId}/variants/${variantId}`);
  },

  /**
   * Add a new variant with configurable price adjustment (e.g. Brand X adds 560.00).
   * @param {number|string} productId
   * @param {Object} variantData - { variantName, variantType, variantValue, priceAdjustment, sku, stockQuantity, isAvailable }
   */
  async addVariant(productId, variantData) {
    return apiClient.post(`/api/products/${productId}/variants`, variantData);
  },

  /**
   * Update an existing variant.
   * @param {number|string} productId
   * @param {number|string} variantId
   * @param {Object} variantData
   */
  async updateVariant(productId, variantId, variantData) {
    return apiClient.put(`/api/products/${productId}/variants/${variantId}`, variantData);
  },

  /**
   * Delete a variant.
   * @param {number|string} productId
   * @param {number|string} variantId
   */
  async deleteVariant(productId, variantId) {
    return apiClient.delete(`/api/products/${productId}/variants/${variantId}`);
  },
};

export default productService;
