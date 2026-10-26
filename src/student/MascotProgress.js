import React, { useEffect, useState } from 'react';
import Icon from '../components/ui/icons';
import { Character, CHARACTERS } from './characters';
import { useHub } from './ui';

// Today's homework as a track: the student's character walks towards the flag.
function message(done, total) {
  if (!total) return 'Nothing due today';
  if (done === total) return 'All done for today!';
  if (done === 0) return "Let's get started";
  if (done / total >= 0.5) return 'Over halfway there';
  return 'Good start, keep going';
}

export default function MascotProgress({ done, total, compact = false }) {
  const { profile } = useHub();
  const id = profile?.avatar_character || CHARACTERS[0].id;
  const value = total ? done / total : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(value)); return () => cancelAnimationFrame(t); }, [value]);
  const finished = total > 0 && done === total;
  return (
    <div className={`mascot${compact ? ' mascot--compact' : ''}${finished ? ' is-done' : ''}`}>
      <div className="mascot-head">
        <strong>{message(done, total)}</strong>
        <span className="hub-num">{done}/{total} today</span>
      </div>
      <div className="mascot-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Today's homework">
        <div className="mascot-fill" style={{ width: `${shown * 100}%` }} />
        <div className="mascot-runner" style={{ left: `${shown * 100}%` }}>
          <Character id={id} size={compact ? 34 : 44} />
        </div>
        <span className="mascot-flag"><Icon name="flag" size={compact ? 14 : 16} /></span>
      </div>
    </div>
  );
}
