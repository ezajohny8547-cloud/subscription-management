import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Shared DataTable component
 * Supports column definitions, custom cell renders, pagination controls, and empty/loading states
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found matching the current criteria.',
  pagination = null,
  onSort = null,
  currentSort = { field: '', direction: 'asc' },
}) => {
  if (loading) {
    return (
      <div className="table-container" style={{ minHeight: '220px' }}>
        <LoadingSpinner message="Fetching records from database..." />
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{
                  width: col.width || 'auto',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
                onClick={() => col.sortable && onSort && onSort(col.accessor)}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>{col.header}</span>
                  {col.sortable && currentSort.field === col.accessor && (
                    <span style={{ fontSize: '10px' }}>
                      {currentSort.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px 16px' }}>
                <p className="body-text" style={{ color: 'var(--color-secondary-text)' }}>
                  {emptyMessage}
                </p>
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr key={row.id || rIdx}>
                {columns.map((col, cIdx) => {
                  let cellContent;
                  if (col.render) {
                    cellContent = col.render(row);
                  } else if (typeof col.accessor === 'function') {
                    cellContent = col.accessor(row);
                  } else {
                    cellContent = row[col.accessor];
                  }

                  return (
                    <td key={col.key || cIdx} style={{ verticalAlign: 'middle' }}>
                      {cellContent !== undefined && cellContent !== null ? cellContent : '—'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-bar">
          <div>
            Showing{' '}
            <strong>
              {pagination.totalElements === 0 ? 0 : pagination.page * pagination.size + 1}
            </strong>{' '}
            to{' '}
            <strong>
              {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
            </strong>{' '}
            of <strong>{pagination.totalElements}</strong> entries
          </div>
          <div className="pagination-controls">
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 0}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px' }}>
              Page {pagination.page + 1} of {pagination.totalPages}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages - 1}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
