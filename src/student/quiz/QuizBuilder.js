import React from 'react';
import Icon from '../../components/ui/icons';
import { Seg } from '../ui';
import { TYPES, VARIANTS, parseGaps, partsOf, pointsOf, newId } from './quiz';

// Teacher editor for a custom test: sections (optional reading passage /
// listening audio) holding questions of any type. Works on the full test
// (answers included); NewAssignment splits it into payload + key on save.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

export const emptyQuestion = (type) => {
  const id = newId();
  switch (type) {
    case 'mcq': return { id, type, prompt: '', options: ['', '', ''], answer: [] };
    case 'tfng': return { id, type, prompt: '', variant: 'tfng', answer: 'T' };
    case 'gap': return { id, type, text: '', bank: false, distractors: '', limit: '' };
    case 'match': return { id, type, prompt: '', left: [], right: [], answer: [], reuse: false };
    case 'short': return { id, type, prompt: '', lead: '', keyword: '', accepted: '', limit: '' };
    case 'reorder': return { id, type, prompt: '', accepted: '' };
    default: return { id, type: 'open', prompt: '', points: 5, min_words: 0 };
  }
};
export const emptySection = () => ({ id: newId(), title: '', instructions: '', passage: '', audio_url: '', questions: [] });
export const emptyTest = () => ({ sections: [{ ...emptySection(), questions: [emptyQuestion('mcq')] }] });

// Problems that would make a question unmarkable.
export function testProblems(test) {
  const out = [];
  let n = 0;
  (test.sections || []).forEach((s) => s.questions.forEach((q) => {
    n += 1;
    const at = `Question ${n}`;
    if (q.type === 'mcq') {
      if (q.options.filter((o) => o.trim()).length < 2) out.push(`${at}: add at least two options.`);
      if (!q.answer.length) out.push(`${at}: tick the correct option.`);
    }
    if (q.type === 'gap' && !parseGaps(q.text).length) out.push(`${at}: put at least one answer in {curly brackets}.`);
    if (q.type === 'match' && (!q.left.some((l) => l.trim()) || !q.right.some((r) => r.trim())
      || q.left.some((l, i) => l.trim() && q.answer[i] == null))) out.push(`${at}: choose an answer for every item.`);
    if ((q.type === 'short' || q.type === 'reorder') && !lines(q.accepted).length) out.push(`${at}: add the correct answer.`);
    if ((q.type === 'tfng' || q.type === 'open') && !String(q.prompt || '').trim()) out.push(`${at}: add the question.`);
  }));
  if (!n) out.push('Add at least one question.');
  return out;
}

function MCQ({ q, set }) {
  const toggle = (i) => set({ answer: q.answer.includes(i) ? q.answer.filter((x) => x !== i) : [...q.answer, i].sort((a, b) => a - b) });
  return (
    <>
      <textarea className="form-textarea" rows={2} placeholder="Question" value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      <div className="qb-options">
        {q.options.map((o, i) => (
          <div key={i} className="qb-option">
            <label className={`qb-correct${q.answer.includes(i) ? ' is-on' : ''}`} title="Correct answer">
              <input type="checkbox" checked={q.answer.includes(i)} onChange={() => toggle(i)} />
              {LETTERS[i]}
            </label>
            <input className="form-input" value={o} placeholder={`Option ${LETTERS[i]}`}
              onChange={(e) => set({ options: q.options.map((x, k) => (k === i ? e.target.value : x)) })} />
            <button type="button" className="qb-x" aria-label="Remove option" disabled={q.options.length <= 2}
              onClick={() => set({ options: q.options.filter((_, k) => k !== i), answer: q.answer.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)) })}>
              <Icon name="close" size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="qb-row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ options: [...q.options, ''] })}><Icon name="plus" size={13} /> Option</button>
        <small>Tick the correct letter. Tick two or more for “Choose TWO / THREE” (one mark each).</small>
      </div>
    </>
  );
}

function TFNG({ q, set }) {
  return (
    <>
      <textarea className="form-textarea" rows={2} placeholder="Statement" value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      <div className="qb-row">
        <select className="form-select qb-narrow" value={q.variant} onChange={(e) => set({ variant: e.target.value, answer: e.target.value === 'tf' && q.answer === 'NG' ? 'T' : q.answer })} aria-label="Answer set">
          <option value="tfng">True / False / Not Given</option>
          <option value="ynng">Yes / No / Not Given</option>
          <option value="tf">True / False</option>
        </select>
        <Seg label="Correct answer" value={q.answer} onChange={(v) => set({ answer: v })} options={VARIANTS[q.variant].map(([value, label]) => ({ value, label }))} />
      </div>
    </>
  );
}

function Gap({ q, set }) {
  const gaps = parseGaps(q.text);
  return (
    <>
      <textarea className="form-textarea qb-mono" rows={4} value={q.text} onChange={(e) => set({ text: e.target.value })}
        placeholder={'She {has lived|\'s lived} in London {since} 2019.\nWrite answers in {curly brackets}; separate accepted alternatives with |.'} />
      <div className="qb-row">
        <small>{gaps.length} gap{gaps.length === 1 ? '' : 's'}{gaps.length ? `: ${gaps.map((g) => g[0]).join(' · ')}` : ''}</small>
      </div>
      <div className="qb-row">
        <label className="hub-check" style={{ marginTop: 0 }}>
          <input type="checkbox" checked={q.bank} onChange={(e) => set({ bank: e.target.checked })} /> Word bank (students pick from a list)
        </label>
        <input className="form-input qb-narrow" value={q.limit} onChange={(e) => set({ limit: e.target.value })} placeholder="Word limit, e.g. NO MORE THAN TWO WORDS" />
      </div>
      {q.bank && (
        <textarea className="form-textarea" rows={2} value={q.distractors} onChange={(e) => set({ distractors: e.target.value })}
          placeholder="Extra wrong words for the bank, one per line (optional)" />
      )}
    </>
  );
}

function Match({ q, set }) {
  const setLines = (field, text) => {
    const list = text.split('\n');
    set({ [field]: list, answer: field === 'left' ? list.map((_, i) => q.answer[i] ?? null) : q.answer.map((a) => (a != null && a < list.length ? a : null)) });
  };
  return (
    <>
      <textarea className="form-textarea" rows={1} placeholder="Instruction (optional), e.g. Match each paragraph with a heading." value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      <div className="qb-two">
        <div>
          <span className="form-label">Items (one per line)</span>
          <textarea className="form-textarea" rows={5} value={q.left.join('\n')} onChange={(e) => setLines('left', e.target.value)} placeholder={'Paragraph A\nParagraph B'} />
        </div>
        <div>
          <span className="form-label">Options (one per line)</span>
          <textarea className="form-textarea" rows={5} value={q.right.join('\n')} onChange={(e) => setLines('right', e.target.value)} placeholder={'The cost of housing\nA new transport plan'} />
        </div>
      </div>
      {q.left.filter((x) => x.trim()).length > 0 && q.right.filter((x) => x.trim()).length > 0 && (
        <div className="qb-answers">
          {q.left.map((l, i) => l.trim() && (
            <label key={i} className="qb-answer">
              <span>{l}</span>
              <select className="form-select" value={q.answer[i] ?? ''} onChange={(e) => set({ answer: q.left.map((_, k) => (k === i ? (e.target.value === '' ? null : Number(e.target.value)) : q.answer[k] ?? null)) })}>
                <option value="">Answer…</option>
                {q.right.map((r, k) => r.trim() && <option key={k} value={k}>{LETTERS[k]}. {r}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      <label className="hub-check"><input type="checkbox" checked={q.reuse} onChange={(e) => set({ reuse: e.target.checked })} /> Options can be used more than once</label>
    </>
  );
}

function Short({ q, set }) {
  return (
    <>
      <textarea className="form-textarea" rows={2} placeholder="Question or sentence to rewrite / correct" value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      <div className="qb-two">
        <input className="form-input" value={q.keyword} onChange={(e) => set({ keyword: e.target.value })} placeholder="Key word to use (optional), e.g. SINCE" />
        <input className="form-input" value={q.lead} onChange={(e) => set({ lead: e.target.value })} placeholder="Answer starts with (optional)" />
      </div>
      <textarea className="form-textarea" rows={2} value={q.accepted} onChange={(e) => set({ accepted: e.target.value })}
        placeholder="Accepted answers, one per line (without the starting words)" />
      <input className="form-input qb-narrow" value={q.limit} onChange={(e) => set({ limit: e.target.value })} placeholder="Word limit (optional)" />
    </>
  );
}

function Reorder({ q, set }) {
  return (
    <>
      <textarea className="form-textarea" rows={1} placeholder="Instruction (optional)" value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      <textarea className="form-textarea" rows={2} value={q.accepted} onChange={(e) => set({ accepted: e.target.value })}
        placeholder={'The correct sentence (students get its words shuffled)\nOther accepted orders, one per line (optional)'} />
    </>
  );
}

function Open({ q, set }) {
  return (
    <>
      <textarea className="form-textarea" rows={2} placeholder="Question" value={q.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      <div className="qb-row">
        <label className="qb-inline">Points <input type="number" min="1" max="50" className="form-input" value={q.points} onChange={(e) => set({ points: Number(e.target.value) || 1 })} /></label>
        <label className="qb-inline">Min. words <input type="number" min="0" className="form-input" value={q.min_words} onChange={(e) => set({ min_words: Number(e.target.value) || 0 })} /></label>
        <small>You mark this one when you review.</small>
      </div>
    </>
  );
}

const EDITORS = { mcq: MCQ, tfng: TFNG, gap: Gap, match: Match, short: Short, reorder: Reorder, open: Open };

function QuestionCard({ q, num, onChange, onRemove, onMove, onDuplicate, first, last }) {
  const Editor = EDITORS[q.type];
  const parts = partsOf(q);
  return (
    <div className="qb-q">
      <div className="qb-q-head">
        <span className="qb-num">{parts > 1 ? `${num}–${num + parts - 1}` : num}</span>
        <select className="form-select qb-type" value={q.type} aria-label="Question type"
          onChange={(e) => onChange({ ...emptyQuestion(e.target.value), id: q.id, prompt: q.prompt || '' })}>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <small>{pointsOf(q)} pt{pointsOf(q) === 1 ? '' : 's'}</small>
        <span className="qb-tools">
          <button type="button" className="qb-x" onClick={() => onMove(-1)} disabled={first} aria-label="Move up"><Icon name="chevronDown" size={14} className="qb-up" /></button>
          <button type="button" className="qb-x" onClick={() => onMove(1)} disabled={last} aria-label="Move down"><Icon name="chevronDown" size={14} /></button>
          <button type="button" className="qb-x" onClick={onDuplicate} aria-label="Duplicate question"><Icon name="copy" size={14} /></button>
          <button type="button" className="qb-x" onClick={onRemove} aria-label="Delete question"><Icon name="close" size={14} /></button>
        </span>
      </div>
      <div className="qb-q-body"><Editor q={q} set={(patch) => onChange({ ...q, ...patch })} /></div>
    </div>
  );
}

export default function QuizBuilder({ value, onChange }) {
  const test = value;
  const setSection = (si, patch) => onChange({ ...test, sections: test.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) });
  const setQuestions = (si, fn) => setSection(si, { questions: fn(test.sections[si].questions) });
  let counter = 1;
  return (
    <div className="qb">
      {test.sections.map((s, si) => (
        <div key={s.id} className="card qb-section">
          <div className="qb-section-head">
            <input className="form-input qb-title" value={s.title} placeholder={`Section ${si + 1} title (optional)`} onChange={(e) => setSection(si, { title: e.target.value })} />
            {test.sections.length > 1 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ ...test, sections: test.sections.filter((_, i) => i !== si) })}>Remove section</button>
            )}
          </div>
          <textarea className="form-textarea" rows={2} value={s.instructions} placeholder="Instructions (optional), e.g. Complete the sentences. Write NO MORE THAN TWO WORDS."
            onChange={(e) => setSection(si, { instructions: e.target.value })} />
          <details className="qb-extra" open={Boolean(s.passage || s.audio_url)}>
            <summary>Reading passage or listening audio</summary>
            <textarea className="form-textarea" rows={6} value={s.passage} placeholder="Passage (shown beside the questions)"
              onChange={(e) => setSection(si, { passage: e.target.value })} />
            <input className="form-input" value={s.audio_url} placeholder="Audio link (mp3) for listening (optional)"
              onChange={(e) => setSection(si, { audio_url: e.target.value })} />
          </details>
          <div className="qb-list">
            {s.questions.map((q, qi) => {
              const num = counter;
              counter += partsOf(q);
              return (
                <QuestionCard key={q.id} q={q} num={num} first={qi === 0} last={qi === s.questions.length - 1}
                  onChange={(nq) => setQuestions(si, (list) => list.map((x) => (x.id === q.id ? nq : x)))}
                  onRemove={() => setQuestions(si, (list) => list.filter((x) => x.id !== q.id))}
                  onDuplicate={() => setQuestions(si, (list) => [...list.slice(0, qi + 1), { ...JSON.parse(JSON.stringify(q)), id: newId() }, ...list.slice(qi + 1)])}
                  onMove={(d) => setQuestions(si, (list) => {
                    const a = [...list]; const j = qi + d;
                    [a[qi], a[j]] = [a[j], a[qi]];
                    return a;
                  })} />
              );
            })}
          </div>
          <div className="qb-add">
            <span>Add</span>
            {Object.entries(TYPES).map(([k, v]) => (
              <button key={k} type="button" className="chip" onClick={() => setQuestions(si, (list) => [...list, emptyQuestion(k)])}>
                <Icon name="plus" size={12} /> {v.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange({ ...test, sections: [...test.sections, emptySection()] })}>
        <Icon name="plus" size={14} /> Add section
      </button>
    </div>
  );
}
