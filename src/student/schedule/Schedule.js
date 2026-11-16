import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { useHub, useAsync, Loaded, EmptyPanel, PageTitle, ErrorNote } from '../ui';
import { confirmDialog } from '../dialog';
import {
  DAYS, PERIODS, KINDS, SPAN_LABEL, MAX_SPAN, LUNCH_COLUMN,
  periodColumn, periodStart, slotTitle, slotTime, layoutDay, freePeriods,
  planMove, planResize, summarize, clash, fits, nowMarker,
} from './timetable';
import './schedule.css';

// Student Hub → Schedule. Teachers edit their week (drag to move / swap,
// Alt-drag to copy, drag the right edge to resize, click to edit or add).
// Students see the blocks of the classes they're in, read-only.

export default function Schedule() {
  const { user, isTeacher } = useHub();
  return isTeacher ? <TeacherSchedule uid={user.id} /> : <StudentSchedule />;
}

function StudentSchedule() {
  const { preview } = useHub();
  const state = useAsync(() => api.classSchedule(), [preview]);
  return (
    <>
      <PageTitle title="Schedule" lead="Your lessons and office hours this week." />
      <Loaded state={state}>
        {(slots) => (slots.length ? (
          <>
            <Summary slots={slots} />
            <Grid slots={slots} />
            <Legend slots={slots} />
          </>
        ) : (
          <EmptyPanel icon="calendar" title="No timetable yet" lead="Your teacher hasn't put your class on the schedule yet." />
        ))}
      </Loaded>
    </>
  );
}

function TeacherSchedule({ uid }) {
  const state = useAsync(() => Promise.all([api.teacherSchedule(uid), api.teacherClasses(uid)]), [uid]);
  return (
    <Loaded state={state}>
      {([slots, classes]) => <Editor initial={slots} classes={classes} />}
    </Loaded>
  );
}

function Editor({ initial, classes }) {
  const [slots, setSlots] = useState(initial);
  const [editing, setEditing] = useState(null);
  const [status, setStatus] = useState(null); // { text, error?, undo? }
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = useCallback((next) => {
    clearTimeout(timer.current);
    setStatus(next);
    timer.current = setTimeout(() => setStatus(null), next.undo ? 8000 : 4000);
  }, []);

  const placeMoves = (list, moves) => list.map((s) => {
    const m = moves.find((x) => x.id === s.id);
    return m ? { ...s, day: m.day, period: m.period, span: m.span ?? s.span } : s;
  });

  const runMoves = async (moves, label, withUndo = true) => {
    const before = slots;
    const undo = moves.map((m) => {
      const s = before.find((x) => x.id === m.id);
      return { id: s.id, day: s.day, period: s.period, span: s.span };
    });
    setSlots((list) => placeMoves(list, moves));
    try {
      await api.moveScheduleSlots(moves);
      flash({ text: label, undo: withUndo ? () => runMoves(undo, 'Undone.', false) : null });
    } catch (err) {
      setSlots(before);
      flash({ text: err.message || 'Could not save.', error: true });
    }
  };

  const apply = async (plan, slot) => {
    if (plan.error) { flash({ text: plan.error, error: true }); return; }
    if (plan.copy) {
      try {
        const { id, ...copy } = plan.copy;
        const row = await api.saveScheduleSlot(copy);
        setSlots((list) => [...list, row]);
        flash({ text: `Copied ${slotTitle(slot)}.` });
      } catch (err) { flash({ text: err.message || 'Could not copy.', error: true }); }
      return;
    }
    if (!plan.moves.length) return;
    const label = plan.swapped ? `Swapped with ${slotTitle(plan.swapped)}.`
      : plan.moves[0].span ? `${slotTitle(slot)} is now a ${SPAN_LABEL[plan.moves[0].span]}.`
        : `Moved ${slotTitle(slot)}.`;
    runMoves(plan.moves, label);
  };

  const lastClass = slots.find((s) => s.class_id)?.class_id || classes[0]?.id || null;
  const add = (day = 1, period = 1) => setEditing({
    kind: guessKind(classes.find((c) => c.id === lastClass)), class_id: lastClass, day, period, span: 1, pending: false, note: '', title: '',
  });

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Schedule"
        lead="Drag a lesson to move it; drop it on another to swap, or hold Alt (Option) to copy. Drag its right edge to change the length. Students only see their own classes.">
        <button type="button" className="btn btn-primary" onClick={() => add()}><Icon name="plus" size={16} /> Add lesson</button>
      </PageTitle>
      <Summary slots={slots} teacher />
      <Grid slots={slots} editable onOpen={setEditing} onAdd={add} onApply={apply} />
      <Legend slots={slots} teacher />
      {status && (
        <div className={`sch-status${status.error ? ' is-error' : ''}`} role="status">
          <span>{status.text}</span>
          {status.undo && <button type="button" onClick={() => { const u = status.undo; setStatus(null); u(); }}>Undo</button>}
        </div>
      )}
      {editing && (
        <SlotDialog draft={editing} classes={classes} slots={slots}
          onClose={() => setEditing(null)}
          onSaved={(row) => {
            setSlots((list) => (list.some((s) => s.id === row.id) ? list.map((s) => (s.id === row.id ? row : s)) : [...list, row]));
            setEditing(null);
          }}
          onDeleted={(id) => { setSlots((list) => list.filter((s) => s.id !== id)); setEditing(null); flash({ text: 'Deleted.' }); }} />
      )}
    </>
  );
}

const guessKind = (cls) => {
  const name = (cls?.name || '').toLowerCase();
  if (name.includes('sat')) return 'sat';
  if (name.includes('ielts')) return 'ielts';
  return 'sat';
};

// ── Summary cards ────────────────────────────────────────────────────────────
function Summary({ slots, teacher }) {
  const sum = useMemo(() => summarize(slots), [slots]);
  if (!sum.total) return null;
  return (
    <div className="sch-cards">
      {sum.cards.map((c) => (
        <div key={c.key} className={`sch-card sch-card--${c.kind}`}>
          <span className="sch-card-label">{c.className ? `${c.label} · ${c.className}` : c.label}</span>
          <strong>{c.periods}</strong>
          <small>{c.detail}{teacher && c.pending ? ` · ${c.pending} awaiting approval` : ''}</small>
        </div>
      ))}
      <div className="sch-card">
        <span className="sch-card-label">Total</span>
        <strong>{sum.total}</strong>
        <small>{sum.finish ? `done by ${sum.finish} daily` : ''}</small>
      </div>
    </div>
  );
}

function Legend({ slots, teacher }) {
  const kinds = ['sat', 'ielts', 'office', 'other'].filter((k) => k !== 'other' || slots.some((s) => s.kind === 'other'));
  return (
    <div className="sch-legend">
      {kinds.map((k) => <span key={k}><i className={`sch-swatch sch-${k}`} />{KINDS[k].label}</span>)}
      {slots.some((s) => s.pending) && <span><i className="sch-swatch is-pending" />{teacher ? 'Needs the school’s approval' : 'To be confirmed'}</span>}
      <span><i className="sch-swatch is-free" />Free</span>
    </div>
  );
}

// ── Week grid ────────────────────────────────────────────────────────────────
function Grid({ slots, editable = false, onOpen, onAdd, onApply }) {
  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClick = useRef(false);
  const [drag, setDrag] = useState(null); // { id, preview, plan, label }
  const now = nowMarker();

  let next = 2;
  const days = DAYS.map((d) => {
    const lay = layoutDay(slots.filter((s) => s.day === d.day));
    const row = next;
    next += lay.lanes;
    return { ...d, row, ...lay };
  });
  const lastRow = next;

  const cellAt = (x, y) => {
    const grid = gridRef.current;
    if (!grid) return null;
    const inside = (el, axis) => {
      const r = el.getBoundingClientRect();
      return axis === 'x' ? x >= r.left && x < r.right : y >= r.top && y < r.bottom;
    };
    const head = [...grid.querySelectorAll('[data-col-period]')];
    const col = head.find((el) => inside(el, 'x'));
    const dayEl = [...grid.querySelectorAll('[data-row-day]')].find((el) => inside(el, 'y'));
    if (!dayEl) return null;
    let period = col ? Number(col.dataset.colPeriod) : null;
    if (period == null) {
      // Between columns (gaps, lunch): snap to the nearest period.
      let best = Infinity;
      head.forEach((el) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(x - (r.left + r.width / 2));
        if (dist < best) { best = dist; period = Number(el.dataset.colPeriod); }
      });
    }
    return { day: Number(dayEl.dataset.rowDay), period };
  };

  // Pointer-driven drag so it works with mouse, pen and touch alike.
  useEffect(() => {
    if (!editable) return undefined;
    const plan = (d, e) => {
      const cell = cellAt(e.clientX, e.clientY);
      const slot = slots.find((s) => s.id === d.id);
      if (!cell || !slot) return null;
      if (d.mode === 'resize') {
        const p = planResize(slots, slot, cell.period);
        const span = Math.max(1, Math.min(MAX_SPAN, cell.period - slot.period + 1));
        return { plan: p, preview: { day: slot.day, period: slot.period, span } };
      }
      const period = cell.period - d.grab;
      const p = planMove(slots, slot, cell.day, period, { copy: e.altKey });
      return { plan: p, preview: { day: cell.day, period, span: slot.span } };
    };
    const move = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      if (!d.started) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return;
        d.started = true;
      }
      e.preventDefault();
      const res = plan(d, e);
      d.last = res;
      setDrag(res ? { id: d.id, mode: d.mode, ...res } : { id: d.id, mode: d.mode });
    };
    const up = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      setDrag(null);
      if (!d.started) return;
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      const res = plan(d, e) || d.last;
      const slot = slots.find((s) => s.id === d.id);
      if (res && slot) onApply(res.plan, slot);
    };
    const cancel = () => { dragRef.current = null; setDrag(null); };
    const key = (e) => { if (e.key === 'Escape' && dragRef.current) cancel(); };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, slots, onApply]);

  const startDrag = (e, slot, mode) => {
    if (!editable || e.button !== 0) return;
    e.stopPropagation();
    const cell = cellAt(e.clientX, e.clientY);
    dragRef.current = {
      id: slot.id, mode, x: e.clientX, y: e.clientY, pointerId: e.pointerId, started: false,
      grab: cell ? Math.max(0, Math.min(slot.span - 1, cell.period - slot.period)) : 0,
    };
  };

  const col = (period, span) => `${periodColumn(period)} / ${periodColumn(period + span - 1) + 1}`;
  const dayRow = (day) => days.find((d) => d.day === day);
  const ghost = drag && drag.preview && dayRow(drag.preview.day) && fits(drag.preview) ? drag.preview : null;
  const ghostDay = ghost && dayRow(ghost.day);
  const ghostText = drag?.plan && (drag.plan.error
    || (drag.plan.copy ? 'Copy here' : drag.plan.swapped ? `Swap with ${slotTitle(drag.plan.swapped)}` : slotTime(ghost)));

  return (
    <div className="sch-scroll">
      <div className={`sch-grid${editable ? ' is-editable' : ''}${drag ? ' is-dragging' : ''}`} ref={gridRef}>
        {PERIODS.map((p) => (
          <div key={p.period} className={`sch-head${now?.period === p.period ? ' is-now' : ''}`} data-col-period={p.period} style={{ gridColumn: periodColumn(p.period), gridRow: 1 }}>
            <b>{p.period}</b><small>{p.start}</small>
          </div>
        ))}
        <div className="sch-lunch" style={{ gridColumn: LUNCH_COLUMN, gridRow: `2 / ${lastRow}` }} aria-hidden="true"><span>Lunch</span></div>

        {days.map((d) => (
          <React.Fragment key={d.day}>
            <div className={`sch-day${now?.day === d.day ? ' is-today' : ''}`} data-row-day={d.day} style={{ gridRow: `${d.row} / span ${d.lanes}` }}>
              <span title={d.long}>{d.short}</span>
            </div>
            {freePeriods(slots, d.day).map((p) => (editable ? (
              <button key={`f${p}`} type="button" className="sch-free" style={{ gridColumn: col(p, 1), gridRow: `${d.row} / span ${d.lanes}` }}
                onClick={() => onAdd(d.day, p)} aria-label={`Add a lesson on ${d.long}, period ${p} (${periodStart(p)})`}>
                <Icon name="plus" size={14} />
              </button>
            ) : (
              <div key={`f${p}`} className="sch-free" style={{ gridColumn: col(p, 1), gridRow: `${d.row} / span ${d.lanes}` }} />
            )))}
            {d.placed.map(({ slot: s, lane }) => {
              const live = now && now.day === s.day && now.period >= s.period && now.period < s.period + s.span;
              const sub = [
                s.kind !== 'blocked' && s.class_name,
                s.span > 1 && s.kind !== 'blocked' && SPAN_LABEL[s.span],
                editable ? s.note : s.pending && 'to be confirmed',
              ].filter(Boolean).join(' · ');
              const cls = `sch-slot sch-${s.kind}${s.pending ? ' is-pending' : ''}${live ? ' is-now' : ''}${drag?.id === s.id ? ' is-lifted' : ''}`;
              const style = { gridColumn: col(s.period, s.span), gridRow: d.lanes > 1 ? d.row + lane : `${d.row} / span ${d.lanes}` };
              const label = `${slotTitle(s)}${s.class_name ? `, ${s.class_name}` : ''}, ${DAYS[s.day - 1].long} ${slotTime(s)}`;
              const body = (
                <>
                  <strong>{slotTitle(s)}</strong>
                  {sub && <small>{sub}</small>}
                </>
              );
              if (!editable) return <div key={s.id} className={cls} style={style} title={label}>{body}</div>;
              return (
                <button key={s.id} type="button" className={cls} style={style} aria-label={`${label}. Edit`}
                  onPointerDown={(e) => startDrag(e, s, 'move')}
                  onClick={() => { if (!suppressClick.current) onOpen(s); }}>
                  {body}
                  <span className="sch-resize" onPointerDown={(e) => startDrag(e, s, 'resize')} aria-hidden="true" />
                </button>
              );
            })}
          </React.Fragment>
        ))}

        {ghost && (
          <div className={`sch-ghost${drag.plan?.error ? ' is-bad' : ''}`}
            style={{ gridColumn: col(ghost.period, ghost.span), gridRow: `${ghostDay.row} / span ${ghostDay.lanes}` }}>
            <span>{ghostText}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add / edit dialog ────────────────────────────────────────────────────────
const KIND_ORDER = ['sat', 'ielts', 'office', 'other', 'blocked'];

function SlotDialog({ draft, classes, slots, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({ ...draft, title: draft.title || '', note: draft.note || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const boxRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const prev = document.activeElement;
    boxRef.current?.querySelector('[data-autofocus]')?.focus();
    return () => prev?.focus?.();
  }, []);

  const needsTitle = form.kind === 'other' || form.kind === 'blocked';
  const needsClass = form.kind !== 'blocked';
  const taken = clash(slots, form, form.id ? [form.id] : []);
  const problem = !fits(form) ? 'That runs past the last period.'
    : taken ? `That overlaps ${slotTitle(taken)} (${slotTime(taken)}).`
      : needsClass && !form.class_id ? 'Choose a class.'
        : needsTitle && !form.title.trim() ? 'Give it a name.' : null;

  const save = async (e) => {
    e.preventDefault();
    if (problem) return;
    setBusy(true); setError(null);
    try { onSaved(await api.saveScheduleSlot(form)); }
    catch (err) { setError(err); setBusy(false); }
  };
  const remove = async () => {
    if (!(await confirmDialog({ title: `Delete ${slotTitle(form)}?`, body: `${DAYS[form.day - 1].long}, ${slotTime(form)}.`, confirmLabel: 'Delete', danger: true }))) return;
    setBusy(true);
    try { await api.deleteScheduleSlot(form.id); onDeleted(form.id); }
    catch (err) { setError(err); setBusy(false); }
  };

  return (
    <div className="hub-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="hub-dialog sch-dialog" role="dialog" aria-modal="true" aria-labelledby="sch-dialog-title" ref={boxRef}
        onSubmit={save} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}>
        <h2 id="sch-dialog-title">{form.id ? 'Edit lesson' : 'Add lesson'}</h2>

        <div className="sch-field">
          <span className="form-label">Type</span>
          <div className="hub-seg" role="radiogroup" aria-label="Type">
            {KIND_ORDER.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={form.kind === k} className={form.kind === k ? 'is-selected' : ''}
                data-autofocus={form.kind === k ? true : undefined}
                onClick={() => set({ kind: k, class_id: k === 'blocked' ? null : (form.class_id || classes[0]?.id || null) })}>
                {KINDS[k].label}
              </button>
            ))}
          </div>
        </div>

        {needsClass && (
          <label className="sch-field">
            <span className="form-label">Class</span>
            {classes.length ? (
              <select className="form-select" value={form.class_id || ''} onChange={(e) => set({ class_id: e.target.value || null })}>
                {!form.class_id && <option value="">Choose a class</option>}
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : <small className="sch-hint">Create a class first (Teaching → Classes).</small>}
          </label>
        )}

        {needsTitle && (
          <label className="sch-field">
            <span className="form-label">Name</span>
            <input className="form-input" value={form.title} maxLength={40} onChange={(e) => set({ title: e.target.value })}
              placeholder={form.kind === 'blocked' ? 'e.g. Prayer time' : 'e.g. Speaking club'} />
          </label>
        )}

        <div className="sch-row">
          <label className="sch-field">
            <span className="form-label">Day</span>
            <select className="form-select" value={form.day} onChange={(e) => set({ day: Number(e.target.value) })}>
              {DAYS.map((d) => <option key={d.day} value={d.day}>{d.long}</option>)}
            </select>
          </label>
          <label className="sch-field">
            <span className="form-label">Starts</span>
            <select className="form-select" value={form.period} onChange={(e) => {
              const period = Number(e.target.value);
              set({ period, span: Math.min(form.span, PERIODS.length - period + 1) });
            }}>
              {PERIODS.map((p) => <option key={p.period} value={p.period}>{`Period ${p.period} · ${p.start}`}</option>)}
            </select>
          </label>
          <label className="sch-field">
            <span className="form-label">Length</span>
            <select className="form-select" value={form.span} onChange={(e) => set({ span: Number(e.target.value) })}>
              {[1, 2, 3].filter((n) => form.period + n - 1 <= PERIODS.length).map((n) => (
                <option key={n} value={n}>{`${SPAN_LABEL[n][0].toUpperCase()}${SPAN_LABEL[n].slice(1)}`}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="sch-field">
          <span className="form-label">Note <small>(only you see this)</small></span>
          <input className="form-input" value={form.note} maxLength={60} onChange={(e) => set({ note: e.target.value })} placeholder="e.g. HQ swap" />
        </label>

        <label className="sch-check">
          <input type="checkbox" checked={form.pending} onChange={(e) => set({ pending: e.target.checked })} />
          <span>Needs the school’s approval <small>Students see it as “to be confirmed”.</small></span>
        </label>

        {problem && <div className="sch-problem">{problem}</div>}
        {error && <ErrorNote error={error} />}

        <div className="hub-dialog-actions">
          {form.id && <button type="button" className="btn btn-ghost sch-delete" onClick={remove} disabled={busy}><Icon name="trash" size={15} /> Delete</button>}
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy || Boolean(problem)}>{form.id ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}
