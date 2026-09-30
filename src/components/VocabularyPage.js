import React, { useEffect, useState } from 'react';
import PageHeader from './ui/PageHeader';
import Icon from './ui/icons';
import { getLocalVocabList, removeVocabWord, pullVocabList } from '../lib/vocabList';
import { useAuth } from '../contexts/AuthContext';

const VocabularyPage = () => {
  const { user } = useAuth();
  const [words, setWords] = useState(getLocalVocabList());

  useEffect(() => {
    if (!user) return;
    pullVocabList().then((res) => { if (res.ok) setWords(getLocalVocabList()); });
  }, [user]);

  const handleRemove = async (word) => {
    await removeVocabWord(word);
    setWords(getLocalVocabList());
  };

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '1100px' }}>
        <PageHeader
          eyebrow="Vocabulary"
          title={<>Your saved <span className="gradient-text">words.</span></>}
          lead="Every word you've saved from Articles, with its pronunciation, definition, an example sentence, and common collocations."
        />

        {words.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
            <p className="body">No words saved yet — open an article and tap a highlighted word to add it here.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {words.map((w) => (
              <div key={w.word} className="card" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => handleRemove(w.word)}
                  aria-label={`Remove ${w.word}`}
                  style={{
                    position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)',
                    background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer',
                    padding: 4, borderRadius: 'var(--r-sm)',
                  }}
                >
                  <Icon name="close" size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', paddingRight: 24 }}>
                  <span className="h3" style={{ color: 'var(--text-primary)' }}>{w.word}</span>
                  {w.ipa && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--purple-400)' }}>
                      {w.ipa}
                    </span>
                  )}
                </div>
                {w.partOfSpeech && (
                  <div style={{ fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)' }}>
                    {w.partOfSpeech}
                  </div>
                )}
                <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>{w.definition}</p>
                {w.example && (
                  <p style={{ fontSize: 'var(--text-sm)', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                    &ldquo;{w.example}&rdquo;
                  </p>
                )}
                {w.collocations?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {w.collocations.map((c) => (
                      <span key={c} className="pill" style={{ fontSize: 'var(--text-xs)' }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyPage;
