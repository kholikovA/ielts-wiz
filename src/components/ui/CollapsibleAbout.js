import React from 'react';
import Icon from './icons';

// Editorial "About …" panel that sits at the bottom of a section page.
// Closed by default — keeps the practice content above the fold.
// Children render inside the panel (typically a few <p> elements).
export default function CollapsibleAbout({ title, resourceHref, resourceLabel, children }) {
  return (
    <details
      style={{
        marginTop: 'var(--space-16)',
        padding: 'var(--space-6)',
        borderRadius: 'var(--r-xl)',
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
      }}
    >
      <summary
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          cursor: 'pointer',
          listStyle: 'none',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 'var(--text-lg)',
          color: 'var(--text-primary)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: 'var(--r-md)',
            background: 'var(--badge-bg)',
            color: 'var(--purple-300)',
          }}
        >
          <Icon name="sparkle" size={16} />
        </span>
        <span style={{ flex: 1 }}>{title}</span>
        <Icon name="chevronDown" size={18} style={{ color: 'var(--text-tertiary)' }} />
      </summary>
      <div
        style={{
          marginTop: 'var(--space-5)',
          paddingTop: 'var(--space-5)',
          borderTop: '1px solid var(--border-color)',
          fontSize: 'var(--text-md)',
          color: 'var(--text-secondary)',
          lineHeight: 'var(--lh-relaxed)',
        }}
      >
        {children}
        {resourceHref && (
          <a
            href={resourceHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-4)',
              color: 'var(--purple-400)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            {resourceLabel || 'Official resource'}
            <Icon name="arrowRight" size={14} />
          </a>
        )}
      </div>
      <style>{`details > summary::-webkit-details-marker { display: none; }`}</style>
    </details>
  );
}
