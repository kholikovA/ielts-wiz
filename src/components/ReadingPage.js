import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { readingPassage1Tests } from '../data/reading-passage1';
import { readingPassage2Tests } from '../data/reading-passage2';
import { readingPassage3Tests } from '../data/reading-passage3';

// Each test card links to a standalone HTML test in /public/reading/.
const testHref = (passage, id) => `/reading/passage${passage}_${id}.html`;

const ReadingPage = ({ subPage, setSubPage, setCurrentPage }) => {
  const { user } = useAuth();
  const [completedTests, setCompletedTests] = useState(() => {
    const key = `completedReading_${subPage || 'passage1'}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const key = `completedReading_${subPage || 'passage1'}`;
    const saved = localStorage.getItem(key);
    setCompletedTests(saved ? JSON.parse(saved) : []);
  }, [subPage]);

  // Sync subPage from URL (back/forward navigation)
  useEffect(() => {
    const syncFromUrl = () => {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'reading' && pathParts[1]) {
        setSubPage(pathParts[1]);
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const requireAuth = (e) => {
    if (!user) {
      e.preventDefault();
      setCurrentPage('login');
    }
  };

  const renderTestCard = (test, passageNum, accent) => {
    const isCompleted = completedTests.includes(test.id);
    return (
      <a
        key={test.id}
        href={testHref(passageNum, test.id)}
        onClick={requireAuth}
        style={{
          display: 'block', textDecoration: 'none', color: 'inherit',
          padding: '1.5rem', borderRadius: '12px', background: 'var(--card-bg)',
          border: `1px solid ${isCompleted ? '#22c55e' : 'var(--border-color)'}`,
          cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
        }}
      >
        {isCompleted && (
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: accent }}>TEST {test.id}</span>
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', paddingRight: isCompleted ? '2rem' : 0 }}>{test.title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{test.subtitle}</p>
      </a>
    );
  };

  // ========== Overview Page ==========
  if (subPage === 'overview' || !subPage) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            📖 Reading Section
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Practice with authentic IELTS reading passages and questions
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div
              onClick={() => { setSubPage('passage1'); window.history.pushState({}, '', '/reading/passage1'); }}
              style={{
                padding: '2rem', borderRadius: '16px',
                background: 'linear-gradient(135deg, var(--purple-600-10), var(--purple-700-5))',
                border: '1px solid var(--purple-500-30)', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }}>40 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 1 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • T/F/NG, completion, matching, MCQ</p>
            </div>

            <div
              onClick={() => { setSubPage('passage2'); window.history.pushState({}, '', '/reading/passage2'); }}
              style={{
                padding: '2rem', borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }}>20 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 2 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>13 questions • Matching headings, MCQ, T/F/NG, completion</p>
            </div>

            <div
              onClick={() => { setSubPage('passage3'); window.history.pushState({}, '', '/reading/passage3'); }}
              style={{
                padding: '2rem', borderRadius: '16px', background: 'var(--card-bg)',
                border: '1px solid rgba(16, 185, 129, 0.3)', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <span style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', background: 'var(--purple-600)', fontSize: '1rem', fontWeight: '600', color: 'white', letterSpacing: '0.5px', lineHeight: '1', height: 'fit-content' }}>9 TESTS</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Passage 3 Practice</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>14 questions • Advanced difficulty • Matching, MCQ, T/F/NG</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== Per-Passage Test Lists ==========
  const passageConfigs = {
    passage1: { num: 1, tests: readingPassage1Tests, title: 'Passage 1 Practice Tests', sub: '12–13 questions per test • 20 minutes recommended', accent: 'var(--purple-400)' },
    passage2: { num: 2, tests: readingPassage2Tests, title: 'Passage 2 Practice Tests', sub: '13 questions per test • 20 minutes recommended', accent: '#60a5fa' },
    passage3: { num: 3, tests: readingPassage3Tests, title: 'Passage 3 Practice Tests', sub: '14 questions per test • 20 minutes recommended • Advanced difficulty', accent: '#10b981' },
  };
  const cfg = passageConfigs[subPage];
  if (!cfg) return null;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <button
          onClick={() => { setSubPage('overview'); window.history.pushState({}, '', '/reading'); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1.5rem', borderRadius: '8px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          ← Back to Overview
        </button>

        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {cfg.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {cfg.sub}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {cfg.tests.map((test) => renderTestCard(test, cfg.num, cfg.accent))}
        </div>
      </div>
    </div>
  );
};

export default ReadingPage;
