import React from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/icons';
import { LISTENING_TESTS } from '../../data/tests/manifest';
import { useAuth } from '../../contexts/AuthContext';
import { getLatestAttempt, canReviewTest } from '../../lib/progressStore';
import useProgressVersion from '../../lib/useProgressVersion';
import { ScoreBadge, ReviewRetake } from '../ui/testCardBits';

export default function FullStub({ setSubPage, setCurrentPage }) {
  const { user } = useAuth();
  useProgressVersion(); // re-render when a sync brings in attempts

  // Signed-out users go to login (and come back); otherwise route in-app to
  // /listening-test/<slug>[/review] instead of a full page load.
  const openTest = (e) => {
    const href = e.currentTarget.getAttribute('href') || '';
    e.preventDefault();
    if (!user) {
      setCurrentPage('login');
      window.history.replaceState({}, '', `/login?next=${encodeURIComponent(href)}`);
      return;
    }
    setCurrentPage('listening-test', href.slice('/listening-test/'.length));
  };

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
          title={<>The 30-minute, 4-section <span className="gradient-text">listening mock.</span></>}
          lead="A full Listening test in the exam player: four sections, 40 questions, every question type, native flowcharts, and Cambridge band conversion."
        />

        {LISTENING_TESTS.length > 0 && (
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-5)' }}>
            <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Available now</h3>
            {LISTENING_TESTS.map((t) => {
              const latest = getLatestAttempt(t.kind, t.id);
              const attempted = canReviewTest(t.kind, t.id);
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.spec.title}</div>
                    <div className="body" style={{ fontSize: 'var(--text-sm)' }}>4 sections · 40 questions · {t.spec.duration_minutes || 30} minutes{t.spec.demo ? ' · demo (no audio)' : ''}</div>
                  </div>
                  {attempted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {latest && <ScoreBadge correct={latest.correct} total={latest.total} />}
                      <ReviewRetake href={`/listening-test/${t.slug}`} onAuthRequired={openTest} canReview />
                    </div>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentPage('listening-test', t.slug)} style={{ gap: 'var(--space-1)' }}>
                      <Icon name="play" size={14} /> Start test
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
