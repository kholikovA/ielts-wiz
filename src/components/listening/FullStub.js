import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';

export default function FullStub({ setSubPage }) {
  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '780px' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setSubPage('hub')}
          style={{ marginBottom: 'var(--space-5)' }}
        >
          <Icon name="arrowLeft" size={14} /> Listening hub
        </button>
        <PageHeader
          eyebrow="Listening · Full Test"
          title={<>The 30-minute, 4-section <span className="gradient-text">mock — coming soon.</span></>}
          lead="A full Listening test under exam conditions: four sections, 40 questions, single-pass audio, Cambridge band conversion."
        />
        <div className="card" style={{
          padding: 'var(--space-6)',
          borderColor: 'var(--purple-500-30)',
          background: 'linear-gradient(135deg, var(--purple-600-10), transparent)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: 'var(--r-md)',
              background: 'var(--purple-600)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon name="clock" size={22} />
            </div>
            <div>
              <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                In the meantime
              </h3>
              <p className="body" style={{ marginBottom: 'var(--space-3)' }}>
                Simulate full-test conditions by playing one test from each Part (1 → 4) in sequence with no pause, single-pass audio. Aim for the full 30 minutes plus 10 minutes of answer-transfer time.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setSubPage('parts')}
                style={{ gap: 'var(--space-1)' }}
              >
                <Icon name="layers" size={14} /> Go to Part Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
