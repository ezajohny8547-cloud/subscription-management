import React, { useState } from 'react';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import ProductVariants from './pages/ProductVariants';
import Plans from './pages/Plans';
import Quotations from './pages/Quotations';
import QuotationForm from './pages/QuotationForm';
import Subscriptions from './pages/Subscriptions';
import SubscriptionDetails from './pages/SubscriptionDetails';
import './styles/design-system.css';

/**
 * Module 2 Standalone Preview & Integration Test Container.
 * Enables running and testing all 8 Module 2 pages before merging into the main shared App.jsx.
 */
export default function Module2PreviewApp() {
  const [currentPage, setCurrentPage] = useState('products');
  const [pageParams, setPageParams] = useState({ productId: 1, quotationId: 1, subscriptionId: 1 });

  const handleNavigate = (pageName, params = {}) => {
    setPageParams((prev) => ({ ...prev, ...params }));
    setCurrentPage(pageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { key: 'products', label: '1. Products' },
    { key: 'productDetails', label: '2. Product Details' },
    { key: 'productVariants', label: '3. Product Variants' },
    { key: 'plans', label: '4. Plans' },
    { key: 'quotations', label: '5. Quotations' },
    { key: 'quotationForm', label: '6. Quotation Form' },
    { key: 'subscriptions', label: '7. Subscriptions' },
    { key: 'subscriptionDetails', label: '8. Subscription Console' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Top Integration Preview Bar */}
      <header
        style={{
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-color)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFBF5',
              padding: '4px 10px',
              borderRadius: 'var(--radius-button)',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            MODULE 2
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            Subscription Management System
          </span>
        </div>

        {/* Tab Switcher */}
        <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.key)}
              className={`btn btn-sm ${currentPage === item.key ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: 12 }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Page Content Body */}
      <main style={{ paddingBottom: 60 }}>
        {currentPage === 'products' && <Products onNavigate={handleNavigate} />}
        {currentPage === 'productDetails' && (
          <ProductDetails productId={pageParams.productId || 1} onNavigate={handleNavigate} />
        )}
        {currentPage === 'productVariants' && (
          <ProductVariants productId={pageParams.productId || 1} onNavigate={handleNavigate} />
        )}
        {currentPage === 'plans' && <Plans onNavigate={handleNavigate} />}
        {currentPage === 'quotations' && <Quotations onNavigate={handleNavigate} />}
        {currentPage === 'quotationForm' && (
          <QuotationForm quotationId={pageParams.quotationId} onNavigate={handleNavigate} />
        )}
        {currentPage === 'subscriptions' && <Subscriptions onNavigate={handleNavigate} />}
        {currentPage === 'subscriptionDetails' && (
          <SubscriptionDetails subscriptionId={pageParams.subscriptionId || 1} onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
}
