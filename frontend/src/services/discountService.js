import apiClient from './apiClient';

export const discountService = {
  /**
   * Fetch all discount rules
   */
  async getDiscounts() {
    return await apiClient.get('/discounts');
  },

  /**
   * Fetch discount rule by ID
   */
  async getDiscountById(id) {
    return await apiClient.get(`/discounts/${id}`);
  },

  /**
   * Create a new discount rule
   */
  async createDiscount(discountData) {
    return await apiClient.post('/discounts', discountData);
  },

  /**
   * Toggle active/inactive state of a discount rule
   */
  async toggleDiscount(id) {
    return await apiClient.put(`/discounts/${id}/toggle`, {});
  },

  /**
   * Validate and calculate discount for an amount
   */
  async validateDiscount(code, subtotal, quantity = 1, productId = null, subscriptionId = null) {
    const query = new URLSearchParams({
      code,
      subtotal: subtotal.toString(),
      quantity: quantity.toString()
    });
    if (productId) query.append('productId', productId);
    if (subscriptionId) query.append('subscriptionId', subscriptionId);

    return await apiClient.get(`/discounts/validate?${query.toString()}`);
  }
};

export default discountService;
