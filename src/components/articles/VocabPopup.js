import React, { useEffect } from 'react';
import Icon from '../ui/icons';
import useBodyScrollLock from '../ui/useBodyScrollLock';

// Click-triggered vocabulary card (unlike the hover-only Vocab.js tooltip):
// word + IPA + part of speech, definition, an example sentence, common
// collocations, and an Add/Remove-from-vocabulary-list button. Anchored near
// the word on desktop; becomes a fixed bottom sheet on narrow viewports (see
// Articles.css) since that needs a real media query. A full-viewport backdrop
// sits behind the card and closes the popup on click — simpler and more
// reliable than a document-level outside-click listener.
const VocabPopup = ({ word, entry, saved, onToggleSave, onClose }) => {
  useBodyScrollLock(true);

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="vocab-popup-backdrop" aria-hidden="true" onClick={onClose} />
      <div className="vocab-popup-card" role="dialog" aria-label={`Definition of ${word}`}>
        <button type="button" className="vocab-popup-close" onClick={onClose} aria-label="Close">
          <Icon name="close" size={16} />
        </button>

        <div className="vocab-popup-headword">
          <span className="vocab-popup-word">{word}</span>
          {entry.ipa && <span className="vocab-popup-ipa">{entry.ipa}</span>}
        </div>
        {entry.partOfSpeech && <div className="vocab-popup-pos">{entry.partOfSpeech}</div>}

        <p className="vocab-popup-definition">{entry.definition}</p>

        {entry.example && (
          <p className="vocab-popup-example">&ldquo;{entry.example}&rdquo;</p>
        )}

        {entry.collocations?.length > 0 && (
          <div className="vocab-popup-collocations">
            <div className="vocab-popup-collocations-label">Common collocations</div>
            <div className="vocab-popup-chips">
              {entry.collocations.map((c) => (
                <span key={c} className="vocab-popup-chip">{c}</span>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          className={`btn ${saved ? 'btn-secondary' : 'btn-primary'} vocab-popup-save`}
          onClick={onToggleSave}
        >
          <Icon name={saved ? 'check' : 'plus'} size={16} />
          {saved ? 'Added to vocabulary list' : 'Add to vocabulary list'}
        </button>
      </div>
    </>
  );
};

export default VocabPopup;
