import React, { useMemo, useState } from 'react';
import Icon from '../ui/icons';
import VocabPopup from './VocabPopup';
import { isSaved, addVocabWord, removeVocabWord } from '../../lib/vocabList';
import './Articles.css';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Splits paragraph text on the article's own target-vocab keys (longest
// first, so multi-word collocative keys would win over single-word
// substrings) and returns an array of { text, vocabKey | null } segments.
// Same regex-alternation approach as HighlightedAnswer.js, but with \b word
// boundaries added so a key can't match inside an unrelated longer word.
const splitOnVocab = (text, vocabKeys) => {
  if (!vocabKeys.length) return [{ text, vocabKey: null }];
  const pattern = [...vocabKeys].sort((a, b) => b.length - a.length).map(escapeRegex).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
  const parts = text.split(regex);
  return parts.filter(p => p !== undefined && p !== '').map((part) => {
    const key = vocabKeys.find(k => k.toLowerCase() === part.toLowerCase());
    return { text: part, vocabKey: key || null };
  });
};

const ArticleReader = ({ article, onBack }) => {
  const vocabKeys = useMemo(() => Object.keys(article.vocab || {}), [article]);
  const [openKey, setOpenKey] = useState(null); // `${paraIndex}-${occurrenceIndex}`
  // Bumping this forces a re-render after add/remove so isSaved() (which reads
  // localStorage, not React state) is re-evaluated for the highlighted words.
  const [, forceRefresh] = useState(0);

  const handleToggleSave = async (word, entry) => {
    if (isSaved(word)) {
      await removeVocabWord(word);
    } else {
      await addVocabWord({ word, ...entry, articleId: article.id, level: article.level });
    }
    forceRefresh(t => t + 1);
  };

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '760px' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 'var(--space-5)' }}>
          <Icon name="arrowLeft" size={16} /> Articles
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <span className="pill">{article.level}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{article.topic}</span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>· {article.estReadMinutes} min read</span>
        </div>

        <h1 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
          {article.title}
        </h1>

        <div style={{ fontSize: 'var(--text-reading)', lineHeight: 'var(--lh-relaxed, 1.7)', color: 'var(--text-primary)' }}>
          {article.paragraphs.map((paragraph, pIdx) => (
            // A <div>, not a <p>: the vocab popup renders <div>/<p> content
            // inline within this text, which HTML forbids inside a real <p>.
            <div key={pIdx} style={{ marginBottom: 'var(--space-5)' }}>
              {splitOnVocab(paragraph, vocabKeys).map((seg, sIdx) => {
                if (!seg.vocabKey) return <React.Fragment key={sIdx}>{seg.text}</React.Fragment>;
                const entry = article.vocab[seg.vocabKey];
                const occKey = `${pIdx}-${sIdx}`;
                const saved = isSaved(seg.vocabKey);
                return (
                  <span key={sIdx} className="vocab-word-anchor">
                    <button
                      type="button"
                      className="vocab-word"
                      onClick={() => setOpenKey(openKey === occKey ? null : occKey)}
                    >
                      {seg.text}
                    </button>
                    {openKey === occKey && (
                      <VocabPopup
                        word={seg.vocabKey}
                        entry={entry}
                        saved={saved}
                        onToggleSave={() => handleToggleSave(seg.vocabKey, entry)}
                        onClose={() => setOpenKey(null)}
                      />
                    )}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArticleReader;
