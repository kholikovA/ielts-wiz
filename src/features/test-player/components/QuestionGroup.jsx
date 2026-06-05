import React from 'react';
import { GapInput, InterleaveGaps, HTML } from './gaps';

// Stable key for a placement group (matching headings / sentence endings / dragdrop
// matching) — must match the key the player uses to scope its placement controller.
export const groupKey = (group) => {
  const ns = group.questions.map((q) => q.number).sort((a, b) => a - b);
  return `${group.type}_${ns[0]}_${ns[ns.length - 1]}`;
};

const headerLabel = (qnums) =>
  qnums.length > 1 ? `Questions ${qnums[0]}–${qnums[qnums.length - 1]}` : `Question ${qnums[0]}`;

function RadioGroup({ qnum, options, value, onChange }) {
  return (
    <ul className="options-list">
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.letter;
        const display = typeof opt === 'string' ? opt : opt.text;
        return (
          <li key={val}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', width: '100%' }}>
              <input
                type="radio"
                name={`q${qnum}`}
                value={val}
                checked={value === val}
                onChange={() => onChange(qnum, val)}
              />
              <span className="radio-circle" />
              <span><HTML html={display} /></span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export default function QuestionGroup({ group, answers, onChange, place }) {
  const qtype = group.type;
  const questions = group.questions || [];
  const qnums = questions.map((q) => q.number);
  const key = groupKey(group);

  let body = null;

  if (qtype === 'tfng' || qtype === 'yng') {
    const opts = qtype === 'tfng' ? ['TRUE', 'FALSE', 'NOT GIVEN'] : ['YES', 'NO', 'NOT GIVEN'];
    body = questions.map((q) => (
      <div className="question" data-qnum={q.number} key={q.number}>
        <div className="question-prompt">
          <span className="question-number">{q.number}</span> <HTML html={q.prompt} />
        </div>
        <RadioGroup qnum={q.number} options={opts} value={answers[q.number]} onChange={onChange} />
      </div>
    ));
  } else if (qtype === 'mcq') {
    body = questions.map((q) => (
      <div className="question" data-qnum={q.number} key={q.number}>
        <div className="question-prompt">
          <span className="question-number">{q.number}</span> <HTML html={q.prompt} />
        </div>
        <RadioGroup qnum={q.number} options={q.options || []} value={answers[q.number]} onChange={onChange} />
      </div>
    ));
  } else if (qtype === 'mcq_multi') {
    const first = questions.find((q) => q.options) || questions[0];
    const sorted = [...qnums].sort((a, b) => a - b);
    const primary = sorted[0];
    const prefix = sorted.length > 1 ? `${sorted[0]}-${sorted[sorted.length - 1]}` : `${sorted[0]}`;
    const current = String(answers[primary] || '').split(',').filter(Boolean);
    const toggle = (letter) => {
      const next = current.includes(letter) ? current.filter((l) => l !== letter) : [...current, letter];
      const val = next.join(',');
      sorted.forEach((qn) => onChange(qn, val)); // mirror selection onto every shared qnum
    };
    body = (
      <div className="question" data-qnum={primary}>
        <div className="question-prompt">
          <span className="question-number">{prefix}</span> <HTML html={first.prompt} />
        </div>
        <ul className="options-list">
          {(first.options || []).map((o) => (
            <li key={o.letter}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', width: '100%' }}>
                <input type="checkbox" value={o.letter} checked={current.includes(o.letter)} onChange={() => toggle(o.letter)} />
                <span className="check-square" />
                <span><HTML html={o.text} /></span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    );
  } else if (qtype === 'matching_headings') {
    const placed = place.placedIds(key);
    body = (
      <div className="heading-bank">
        <div className="heading-bank-title">List of Headings</div>
        <div className="heading-bank-list">
          {(group.heading_bank || []).map((h) => {
            const used = placed.has(h.id);
            const sel = place.selected && place.selected.key === key && place.selected.id === h.id;
            return (
              <div
                key={h.id}
                className={`heading-card${used ? ' used' : ''}${sel ? ' selected' : ''}`}
                data-heading-id={h.id}
                draggable={!used}
                onClick={() => !used && place.select(key, h.id)}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ key, id: h.id }))}
                style={used ? { opacity: 0.4, pointerEvents: 'none' } : sel ? { outline: '2px solid var(--accent)' } : undefined}
              >
                <HTML html={h.text} />
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (qtype === 'matching_info' || qtype === 'matching_features') {
    const bank = group.feature_bank || [];
    const col = group.table_column_header || 'Information';
    const showLegend = group.show_bank_legend ?? (qtype === 'matching_features');
    body = (
      <>
        <table className="match-table">
          <thead>
            <tr>
              <th>{col}</th>
              {bank.map((b) => <th key={b.letter}>{b.letter}</th>)}
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.number} data-qnum={q.number} className="question" data-question-row="true">
                <td><span className="row-num">{q.number}</span><HTML html={q.prompt} /></td>
                {bank.map((b) => {
                  const on = answers[q.number] === b.letter;
                  return (
                    <td
                      key={b.letter}
                      className={`match-cell${on ? ' selected' : ''}`}
                      data-letter={b.letter}
                      onClick={() => onChange(q.number, on ? '' : b.letter)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span style={{ visibility: on ? 'visible' : 'hidden' }}>✓</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {showLegend && (
          <div className="match-legend">
            <div className="match-legend-title">{group.bank_title || 'Options'}</div>
            {bank.map((b) => (
              <div className="match-legend-item" key={b.letter}>
                <strong>{b.letter}</strong><span><HTML html={b.text} /></span>
              </div>
            ))}
          </div>
        )}
      </>
    );
  } else if (qtype === 'sentence_endings') {
    const placed = place.placedIds(key);
    body = (
      <>
        {questions.map((q) => {
          const val = answers[q.number];
          return (
            <div className="question" data-qnum={q.number} key={q.number}>
              <div className="question-prompt"><span><HTML html={q.prompt} /></span></div>
              <div
                className="heading-gap"
                data-qnum={q.number}
                onClick={() => (val ? place.clearAt(q.number) : place.placeAt(key, q.number))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => place.dropAt(key, q.number, e)}
              >
                {val
                  ? <span><HTML html={place.labelOf(key, val)} /></span>
                  : <span className="heading-gap-num">{q.number}</span>}
                {val && <button className="heading-gap-clear" title="Clear" onClick={(e) => { e.stopPropagation(); place.clearAt(q.number); }}>×</button>}
              </div>
            </div>
          );
        })}
        <div className="heading-bank ending-bank">
          <div className="heading-bank-list">
            {(group.ending_bank || []).map((it) => {
              const used = placed.has(it.letter);
              const sel = place.selected && place.selected.key === key && place.selected.id === it.letter;
              return (
                <div
                  key={it.letter}
                  className={`heading-card${used ? ' used' : ''}${sel ? ' selected' : ''}`}
                  data-heading-id={it.letter}
                  draggable={!used}
                  onClick={() => !used && place.select(key, it.letter)}
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify({ key, id: it.letter }))}
                  style={used ? { opacity: 0.4, pointerEvents: 'none' } : sel ? { outline: '2px solid var(--accent)' } : undefined}
                >
                  <HTML html={it.text} />
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  } else if (qtype === 'sentence_completion') {
    body = (
      <ul className="note-list">
        {questions.map((q) => (
          <li className="question" data-qnum={q.number} key={q.number}>
            <InterleaveGaps html={q.prompt_html || q.prompt || ''} qnums={[q.number]} answers={answers} onChange={onChange} />
          </li>
        ))}
      </ul>
    );
  } else if (qtype === 'summary_completion') {
    const layout = group.layout || {};
    const wordBank = layout.word_bank;
    body = (
      <>
        {layout.title && <div className="completion-title">{layout.title}</div>}
        {wordBank && (
          <div className="completion-word-bank">
            <div className="completion-word-bank-title">List of words</div>
            <div className="completion-word-bank-grid">
              {wordBank.map((it) => (
                <div className="completion-word-bank-item" key={it.letter}>
                  <strong>{it.letter}</strong>&nbsp;&nbsp;<HTML html={it.text} />
                </div>
              ))}
            </div>
          </div>
        )}
        {layout.body_html
          ? <div className="completion-prose"><InterleaveGaps html={layout.body_html} qnums={qnums} answers={answers} onChange={onChange} wordBank={wordBank} /></div>
          : questions.map((q) => (
              <div className="question" data-qnum={q.number} key={q.number}>
                <div className="question-prompt"><span className="question-number">{q.number}</span>{' '}
                  <span><InterleaveGaps html={q.prompt_html || q.prompt || ''} qnums={[q.number]} answers={answers} onChange={onChange} /></span>
                </div>
              </div>
            ))}
      </>
    );
  } else if (qtype === 'note_completion') {
    const layout = group.layout || {};
    body = (
      <>
        {layout.title && <div className="completion-title">{layout.title}</div>}
        {(layout.sections || []).map((sec, si) => (
          <div className="note-section" key={si}>
            {sec.heading && <div className="note-section-heading">{sec.heading}</div>}
            <ul className="note-list">
              {(sec.items || []).map((it, ii) => (
                <li key={ii} className={it.indent ? 'note-subitem' : undefined}>
                  {'qnum' in it
                    ? <InterleaveGaps html={it.html} qnums={[it.qnum]} answers={answers} onChange={onChange} />
                    : <HTML html={it.html} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </>
    );
  } else if (qtype === 'table_completion' || qtype === 'flowchart_completion' || qtype === 'diagram_completion') {
    const layout = group.layout || {};
    body = (
      <>
        {layout.title && <div className="completion-title">{layout.title}</div>}
        {layout.body_html && (
          <div className="completion-layout">
            <InterleaveGaps html={layout.body_html} qnums={qnums} answers={answers} onChange={onChange} />
          </div>
        )}
      </>
    );
  } else if (qtype === 'short_answer') {
    body = (
      <ul className="short-answer-list">
        {questions.map((q) => {
          let ht = q.prompt_html || q.prompt || '';
          if (!ht.includes('___')) ht += ' ___';
          return (
            <li className="question" data-qnum={q.number} key={q.number}>
              <span className="sa-num">{q.number}</span>
              <span className="sa-content"><InterleaveGaps html={ht} qnums={[q.number]} answers={answers} onChange={onChange} /></span>
            </li>
          );
        })}
      </ul>
    );
  } else {
    body = <div style={{ color: 'red' }}>Unknown question type: {qtype}</div>;
  }

  return (
    <div className="question-group" data-type={qtype}>
      <div className="question-group-header">{headerLabel(qnums)}</div>
      <div className="question-group-instructions"><HTML html={group.instructions_html || ''} /></div>
      {body}
    </div>
  );
}
