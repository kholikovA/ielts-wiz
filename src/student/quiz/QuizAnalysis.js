import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/ui/icons';
import { Seg } from '../ui';
import { analyzeQuiz, keyParts, numbering, VARIANTS } from './quiz';

// Teacher: go through a quiz with the class (screen share). Each question shows how
// many students missed it; answers stay hidden until revealed. No student names.

const level = (rate) => (rate >= 0.5 ? 'high' : rate >= 0.25 ? 'mid' : rate > 0 ? 'low' : 'none');
const LETTERS = 'ABCDEFGHIJ';

function Missed({ part, students, small }) {
  const missed = part.wrong + part.blank;
  const rate = students ? missed / students : 0;
  return (
    <span className={`qa-miss is-${level(rate)}${small ? ' qa-miss--sm' : ''}`} title={`${part.wrong} wrong, ${part.blank} blank`}>
      {missed ? <><Icon name="xCircle" size={small ? 11 : 13} /> {missed}</> : <Icon name="check" size={small ? 11 : 13} />}
    </span>
  );
}

function WrongAnswers({ stats, multi, from }) {
  const rows = stats.parts.map((p, i) => ({ p, i })).filter(({ p }) => p.answers.length || p.blank);
  if (!rows.length) return null;
  return (
    <div className="qa-wrong">
      <span className="qa-wrong-label">Wrong answers</span>
      {rows.map(({ p, i }) => (
        <span key={i} className="qa-wrong-part">
          {multi && <b>{from + i}</b>}
          {p.answers.slice(0, 4).map(([text, n]) => <span key={text} className="qa-chip">{text}{n > 1 && <i>×{n}</i>}</span>)}
          {p.blank > 0 && <span className="qa-chip is-blank">blank{p.blank > 1 && <i>×{p.blank}</i>}</span>}
        </span>
      ))}
    </div>
  );
}

function Body({ q, k, stats, students, num, shown }) {
  const answer = keyParts(q, k);
  switch (q.type) {
    case 'gap': {
      const pieces = String(q.text).split(/\{\{(\d+)\}\}/);
      return (
        <p className="qa-gaptext">
          {pieces.map((p, i) => {
            if (i % 2 === 0) return <React.Fragment key={i}>{p}</React.Fragment>;
            const idx = Number(p) - 1;
            return (
              <span key={i} className="qa-gap">
                {q.gaps > 1 && <span className="qa-gapnum">{num.from + idx}</span>}
                <span className={`qa-blank${shown ? ' is-shown' : ''}`}>{shown ? answer[idx] : ' '}</span>
                {q.gaps > 1 && <Missed part={stats.parts[idx]} students={students} small />}
              </span>
            );
          })}
        </p>
      );
    }
    case 'mcq':
      return (
        <ol className="qa-options">
          {q.options.map((o, i) => (
            <li key={i} className={shown && (k || []).includes(i) ? 'is-right' : ''}><b>{LETTERS[i]}</b>{o}</li>
          ))}
        </ol>
      );
    case 'tfng':
      return (
        <div className="qa-options qa-options--row">
          {VARIANTS[q.variant || 'tfng'].map(([v, label]) => <span key={v} className={shown && k === v ? 'is-right' : ''}>{label}</span>)}
        </div>
      );
    case 'match':
      return (
        <ul className="qa-match">
          {q.left.map((l, i) => (
            <li key={i}>
              <span className="qa-gapnum">{num.from + i}</span>
              <span className="qa-match-left">{l}</span>
              <span className={`qa-blank${shown ? ' is-shown' : ''}`}>{shown ? answer[i] : ' '}</span>
              <Missed part={stats.parts[i]} students={students} small />
            </li>
          ))}
        </ul>
      );
    case 'reorder':
      return (
        <>
          <div className="qz-tiles">{(q.tiles || []).map((t, i) => <span key={i} className="qz-tile">{t}</span>)}</div>
          {shown && <p className="qa-answer"><Icon name="check" size={14} /> {answer[0]}</p>}
        </>
      );
    case 'short':
      return shown ? <p className="qa-answer"><Icon name="check" size={14} /> {answer[0]}</p> : null;
    default:
      return <p className="qa-note">Open answer: marked by the teacher.</p>;
  }
}

export default function QuizAnalysis({ a, onClose }) {
  const ref = useRef(null);
  const [order, setOrder] = useState('order');
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const stats = useMemo(() => analyzeQuiz(a.payload, a.quizKey, a.submissions), [a]);
  const nums = useMemo(() => numbering(a.payload), [a.payload]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !document.fullscreenElement) onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const all = a.payload.sections.flatMap((s) => s.questions.map((q) => ({ q, section: s })));
  const hard = all.filter(({ q }) => q.type !== 'open' && stats.questions[q.id].rate >= 0.5).length;
  const list = order === 'hard'
    ? [...all].filter(({ q }) => q.type !== 'open').sort((x, y) => stats.questions[y.q.id].rate - stats.questions[x.q.id].rate || nums[x.q.id].from - nums[y.q.id].from)
    : all;
  const toggle = (id) => setRevealed((r) => { const n = new Set(r); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else ref.current?.requestFullscreen?.().catch(() => {});
  };

  const row = ({ q, section }, i, arr) => {
    const st = stats.questions[q.id];
    const shown = showAll || revealed.has(q.id);
    const multi = q.type === 'gap' ? q.gaps > 1 : q.type === 'match';
    const head = order === 'order' ? (i === 0 || arr[i - 1].section.id !== section.id) : false;
    const n = nums[q.id];
    return (
      <React.Fragment key={q.id}>
        {head && (section.title || section.instructions) && (
          <header className="qa-sec"><span>{section.title}</span>{section.instructions}</header>
        )}
        <div className={`qa-q is-${q.type === 'open' ? 'none' : level(st.rate)}`}>
          <div className="qa-num">{n.from === n.to ? n.from : `${n.from}–${n.to}`}</div>
          <div className="qa-body">
            {order === 'hard' && section.title && <span className="qa-from">Section {section.title}</span>}
            {q.prompt && <p className="qa-prompt hub-pre">{q.prompt}</p>}
            {q.image && <img className="qz-image" src={q.image} alt="Task visual" />}
            <Body q={q} k={a.quizKey?.[q.id]} stats={st} students={stats.students} num={n} shown={shown} />
            {q.type !== 'open' && <WrongAnswers stats={st} multi={multi} from={n.from} />}
          </div>
          <div className="qa-side">
            {q.type !== 'open' && (
              <span className={`qa-count is-${level(st.rate)}`}>
                <strong>{st.wrong}</strong><small>of {stats.students} missed</small>
              </span>
            )}
            {q.type !== 'open' && !showAll && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggle(q.id)}>
                <Icon name="eye" size={14} /> {shown ? 'Hide' : 'Answer'}
              </button>
            )}
          </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="qa" ref={ref} role="dialog" aria-label={`Analysis: ${a.title}`}>
      <header className="qa-bar">
        <div className="qa-title">
          <strong>{a.title}</strong>
          <span>
            {stats.students} submitted · class average {stats.average}%
            {hard > 0 && ` · ${hard} question${hard === 1 ? '' : 's'} missed by half the class or more`}
          </span>
        </div>
        <Seg label="Order" value={order} onChange={setOrder} options={[{ value: 'order', label: 'In order' }, { value: 'hard', label: 'Most missed first' }]} />
        <label className="qa-toggle"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show all answers</label>
        <button type="button" className="hub-icon-btn" onClick={fullscreen} aria-label="Full screen" title="Full screen"><Icon name="layout" size={18} /></button>
        <button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close" title="Close"><Icon name="close" size={18} /></button>
      </header>
      <div className="qa-scroll">
        {stats.students === 0
          ? <p className="qa-empty">Nobody has submitted this quiz yet.</p>
          : <div className="qa-list">{list.map(row)}</div>}
      </div>
    </div>
  );
}
