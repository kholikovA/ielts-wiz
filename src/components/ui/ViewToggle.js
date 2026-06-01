import React from 'react';
import Icon from './icons';

// Two-icon toggle for switching between list and grid layouts on skill pages.
// Reads / writes its own preference key so it can be dropped anywhere without
// the parent caring about persistence.

const KEY = 'iw.v1.viewMode';

export const readViewMode = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'grid' ? 'grid' : 'list';
  } catch { return 'list'; }
};

export const writeViewMode = (v) => {
  try { localStorage.setItem(KEY, v); } catch {}
};

export default function ViewToggle({ value, onChange }) {
  const btn = (mode, iconName, label) => {
    const active = value === mode;
    return (
      <button
        type="button"
        onClick={() => onChange(mode)}
        aria-label={`Switch to ${label} view`}
        aria-pressed={active}
        title={`${label} view`}
        style={{
          width: '34px', height: '34px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'var(--purple-600)' : 'transparent',
          color: active ? 'white' : 'var(--text-secondary)',
          border: 'none', borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          transition: 'background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease)',
        }}
      >
        <Icon name={iconName} size={16} />
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label="View toggle"
      style={{
        display: 'inline-flex', gap: '2px', padding: '2px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--r-md)',
      }}
    >
      {btn('list', 'menu', 'list')}
      {btn('grid', 'layout', 'grid')}
    </div>
  );
}
