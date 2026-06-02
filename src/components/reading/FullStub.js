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
          <Icon name="arrowLeft" size={14} /> Reading hub
        </button>
        <PageHeader
          eyebrow="Reading · Full Test"
          title={<>The 60-minute, 3-passage <span className="gradient-text">mock — coming soon.</span></>}
          lead="A full Reading test under exam conditions: three passages, 40 questions, single timer, Cambridge band conversion at the end."
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
                You can simulate full-test conditions by completing one test from each passage back-to-back with no breaks. Set a 60-minute timer and aim for 20 minutes per passage.
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
