import React from 'react';

// items: [{ id, label }], value: active id, onChange(id)
// Renders a pill-tab row used by skill pages (Listening / Reading / Speaking).
export default function SubNav({ items, value, onChange }) {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        gap: 'var(--space-1)',
        padding: 'var(--space-1)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--r-pill)',
        marginBottom: 'var(--space-8)',
        flexWrap: 'wrap',
      }}
    >
      {items.map(item => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            style={{
              padding: 'var(--space-2) var(--space-5)',
              borderRadius: 'var(--r-pill)',
              border: 'none',
              background: active
                ? 'linear-gradient(135deg, var(--purple-600), var(--purple-700))'
                : 'transparent',
              color: active ? 'white' : 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
              whiteSpace: 'nowrap',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
