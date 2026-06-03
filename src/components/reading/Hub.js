import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';

// Top-level Reading hub — card entries to the underlying flows.
// Card visual: large color accent + icon + title + one-line summary +
// supporting stat. The accent colors mirror the Reading category palette
// (violet / blue / green) already used in the Dashboard.

const CARDS = [
  {
    key: 'about',
    title: 'About IELTS Reading',
    summary: 'Format, scoring, every question type, and how to pace yourself across the three passages.',
    stat: '14 question types',
    icon: 'bookOpen',
    accent: 'var(--violet-500)',
  },
  {
    key: 'parts',
    title: 'Part Practice',
    summary: 'Drill one passage at a time. 40 P1 tests, 20 P2 tests, 9 P3 tests — auto-graded.',
    stat: '69 tests',
    icon: 'layers',
    accent: 'var(--blue-500)',
  },
  {
    key: 'cambridge',
    title: 'Cambridge IELTS',
    summary: 'Official Cambridge tests as full 60-minute, 3-passage exams. Cambridge 20 — all 4 reading tests.',
    stat: '4 tests',
    icon: 'award',
    accent: 'var(--purple-600)',
  },
  {
    key: 'full',
    title: 'Full Test Practice',
    summary: 'A complete 60-minute, 3-passage exam (40 questions) under realistic conditions, with band scoring.',
    stat: '1 test',
    icon: 'target',
    accent: 'var(--green-500)',
  },
];

export default function Hub({ setSubPage }) {
  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Reading"
          title={<>Three ways in, <span className="gradient-text">one outcome.</span></>}
          lead="Pick the flow that fits your prep. Want to understand the test first? Drill one passage at a time? Or sit a full mock under timer pressure?"
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-6)',
        }}>
          {CARDS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSubPage(c.key)}
              className="card card-interactive"
              style={{
                textAlign: 'left',
                padding: 'var(--space-6)',
                cursor: 'pointer',
                border: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-4)',
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
