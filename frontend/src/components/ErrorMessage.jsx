import React from 'react';

export const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div
      className="card-panel"
      style={{
        borderLeft: '4px solid var(--color-danger)',
        padding: '16px 20px',
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#FFF5F5',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <strong style={{ color: 'var(--color-danger)', fontSize: '14px', display: 'block' }}>
            Action Required
          </strong>
          <span className="body-text" style={{ fontSize: '13px', color: 'var(--color-primary-text)' }}>
            {message || 'An error occurred while loading this section.'}
          </span>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm">
          Try Again
        </button>
      )}
    </div>
  );
};
