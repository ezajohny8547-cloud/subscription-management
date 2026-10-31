import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import '../styles/design-system.css';

export default function ProductVariants({ productId, onNavigate }) {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [formData, setFormData] = useState({
    variantName: '',
    variantType: 'BRAND',
    variantValue: '',
    priceAdjustment: '560.00', // Example configurable default from requirement
    sku: '',
    stockQuantity: '100',
    isAvailable: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productId) {
      loadData();
    }
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prod, vars] = await Promise.all([
        productService.getProductById(productId),
        productService.getProductVariants(productId),
      ]);
      setProduct(prod);
      setVariants(vars || []);
    } catch (err) {
      setError(err.message || 'Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingVariant(null);
    setFormData({
      variantName: '',
      variantType: 'BRAND',
      variantValue: '',
      priceAdjustment: '560.00',
      sku: '',
      stockQuantity: '100',
      isAvailable: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (variant) => {
    setEditingVariant(variant);
    setFormData({
      variantName: variant.variantName || '',
      variantType: variant.variantType || 'BRAND',
      variantValue: variant.variantValue || '',
      priceAdjustment: variant.priceAdjustment !== undefined ? String(variant.priceAdjustment) : '0.00',
      sku: variant.sku || '',
      stockQuantity: variant.stockQuantity !== undefined ? String(variant.stockQuantity) : '0',
      isAvailable: variant.isAvailable ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.variantName.trim()) errors.variantName = 'Variant name is required';
    if (!formData.variantType.trim()) errors.variantType = 'Variant type is required';
    if (!formData.variantValue.trim()) errors.variantValue = 'Variant value is required';

    if (formData.priceAdjustment === '' || isNaN(Number(formData.priceAdjustment))) {
      errors.priceAdjustment = 'Valid price adjustment is required (can be positive, zero, or negative)';
    } else {
      const basePrice = parseFloat(product?.salesPrice || 0);
      const adj = parseFloat(formData.priceAdjustment);
      if (basePrice + adj < 0) {
        errors.priceAdjustment = `Adjustment cannot reduce total price below zero (base price: $${basePrice.toFixed(2)})`;
      }
    }

    if (formData.stockQuantity !== '' && Number(formData.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock quantity cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        variantName: formData.variantName.trim(),
        variantType: formData.variantType.trim().toUpperCase(),
        variantValue: formData.variantValue.trim(),
        priceAdjustment: parseFloat(formData.priceAdjustment),
        sku: formData.sku.trim() || undefined,
        stockQuantity: parseInt(formData.stockQuantity || 0, 10),
        isAvailable: formData.isAvailable,
      };

      if (editingVariant) {
        await productService.updateVariant(productId, editingVariant.variantId, payload);
        setSuccessMsg(`Variant "${payload.variantName}" updated successfully.`);
      } else {
        await productService.addVariant(productId, payload);
        setSuccessMsg(`Variant "${payload.variantName}" added successfully.`);
      }

      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save variant' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (variantId, name) => {
    if (!window.confirm(`Delete variant "${name}"?`)) return;
    try {
      await productService.deleteVariant(productId, variantId);
      setSuccessMsg(`Variant "${name}" deleted.`);
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete variant');
    }
  };

  if (loading) {
    return (
      <div className="module-container" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading variants...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="module-container">
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-primary)', color: 'var(--accent-primary)' }}>
          {error || 'Product not found'}
        </div>
        <button className="btn btn-secondary" onClick={() => onNavigate && onNavigate('products')}>
          ← Back to Products
        </button>
      </div>
    );
  }

  const basePrice = parseFloat(product.salesPrice || 0);

  return (
    <div className="module-container">
      {/* Header and Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate && onNavigate('products')}
          style={{ marginRight: 12 }}
        >
          ← Back to Catalog
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-helper)' }}>
          Catalog / {product.name} / Variants
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Manage Product Variants</h1>
          <p className="page-subtitle">
            Configure dynamic pricing modifiers (e.g. brand, storage, or license tiers) for <strong>{product.name}</strong>.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          + Add Variant
        </button>
      </div>

      {/* Rationale Notice */}
      <div className="card-panel" style={{ backgroundColor: 'var(--bg-secondary)', borderLeft: '4px solid var(--accent-primary)', marginBottom: 20 }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          Configurable Price Adjustment Engine
        </div>
        <div style={{ fontSize: 'var(--font-size-body)', color: 'var(--text-secondary)' }}>
          Choosing a specific brand or option may add an amount (such as <strong>+$560.00</strong>) to the product base price
          (<strong>${basePrice.toFixed(2)}</strong>). The additional amount is entirely configurable per variant.
        </div>
      </div>

      {successMsg && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', marginBottom: 16 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Variants Table */}
      <div className="table-container">
        {variants.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No variants configured for this product.</p>
            <p className="form-helper">Click "+ Add Variant" to configure options such as Brands, Storage, or Tiers.</p>
          </div>
        ) : (
          <table className="saas-table">
            <thead>
              <tr>
                <th>Variant Name</th>
                <th>Type</th>
                <th>Option Value</th>
                <th>SKU</th>
                <th>Price Adjustment</th>
                <th>Effective Unit Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => {
                const adj = parseFloat(v.priceAdjustment || 0);
                const effective = basePrice + adj;

                return (
                  <tr key={v.variantId}>
                    <td style={{ fontWeight: 600 }}>{v.variantName}</td>
                    <td>
                      <span className="badge badge-draft">{v.variantType}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{v.variantValue}</td>
                    <td><code>{v.sku || 'N/A'}</code></td>
                    <td style={{ color: adj >= 0 ? 'var(--color-success)' : 'var(--accent-primary)', fontWeight: 600 }}>
                      {adj >= 0 ? `+${adj.toFixed(2)}` : adj.toFixed(2)}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 15 }}>
                      ${effective.toFixed(2)}
                    </td>
                    <td>{v.stockQuantity}</td>
                    <td>
                      <span className={`badge ${v.isAvailable ? 'badge-active' : 'badge-closed'}`}>
                        {v.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(v)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: 'rgba(110,42,58,0.1)', color: 'var(--accent-primary)', border: 'none' }}
                          onClick={() => handleDelete(v.variantId, v.variantName)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Variant Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingVariant ? 'Edit Variant' : 'Add Product Variant'}</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formErrors.submit && (
                  <div className="card-panel" style={{ color: 'var(--accent-primary)', marginBottom: 16 }}>
                    {formErrors.submit}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">Variant Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cisco-Compatible Brand Edition"
                    value={formData.variantName}
                    onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                  />
                  {formErrors.variantName && <span className="form-error">{formErrors.variantName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Variant Type</label>
                    <select
                      className="form-select"
                      value={formData.variantType}
                      onChange={(e) => setFormData({ ...formData, variantType: e.target.value })}
                    >
                      <option value="BRAND">Brand</option>
                      <option value="STORAGE">Storage / Capacity</option>
                      <option value="TIER">Tier / License Edition</option>
                      <option value="COLOR">Color</option>
                      <option value="SIZE">Size</option>
                      <option value="REGION">Service Region</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Option Value</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Acme Pro, 1TB, Platinum"
                      value={formData.variantValue}
                      onChange={(e) => setFormData({ ...formData, variantValue: e.target.value })}
                    />
                    {formErrors.variantValue && <span className="form-error">{formErrors.variantValue}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Price Adjustment ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="560.00"
                      value={formData.priceAdjustment}
                      onChange={(e) => setFormData({ ...formData, priceAdjustment: e.target.value })}
                    />
                    {formErrors.priceAdjustment && <span className="form-error">{formErrors.priceAdjustment}</span>}
                    <span className="form-helper">
                      Additional amount added to base (${basePrice.toFixed(2)}). Total: $
                      {(basePrice + parseFloat(formData.priceAdjustment || 0)).toFixed(2)}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Optional or auto-generated"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="100"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-label">Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 'var(--input-height)' }}>
                      <input
                        type="checkbox"
                        id="variantAvailableCheckbox"
                        style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      />
                      <label htmlFor="variantAvailableCheckbox" style={{ cursor: 'pointer' }}>
                        Available for selection
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingVariant ? 'Save Variant' : 'Create Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
