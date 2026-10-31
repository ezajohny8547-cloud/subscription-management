import React, { useState, useEffect } from 'react';
import subscriptionService from '../services/subscriptionService';
import planService from '../services/planService';
import productService from '../services/productService';
import '../styles/design-system.css';

export default function QuotationForm({ quotationId, onNavigate }) {
  const isEditMode = Boolean(quotationId);

  const [templates, setTemplates] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [formData, setFormData] = useState({
    customerId: 1,
    customerName: 'Acme Innovations Ltd',
    customerEmail: 'alice@acmeinnovations.com',
    planId: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    paymentTerms: 'NET_30',
    notes: 'Commercial quotation for subscription services.',
    lines: [],
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadPrerequisites();
  }, [quotationId]);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, prodsData, tmplData] = await Promise.all([
        planService.getActiveAvailablePlans(),
        productService.getAllProducts({ available: true }),
        subscriptionService.getQuotationTemplates(),
      ]);

      setAvailablePlans(plansData || []);
      setProducts(prodsData || []);
      setTemplates(tmplData || []);

      if (isEditMode) {
        const quote = await subscriptionService.getQuotationById(quotationId);
        setFormData({
          customerId: quote.customerId,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          planId: quote.planId,
          quotationDate: quote.quotationDate,
          validUntil: quote.validUntil,
          paymentTerms: quote.paymentTerms,
          notes: quote.notes || '',
          lines: (quote.lines || []).map((l) => ({
            productId: l.productId,
            variantId: l.variantId || '',
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate || 10,
          })),
        });
      } else {
        // Default initial line if products exist
        if (plansData && plansData.length > 0) {
          setFormData((prev) => ({ ...prev, planId: plansData[0].planId }));
        }
        if (prodsData && prodsData.length > 0) {
          const firstProd = prodsData[0];
          setFormData((prev) => ({
            ...prev,
            lines: [
              {
                productId: firstProd.productId,
                variantId: firstProd.variants && firstProd.variants.length > 0 ? firstProd.variants[0].variantId : '',
                quantity: 1,
                unitPrice: firstProd.salesPrice,
                taxRate: 10,
              },
            ],
          }));
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize quotation builder');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateApply = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find((t) => String(t.templateId) === String(templateId));
    if (tmpl) {
      setFormData((prev) => ({
        ...prev,
        planId: tmpl.defaultPlanId || prev.planId,
        paymentTerms: tmpl.defaultPaymentTerms || prev.paymentTerms,
        notes: tmpl.defaultNotes || prev.notes,
        lines: prev.lines.map((line) => ({
          ...line,
          taxRate: tmpl.defaultTaxRate !== undefined ? tmpl.defaultTaxRate : line.taxRate,
        })),
      }));
    }
  };

  // Line item manipulation
  const handleAddLine = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants && defaultProduct.variants.length > 0 ? defaultProduct.variants[0].variantId : '';

    setFormData((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: defaultProduct.productId,
          variantId: defaultVariant,
          quantity: 1,
          unitPrice: defaultProduct.salesPrice,
          taxRate: 10,
        },
      ],
    }));
  };

  const handleRemoveLine = (index) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleLineProductChange = (index, productId) => {
    const prod = products.find((p) => String(p.productId) === String(productId));
    if (!prod) return;

    const firstVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : null;
    const unitPrice = firstVariant ? (parseFloat(prod.salesPrice) + parseFloat(firstVariant.priceAdjustment || 0)) : prod.salesPrice;

    setFormData((prev) => {
      const updated = [...prev.lines];
      updated[index] = {
        ...updated[index],
        productId: prod.productId,
        variantId: firstVariant ? firstVariant.variantId : '',
        unitPrice,
      };
      return { ...prev, lines: updated };
    });
  };

  const handleLineVariantChange = (index, variantId) => {
    setFormData((prev) => {
      const updated = [...prev.lines];
      const line = updated[index];
      const prod = products.find((p) => String(p.productId) === String(line.productId));

      let unitPrice = prod ? prod.salesPrice : line.unitPrice;
      if (variantId && prod && prod.variants) {
        const variant = prod.variants.find((v) => String(v.variantId) === String(variantId));
        if (variant) {
          unitPrice = parseFloat(prod.salesPrice) + parseFloat(variant.priceAdjustment || 0);
        }
      }

      updated[index] = {
        ...line,
        variantId: variantId ? Number(variantId) : null,
        unitPrice,
      };
      return { ...prev, lines: updated };
    });
  };

  const handleLineChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.lines];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, lines: updated };
    });
  };

  // Totals calculation
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    formData.lines.forEach((line) => {
      const qty = parseInt(line.quantity || 0, 10);
      const price = parseFloat(line.unitPrice || 0);
      const taxRate = parseFloat(line.taxRate || 0);

      const lineSub = qty * price;
      const lineTax = lineSub * (taxRate / 100);

      subtotal += lineSub;
      taxTotal += lineTax;
    });

    return {
      subtotal,
      taxTotal,
      totalAmount: subtotal + taxTotal,
    };
  };

  const validate = () => {
    const errors = {};
    if (!formData.customerId) errors.customerId = 'Customer ID is required';
    if (!formData.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!formData.customerEmail.trim()) errors.customerEmail = 'Customer email is required';
    if (!formData.planId) errors.planId = 'Please select an available plan';

    if (formData.lines.length === 0) {
      errors.lines = 'Quotation must include at least one product line';
    }

    const selectedPlan = availablePlans.find((p) => String(p.planId) === String(formData.planId));
    let totalQty = 0;

    formData.lines.forEach((l, idx) => {
      if (!l.productId) errors[`line_${idx}_product`] = 'Product is required';
      if (!l.quantity || Number(l.quantity) < 1) errors[`line_${idx}_quantity`] = 'Min quantity is 1';
      totalQty += parseInt(l.quantity || 0, 10);
    });

    if (selectedPlan && totalQty < selectedPlan.minimumQuantity) {
      errors.minimumQuantity = `Selected plan requires minimum ${selectedPlan.minimumQuantity} units (currently ${totalQty})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        customerId: Number(formData.customerId),
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        planId: Number(formData.planId),
        quotationDate: formData.quotationDate,
        validUntil: formData.validUntil,
        paymentTerms: formData.paymentTerms,
        notes: formData.notes,
        lines: formData.lines.map((l) => ({
          productId: Number(l.productId),
          variantId: l.variantId ? Number(l.variantId) : null,
          quantity: parseInt(l.quantity, 10),
          unitPrice: parseFloat(l.unitPrice),
          taxRate: parseFloat(l.taxRate || 0),
        })),
      };

      if (isEditMode) {
        await subscriptionService.updateQuotation(quotationId, payload);
        setSuccessMsg('Quotation updated successfully.');
      } else {
        const created = await subscriptionService.createQuotation(payload);
        setSuccessMsg(`Quotation #${created.quotationNumber} created successfully.`);
      }

      setTimeout(() => {
        if (onNavigate) onNavigate('quotations');
      }, 1500);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to submit quotation' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="module-container" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
        Initializing Quotation Builder...
      </div>
    );
  }

  const totals = calculateTotals();
  const selectedPlan = availablePlans.find((p) => String(p.planId) === String(formData.planId));

  return (
    <div className="module-container">
      {/* Header and Back Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => onNavigate && onNavigate('quotations')}
          style={{ marginRight: 12 }}
        >
          ← Back to Quotations
        </button>
        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-helper)' }}>
          Quotations / {isEditMode ? `Edit Quotation #${quotationId}` : 'Create New Quotation'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Quotation' : 'Create Sales Quotation'}</h1>
          <p className="page-subtitle">Select an available plan, configure product lines and variant options, and calculate taxes.</p>
        </div>
      </div>

      {successMsg && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', marginBottom: 16 }}>
          ✓ {successMsg}
        </div>
      )}
      {formErrors.submit && (
        <div className="card-panel" style={{ borderLeft: '4px solid var(--accent-primary)', color: 'var(--accent-primary)', marginBottom: 16 }}>
          ⚠ {formErrors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Reusable Template Bar */}
        {!isEditMode && templates.length > 0 && (
          <div className="card-panel" style={{ backgroundColor: 'var(--bg-secondary)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  📄 Load From Quotation Template:
                </label>
              </div>
              <div style={{ minWidth: 280 }}>
                <select
                  className="form-select"
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateApply(e.target.value)}
                >
                  <option value="">-- Start from scratch --</option>
                  {templates.map((t) => (
                    <option key={t.templateId} value={t.templateId}>
                      {t.templateName} ({t.defaultPlanName || 'Standard'})
                    </option>
                  ))}
                </select>
              </div>
              <span className="form-helper">
                Populates recommended plan, standard payment terms, tax rate, and legal notes.
              </span>
            </div>
          </div>
        )}

        {/* Customer Reference & Plan Selection Panel */}
        <div className="card-panel">
          <h2 className="section-heading">Customer Reference & Plan Selection</h2>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Customer Account</label>
              <select
                className="form-select"
                value={formData.customerId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (id === 1) {
                    setFormData({ ...formData, customerId: 1, customerName: 'Acme Innovations Ltd', customerEmail: 'alice@acmeinnovations.com' });
                  } else if (id === 2) {
                    setFormData({ ...formData, customerId: 2, customerName: 'Global Logistics Corp', customerEmail: 'bmiller@globallogistics.io' });
                  } else {
                    setFormData({ ...formData, customerId: 3, customerName: 'Apex Cloud Solutions', customerEmail: 'clara@apexcloud.com' });
                  }
                }}
              >
                <option value={1}>Acme Innovations Ltd (CUST-001)</option>
                <option value={2}>Global Logistics Corp (CUST-002)</option>
                <option value={3}>Apex Cloud Solutions (CUST-003)</option>
              </select>
              <span className="form-helper">References agreed shared customer model from Module 1.</span>
            </div>

            <div className="form-group">
              <label className="form-label required">Customer Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              />
              {formErrors.customerEmail && <span className="form-error">{formErrors.customerEmail}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Selected Plan (Available Only)</label>
              <select
                className="form-select"
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              >
                <option value="">-- Choose active plan --</option>
                {availablePlans.map((p) => (
                  <option key={p.planId} value={p.planId}>
                    {p.planName} (${parseFloat(p.price).toFixed(2)}/{p.billingInterval?.toLowerCase()})
                  </option>
                ))}
              </select>
              {formErrors.planId && <span className="form-error">{formErrors.planId}</span>}
              {selectedPlan && (
                <span className="form-helper" style={{ color: 'var(--color-success)' }}>
                  ✓ Active until {selectedPlan.availabilityEndDate} (Min Qty: {selectedPlan.minimumQuantity})
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">Quotation Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.quotationDate}
                onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Validity Expiration Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Payment Terms</label>
              <select
                className="form-select"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              >
                <option value="IMMEDIATE">IMMEDIATE</option>
                <option value="NET_15">NET 15 Days</option>
                <option value="NET_30">NET 30 Days</option>
                <option value="NET_60">NET 60 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Lines Builder */}
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="section-heading" style={{ margin: 0 }}>Itemized Product Lines</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleAddLine}>
              + Add Product Line
            </button>
          </div>

          {formErrors.lines && (
            <div className="card-panel" style={{ color: 'var(--accent-primary)', marginBottom: 16 }}>
              {formErrors.lines}
            </div>
          )}
          {formErrors.minimumQuantity && (
            <div className="card-panel" style={{ color: 'var(--accent-primary)', marginBottom: 16 }}>
              {formErrors.minimumQuantity}
            </div>
          )}

          <div className="table-container" style={{ marginBottom: 20 }}>
            <table className="saas-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>Product</th>
                  <th style={{ width: '24%' }}>Variant (Configurable Adjustment)</th>
                  <th style={{ width: '12%' }}>Quantity</th>
                  <th style={{ width: '14%' }}>Unit Price ($)</th>
                  <th style={{ width: '10%' }}>Tax (%)</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Total ($)</th>
                  <th style={{ width: '5%', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.lines.map((line, idx) => {
                  const currentProd = products.find((p) => String(p.productId) === String(line.productId));
                  const variants = currentProd?.variants || [];
                  const qty = parseInt(line.quantity || 0, 10);
                  const price = parseFloat(line.unitPrice || 0);
                  const tax = parseFloat(line.taxRate || 0);
                  const lineTotal = qty * price * (1 + tax / 100);

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select"
                          value={line.productId}
                          onChange={(e) => handleLineProductChange(idx, e.target.value)}
                        >
                          {products.map((p) => (
                            <option key={p.productId} value={p.productId}>
                              {p.name} (${parseFloat(p.salesPrice).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={line.variantId || ''}
                          onChange={(e) => handleLineVariantChange(idx, e.target.value)}
                        >
                          <option value="">Standard (No modifier)</option>
                          {variants.map((v) => (
                            <option key={v.variantId} value={v.variantId}>
                              {v.variantName} (+${parseFloat(v.priceAdjustment || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0.00"
                          className="form-input"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="form-input"
                          value={line.taxRate}
                          onChange={(e) => handleLineChange(idx, 'taxRate', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${lineTotal.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ background: 'transparent', color: 'var(--accent-primary)', border: 'none', cursor: 'pointer' }}
                          onClick={() => handleRemoveLine(idx)}
                          title="Remove line"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 320, background: 'var(--bg-secondary)', padding: 18, borderRadius: 'var(--radius-button)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="form-label">Subtotal:</span>
                <span style={{ fontWeight: 600 }}>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="form-label">Tax Total:</span>
                <span style={{ fontWeight: 600 }}>${totals.taxTotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-color)', paddingTop: 10, fontWeight: 700, fontSize: 18 }}>
                <span>Total Quote:</span>
                <span style={{ color: 'var(--accent-primary)' }}>${totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial Terms & Notes */}
        <div className="card-panel">
          <div className="form-group">
            <label className="form-label">Commercial Notes & Terms</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate && onNavigate('quotations')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Update Quotation' : 'Save & Generate Quotation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
