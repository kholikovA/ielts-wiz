import React from 'react';

// items: [{ id, label }], value: active id, onChange(id)
// Renders a pill-tab row used by skill pages (Listening / Reading / Speaking).
export default function SubNav({ items, value, onChange }) {
  return (
    <div className="subnav" role="tablist">
      {items.map(item => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`subnav-btn${active ? ' subnav-btn--active' : ''}`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
