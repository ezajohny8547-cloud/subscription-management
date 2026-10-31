import React from 'react';

export const Badge = ({ status, variant }) => {
  if (!status) return null;

  const getVariantClass = (s) => {
    if (variant) return `badge-${variant}`;
    const normalized = String(s).toUpperCase();

    switch (normalized) {
      case 'ACTIVE':
      case 'PAID':
      case 'SUCCESS':
        return 'badge-success';
      case 'PENDING':
      case 'TRIAL':
        return 'badge-warning';
      case 'OVERDUE':
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'badge-danger';
      case 'ANNUALLY':
      case 'ENTERPRISE':
        return 'badge-accent';
      default:
        return 'badge-neutral';
    }
  };

  return <span className={`badge ${getVariantClass(status)}`}>{status}</span>;
};
