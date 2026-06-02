import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import AppLink from '../ui/AppLink';
import { hrefFor } from '../../lib/routes';

// Listening hub — mirrors the Reading hub: About / Part Practice / Full Test.

const CARDS = [
  {
    key: 'about',
    title: 'About IELTS Listening',
    summary: 'How the four sections work, every question type, and how to handle the single-play format.',
    stat: '6 question types',
    icon: 'headphones',
    accent: 'var(--violet-500)',
  },
  {
    key: 'parts',
    title: 'Part Practice',
    summary: 'Drill one section at a time — 20 tests per part, auto-graded with audio playback.',
    stat: '80 tests',
    icon: 'layers',
    accent: 'var(--blue-500)',
  },
  {
    key: 'full',
    title: 'Full Test Practice',
    summary: 'A complete 30-minute, 4-section exam with one-pass audio and band conversion.',
    stat: 'Coming soon',
    icon: 'target',
    accent: 'var(--green-500)',
  },
];

export default function Hub({ setSubPage }) {
  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Listening"
          title={<>Three ways in, <span className="gradient-text">one outcome.</span></>}
          lead="Pick the flow that fits your prep. Want to understand the test first? Drill one section at a time? Or sit a full mock under timer pressure?"
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-6)',
        }}>
          {CARDS.map((c) => (
            <AppLink
              key={c.key}
              href={hrefFor('listening', c.key)}
              onNavigate={() => setSubPage(c.key)}
              className="card card-interactive"
              style={{
                textAlign: 'left',
                padding: 'var(--space-6)',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
                textDecoration: 'none',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--r-lg)',
                background: `linear-gradient(135deg, ${c.accent}, var(--purple-700))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
              }}>
                <Icon name={c.icon} size={28} />
              </div>
              <div>
                <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  {c.title}
                </h3>
                <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
                  {c.summary}
                </p>
              </div>
              <div style={{
                marginTop: 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--border-color)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {c.stat}
                </span>
                <Icon name="arrowRight" size={16} style={{ color: c.accent }} />
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </div>
  );
}
