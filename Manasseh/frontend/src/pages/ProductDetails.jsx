import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import '../styles/design-system.css';

export default function ProductDetails({ productId, onNavigate }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'DIGITAL',
    salesPrice: '',
    costPrice: '',
    notes: '',
    isAvailable: true,
  });

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProductById(productId);
      setProduct(data);
      setFormData({
        name: data.name || '',
        type: data.type || 'DIGITAL',
        salesPrice: data.salesPrice || '',
        costPrice: data.costPrice || '0.00',
        notes: data.notes || '',
        isAvailable: data.isAvailable ?? true,
      });
    } catch (err) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        salesPrice: parseFloat(formData.salesPrice),
        costPrice: parseFloat(formData.costPrice || 0),
        notes: formData.notes,
        isAvailable: formData.isAvailable,
      };

      const updated = await productService.updateProduct(productId, payload);
      setProduct(updated);
      setIsEditing(false);
      setSuccessMsg('Product details updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update product');
    }
  };

  if (loading) {
    return (
      <div className="module-container" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading product details...
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

  const sales = parseFloat(product.salesPrice || 0);
  const cost = parseFloat(product.costPrice || 0);
  const margin = sales > 0 ? (((sales - cost) / sales) * 100).toFixed(1) : 0;
  const variants = product.variants || [];

  return (
    <div className="module-container">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate && onNavigate('products')}
          style={{ marginRight: 12 }}
        >
          ← Back to Catalog
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-helper)' }}>
          Catalog / Product Details / #{product.productId}
        </span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{product.name}</h1>
          <p className="page-subtitle">Product ID: {product.productId} • Type: {product.type}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-accent"
            onClick={() => onNavigate && onNavigate('productVariants', { productId: product.productId })}
          >
            ⚙ Manage Variants ({variants.length})
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Details'}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', marginBottom: 16 }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Product Overview Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Sales Price</div>
          <div className="stat-value">${sales.toFixed(2)}</div>
          <div className="stat-sub">Base recurring / unit price</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cost Price</div>
          <div className="stat-value">${cost.toFixed(2)}</div>
          <div className="stat-sub">Internal unit cost</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gross Margin</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{margin}%</div>
          <div className="stat-sub">${(sales - cost).toFixed(2)} profit per unit</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Availability Status</div>
          <div style={{ marginTop: 6 }}>
            <span className={`badge ${product.isAvailable ? 'badge-active' : 'badge-closed'}`}>
              {product.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
          <div className="stat-sub">Selectable in plans & quotations</div>
        </div>
      </div>

      {/* Main Details Panel / Form */}
      {isEditing ? (
        <div className="card-panel">
          <h2 className="section-heading">Edit Product Information</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label required">Product Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Product Type</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="PHYSICAL">Physical</option>
                  <option value="SERVICE">Service</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">Sales Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={formData.salesPrice}
                  onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  className="form-input"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Availability Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="editAvailableCheckbox"
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                />
                <label htmlFor="editAvailableCheckbox" style={{ cursor: 'pointer' }}>
                  Available in active catalog
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Product Notes</label>
              <textarea
                className="form-textarea"
                rows="4"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card-panel">
          <h2 className="section-heading">Product Specifications</h2>
          <div className="form-row" style={{ marginBottom: 20 }}>
            <div>
              <span className="form-label">Product Name</span>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{product.name}</div>
            </div>
            <div>
              <span className="form-label">Product Type</span>
              <div>
                <span className="badge badge-draft">{product.type}</span>
              </div>
            </div>
            <div>
              <span className="form-label">Date Created</span>
              <div style={{ color: 'var(--text-secondary)' }}>
                {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div className="form-group">
            <span className="form-label">Description & Notes</span>
            <div style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-button)', minHeight: 60 }}>
              {product.notes || 'No technical notes recorded for this product.'}
            </div>
          </div>
        </div>
      )}

      {/* Associated Variants Overview */}
      <div className="card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="section-heading" style={{ margin: 0 }}>Associated Variants ({variants.length})</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onNavigate && onNavigate('productVariants', { productId: product.productId })}
          >
            + Add or Edit Variants
          </button>
        </div>

        {variants.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-button)' }}>
            No variants configured for this product yet.
            <div style={{ marginTop: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate && onNavigate('productVariants', { productId: product.productId })}
              >
                Add Variant (e.g. Brand, Tier, Storage)
              </button>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Variant Name</th>
                  <th>Type & Value</th>
                  <th>SKU</th>
                  <th>Price Adjustment</th>
                  <th>Effective Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => {
                  const adj = parseFloat(v.priceAdjustment || 0);
                  const effective = sales + adj;
                  return (
                    <tr key={v.variantId}>
                      <td style={{ fontWeight: 600 }}>{v.variantName}</td>
                      <td>
                        <span className="badge badge-draft" style={{ marginRight: 6 }}>{v.variantType}</span>
                        {v.variantValue}
                      </td>
                      <td><code>{v.sku || 'N/A'}</code></td>
                      <td style={{ color: adj >= 0 ? 'var(--color-success)' : 'var(--accent-primary)', fontWeight: 600 }}>
                        {adj >= 0 ? `+${adj.toFixed(2)}` : adj.toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        ${effective.toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${v.isAvailable ? 'badge-active' : 'badge-closed'}`}>
                          {v.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
