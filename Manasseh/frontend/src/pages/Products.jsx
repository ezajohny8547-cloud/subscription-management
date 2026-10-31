import React, { useState, useEffect } from 'react';
import productService from '../services/productService';
import '../styles/design-system.css';

export default function Products({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'DIGITAL',
    salesPrice: '',
    costPrice: '0.00',
    notes: '',
    isAvailable: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadProducts();
  }, [search, typeFilter, availabilityFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (availabilityFilter !== '') params.available = availabilityFilter === 'true';

      const data = await productService.getAllProducts(params);
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      type: 'DIGITAL',
      salesPrice: '',
      costPrice: '0.00',
      notes: '',
      isAvailable: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      type: product.type || 'DIGITAL',
      salesPrice: product.salesPrice || '',
      costPrice: product.costPrice || '0.00',
      notes: product.notes || '',
      isAvailable: product.isAvailable ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.salesPrice || Number(formData.salesPrice) <= 0) {
      errors.salesPrice = 'Sales price must be strictly greater than 0';
    }
    if (formData.costPrice && Number(formData.costPrice) < 0) {
      errors.costPrice = 'Cost price cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        salesPrice: parseFloat(formData.salesPrice),
        costPrice: parseFloat(formData.costPrice || 0),
        notes: formData.notes,
        isAvailable: formData.isAvailable,
      };

      if (editingProduct) {
        await productService.updateProduct(editingProduct.productId, payload);
        setSuccessMsg(`Product "${payload.name}" updated successfully.`);
      } else {
        await productService.createProduct(payload);
        setSuccessMsg(`Product "${payload.name}" created successfully.`);
      }

      setIsModalOpen(false);
      loadProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (productId, name) => {
    try {
      await productService.toggleProductAvailability(productId);
      setSuccessMsg(`Availability updated for "${name}".`);
      loadProducts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to toggle availability');
    }
  };

  const handleDelete = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await productService.deleteProduct(productId);
      setSuccessMsg(`Product "${name}" deleted.`);
      loadProducts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  // Stats calculation
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isAvailable).length;
  const digitalCount = products.filter((p) => p.type === 'DIGITAL').length;
  const physicalCount = products.filter((p) => p.type === 'PHYSICAL').length;
  const serviceCount = products.filter((p) => p.type === 'SERVICE').length;

  return (
    <div className="module-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Product Management</h1>
          <p className="page-subtitle">Add, configure, and maintain products, pricing, and variants.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          + Add New Product
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', marginBottom: 16 }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-primary)', color: 'var(--accent-primary)', marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Catalog Products</div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-sub">{activeProducts} active / available</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Digital Products</div>
          <div className="stat-value">{digitalCount}</div>
          <div className="stat-sub">SaaS, APIs, Cloud Storage</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Physical Hardware</div>
          <div className="stat-value">{physicalCount}</div>
          <div className="stat-sub">Gateways, Edge Routers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Service Offerings</div>
          <div className="stat-value">{serviceCount}</div>
          <div className="stat-sub">DevOps SLAs, Consultancies</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card-panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div className="toolbar-container" style={{ margin: 0 }}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Search products by name or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 170 }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="DIGITAL">Digital</option>
              <option value="PHYSICAL">Physical</option>
              <option value="SERVICE">Service</option>
            </select>

            <select
              className="form-select"
              style={{ width: 170 }}
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="">All Availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>

            {(search || typeFilter || availabilityFilter !== '') && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('');
                  setAvailabilityFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading products catalog...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No products found.</p>
            <p className="form-helper">Try adjusting your filters or click "+ Add New Product" to get started.</p>
          </div>
        ) : (
          <table className="saas-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Type</th>
                <th>Sales Price</th>
                <th>Cost Price</th>
                <th>Gross Margin</th>
                <th>Variants</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const sales = parseFloat(product.salesPrice || 0);
                const cost = parseFloat(product.costPrice || 0);
                const margin = sales > 0 ? (((sales - cost) / sales) * 100).toFixed(1) : 0;
                const variantCount = product.variants ? product.variants.length : 0;

                return (
                  <tr key={product.productId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{product.name}</div>
                      {product.notes && (
                        <div className="form-helper" style={{ maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {product.notes}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-draft">{product.type}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${sales.toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      ${cost.toFixed(2)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: margin > 40 ? 'var(--color-success)' : 'var(--accent-secondary)' }}>
                        {margin}%
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onNavigate && onNavigate('productVariants', { productId: product.productId })}
                        title="Configure brand, size, storage variants"
                      >
                        ⚙ {variantCount} Variant{variantCount === 1 ? '' : 's'}
                      </button>
                    </td>
                    <td>
                      <span className={`badge ${product.isAvailable ? 'badge-active' : 'badge-closed'}`}>
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => onNavigate && onNavigate('productDetails', { productId: product.productId })}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(product)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleAvailability(product.productId, product.name)}
                          title="Toggle active availability"
                        >
                          {product.isAvailable ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: 'rgba(110,42,58,0.1)', color: 'var(--accent-primary)', border: 'none' }}
                          onClick={() => handleDelete(product.productId, product.name)}
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => !saving && setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formErrors.submit && (
                  <div className="card-panel" style={{ color: 'var(--accent-primary)', marginBottom: 16 }}>
                    {formErrors.submit}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label required">Product Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Enterprise Cloud Backup"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label required">Product Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="DIGITAL">Digital (Software, API, Cloud)</option>
                      <option value="PHYSICAL">Physical (Hardware, Goods)</option>
                      <option value="SERVICE">Service (SLA, Support, Consulting)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Sales Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-input"
                      placeholder="1200.00"
                      value={formData.salesPrice}
                      onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                    />
                    {formErrors.salesPrice && <span className="form-error">{formErrors.salesPrice}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cost Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      className="form-input"
                      placeholder="450.00"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                    {formErrors.costPrice && <span className="form-error">{formErrors.costPrice}</span>}
                    <span className="form-helper">Direct acquisition or infrastructure cost.</span>
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-label">Availability Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 'var(--input-height)' }}>
                      <input
                        type="checkbox"
                        id="isAvailableCheckbox"
                        style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      />
                      <label htmlFor="isAvailableCheckbox" style={{ fontSize: 'var(--font-size-body)', cursor: 'pointer' }}>
                        Available for customer plans & quotes
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Technical specifications, SLA commitments, or billing notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
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
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
