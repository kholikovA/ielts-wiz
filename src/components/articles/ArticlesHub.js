import React, { useMemo, useState } from 'react';
import PageHeader from '../ui/PageHeader';
import { ARTICLES, CEFR_LEVELS } from '../../data/articles';
import { getLocalVocabList } from '../../lib/vocabList';

const ArticlesHub = ({ setSubPage }) => {
  const [levelFilter, setLevelFilter] = useState('All');
  const wordsSaved = getLocalVocabList().length;

  const visibleArticles = useMemo(
    () => (levelFilter === 'All' ? ARTICLES : ARTICLES.filter(a => a.level === levelFilter)),
    [levelFilter]
  );

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Articles · A1–C2"
          title={<>Graded reading, <span className="gradient-text">built for your level.</span></>}
          lead="Short original texts across six CEFR levels. Tap any highlighted word for its pronunciation, definition, an example sentence, and common collocations — then save it to your vocabulary list."
        />

        {/* Stats strip */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-5)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Articles available</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {ARTICLES.length}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Words saved</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {wordsSaved}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Levels</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>6</div>
            </div>
          </div>
        </div>

        {/* Level filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {['All', ...CEFR_LEVELS.map(l => l.id)].map((id) => {
            const level = CEFR_LEVELS.find(l => l.id === id);
            const active = levelFilter === id;
            return (
              <button
                key={id}
                type="button"
                className="chip"
                onClick={() => setLevelFilter(id)}
                style={{
                  borderColor: active ? (level ? level.tint.hard : 'var(--purple-500)') : undefined,
                  color: active ? (level ? level.tint.hard : 'var(--purple-500)') : undefined,
                  background: active ? (level ? level.tint.soft : 'var(--tag-bg)') : undefined,
                }}
              >
                {id}
              </button>
            );
          })}
        </div>

        {visibleArticles.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
            <p className="body">No articles at this level yet — more are on the way.</p>
          </div>
        )}

        {/* Article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {visibleArticles.map((article) => {
            const tint = CEFR_LEVELS.find(l => l.id === article.level)?.tint;
            return (
              <button
                key={article.id}
                type="button"
                onClick={() => setSubPage(article.id)}
                className="card card-interactive animate-fadeInUp"
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <span style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--r-sm)',
                    background: tint?.soft,
                    color: tint?.hard,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}>
                    {article.level}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {article.estReadMinutes} min
                  </span>
                </div>
                <h3 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  {article.title}
                </h3>
                <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                  {article.summary}
                </p>
                <span className="eyebrow">{article.topic}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ArticlesHub;
