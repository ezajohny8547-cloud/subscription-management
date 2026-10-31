import React from 'react';

/**
 * Shared StatCard component adhering to the Mandatory Shared Design System
 * Displays a single key metric with card heading, value, trend, and helper text
 */
export const StatCard = ({
  title,
  value,
  helperText,
  icon,
  trend,
  trendPositive = true,
  accentColor = 'var(--color-primary-accent)',
}) => {
  return (
    <div
      className="card-panel"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        borderTop: `4px solid ${accentColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span className="label-text" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-secondary-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <h3
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-primary-text)',
            letterSpacing: '-0.5px',
            lineHeight: 1.1,
          }}
        >
          {value !== undefined && value !== null ? value : '—'}
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        {helperText && <span className="helper-text">{helperText}</span>}

        {trend && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: trendPositive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: trendPositive ? 'var(--color-success)' : 'var(--color-danger)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trendPositive ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
};
