import React, { useState } from 'react';

/**
 * Responsive, zero-dependency SVG chart suite built strictly for the Shared Design System
 */

// 1. Revenue Over Time Area / Line Chart
export const RevenueAreaChart = ({ data = [], height = 260 }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="helper-text">No trend data recorded</span>
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const width = 600; // SVG viewBox coordinate system
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(Number(d.revenue || 0), Number(d.invoiced || 0))),
    100
  );

  const getX = (idx) => padding.left + (idx / Math.max(data.length - 1, 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - (Number(val || 0) / maxVal) * innerHeight;

  // Build SVG path strings
  const revenuePoints = data.map((d, i) => `${getX(i)},${getY(d.revenue)}`);
  const invoicedPoints = data.map((d, i) => `${getX(i)},${getY(d.invoiced)}`);

  const revenueArea = `M ${getX(0)},${padding.top + innerHeight} L ${revenuePoints.join(' L ')} L ${getX(
    data.length - 1
  )},${padding.top + innerHeight} Z`;

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2C4A3B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2C4A3B" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const yPos = padding.top + innerHeight * (1 - pct);
          const gridVal = Math.round(maxVal * pct);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={yPos}
                x2={padding.left + innerWidth}
                y2={yPos}
                stroke="var(--color-borders)"
                strokeDasharray="4 4"
                strokeWidth="1"
                opacity="0.6"
              />
              <text
                x={padding.left - 10}
                y={yPos + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--color-secondary-text)"
                fontFamily="var(--font-family-base)"
              >
                ${gridVal >= 1000 ? `${(gridVal / 1000).toFixed(1)}k` : gridVal}
              </text>
            </g>
          );
        })}

        {/* Revenue Fill Area */}
        <path d={revenueArea} fill="url(#revenueGrad)" />

        {/* Invoiced Amount Line (Dashed Highlight) */}
        <polyline
          fill="none"
          stroke="var(--color-highlight)"
          strokeWidth="2.5"
          strokeDasharray="5 3"
          points={invoicedPoints.join(' ')}
        />

        {/* Revenue Received Line (Solid Success Accent) */}
        <polyline
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={revenuePoints.join(' ')}
        />

        {/* Data points & X Labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const yRev = getY(d.revenue);
          const isHovered = hoveredIdx === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Invisible touch/hover pillar */}
              <rect
                x={x - innerWidth / (data.length * 2)}
                y={padding.top}
                width={innerWidth / data.length}
                height={innerHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />

              {/* Month label */}
              <text
                x={x}
                y={padding.top + innerHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill="var(--color-secondary-text)"
                fontFamily="var(--font-family-base)"
              >
                {d.period}
              </text>

              {/* Circles */}
              <circle
                cx={x}
                cy={yRev}
                r={isHovered ? 6 : 4}
                fill="#FFFBF5"
                stroke="var(--color-success)"
                strokeWidth="2.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Legend & Hover Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '8px',
          fontSize: '12px',
          color: 'var(--color-secondary-text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--color-success)' }} />
          <strong>Revenue Received</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '12px',
              height: '3px',
              backgroundColor: 'var(--color-highlight)',
              borderBottom: '1px dashed var(--color-highlight)',
            }}
          />
          <strong>Total Invoiced</strong>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div style={{ color: 'var(--color-primary-text)', fontWeight: 600 }}>
            {data[hoveredIdx].period}: Rev ${Number(data[hoveredIdx].revenue).toFixed(2)} / Inv $
            {Number(data[hoveredIdx].invoiced).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Donut / Ring Distribution Chart
export const DonutChart = ({
  items = [],
  title = 'Distribution',
  size = 200,
  colors = ['#2C4A3B', '#6E2A3A', '#C4972F', '#A9684F', '#7A5C46'],
}) => {
  if (!items || items.length === 0) {
    return (
      <div style={{ height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="helper-text">No data available</span>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {items.map((item, i) => {
            const count = Number(item.count) || 0;
            const pct = total > 0 ? count / total : 0;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -(accumulatedPercent * circumference);
            accumulatedPercent += pct;

            const color = colors[i % colors.length];

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary-text)' }}>
            {total}
          </span>
          <span className="helper-text" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
            Total
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '130px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  backgroundColor: colors[i % colors.length],
                }}
              />
              <span className="label-text" style={{ fontSize: '12px' }}>
                {item.label}
              </span>
            </div>
            <strong style={{ fontSize: '12px', color: 'var(--color-primary-text)' }}>
              {item.percentage !== undefined ? `${item.percentage}%` : item.count}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Horizontal Metric Bar Breakdown
export const HorizontalBarBreakdown = ({
  items = [],
  color = 'var(--color-primary-accent)',
}) => {
  if (!items || items.length === 0) return null;

  const maxVal = Math.max(...items.map((i) => Number(i.count) || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map((item, i) => {
        const count = Number(item.count) || 0;
        const widthPct = Math.round((count / maxVal) * 100);

        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="label-text" style={{ fontSize: '13px' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary-text)' }}>
                {count} {count === 1 ? 'subscription' : 'subscriptions'}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--color-secondary-bg)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  backgroundColor: color,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
