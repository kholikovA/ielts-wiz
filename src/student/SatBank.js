import React, { useMemo, useRef, useState } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub, useAsync, Loaded, PageTitle, Seg, ErrorNote, EmptyPanel, PersonName, toLocalInput, HubLink } from './ui';
import { confirmDialog } from './dialog';
import MathText from './quiz/MathText';
import { splitTest } from './quiz/quiz';
import { SAT_TESTS, SAT_DOMAINS, DIFFICULTIES, bankToQuiz, usedBankIds, satPaceMinutes } from './quiz/satbank';

// Teaching → Question bank: every SAT question imported from the College Board
// question bank exports, filtered like the College Board's own tool (test, domain,
// skill, difficulty), looked up by Question ID, and assigned as SAT-style quizzes.

const PAGE = 60;
const LETTERS = 'ABCD';

const parseIds = (s) => [...new Set(String(s).toLowerCase().split(/[^0-9a-z]+/).filter((x) => x.length >= 6))];

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── Teacher view of one question (with the answer and explanation) ────────────
export function BankQuestion({ row, used }) {
  const q = useMemo(() => bankToQuiz(row, api.satImageUrl), [row]);
  return (
    <div className="bank-q">
      {q.passage && <MathText block text={q.passage} className="bank-passage" />}
      {q.prompt && <MathText block text={q.prompt} className="bank-prompt" />}
      {row.type === 'mcq' ? (
        <ol className="bank-opts">
          {q.options.map((o, i) => (
            <li key={i} className={i === row.key.answer ? 'is-key' : ''}><b>{LETTERS[i]}</b><MathText text={o} /></li>
          ))}
        </ol>
      ) : (
        <p className="bank-spr"><strong>Correct answers:</strong> {(row.key.accepted || []).join(', ')}</p>
      )}
      <details className="bank-why">
        <summary>Explanation</summary>
        <MathText block text={q.explanation} />
      </details>
      {used?.length > 0 && <p className="bank-used"><Icon name="clipboard" size={13} /> Assigned in: {used.join(' · ')}</p>}
    </div>
  );
}

// ── Import a package (bank.json + img/*.png) made from College Board exports ──
function ImportPanel({ onDone, onClose }) {
  const [state, setState] = useState(null); // { phase, done, total, msg }
  const [error, setError] = useState(null);
  const run = async (files) => {
    setError(null);
    try {
      const list = [...files];
      const jsonFile = list.find((f) => f.name === 'bank.json');
      if (!jsonFile) throw new Error('Choose the folder that contains bank.json (and the img folder).');
      const pkg = JSON.parse(await jsonFile.text());
      const rows = pkg.questions || [];
      const pngs = list.filter((f) => /\.png$/i.test(f.name));
      setState({ phase: 'Checking images already uploaded…', done: 0, total: pngs.length });
      const have = await api.satImageNames();
      const todo = pngs.filter((f) => !have.has(f.name));
      let done = pngs.length - todo.length;
      setState({ phase: 'Uploading images', done, total: pngs.length });
      let next = 0;
      const worker = async () => {
        while (next < todo.length) {
          const f = todo[next]; next += 1;
          // eslint-disable-next-line no-await-in-loop
          await api.uploadSatImage(f.name, f);
          done += 1;
          if (done % 10 === 0 || done === pngs.length) setState({ phase: 'Uploading images', done, total: pngs.length });
        }
      };
      await Promise.all(Array.from({ length: 6 }, worker));
      setState({ phase: 'Saving questions', done: 0, total: rows.length });
      await api.upsertSatQuestions(rows);
      setState({ phase: `Done: ${rows.length} questions, ${todo.length} new images.`, done: rows.length, total: rows.length, finished: true });
      onDone();
    } catch (e) { setError(e); }
  };
  return (
    <div className="card bank-import">
      <div className="hub-section-head"><h2 className="h3">Import questions</h2><button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button></div>
      <p className="body">Choose the <strong>sat-question-bank</strong> folder (it holds <code>bank.json</code> and an <code>img</code> folder). Questions are matched by Question ID: new IDs are added, existing ones are updated. You can run it again any time; images already uploaded are skipped.</p>
      {!state && <input type="file" webkitdirectory="" directory="" multiple onChange={(e) => e.target.files?.length && run(e.target.files)} />}
      {state && (
        <div className="bank-progress">
          <span>{state.phase}</span>
          {!state.finished && state.total > 0 && <span className="hub-bar hub-bar--wide"><span style={{ width: `${(state.done / state.total) * 100}%` }} /></span>}
          {!state.finished && state.total > 0 && <small className="hub-num">{state.done} / {state.total}</small>}
        </div>
      )}
      {error && <ErrorNote error={error} />}
    </div>
  );
}

// ── Create SAT quizzes from the selection ──────────────────────────────────────
function CreatePanel({ rows, test, roster, recipients, setRecipients, onCreated, onClose }) {
  const { user } = useHub();
  const [title, setTitle] = useState('');
  const [partSize, setPartSize] = useState(Math.min(20, rows.length));
  const [order, setOrder] = useState('difficulty');
  const [attempts, setAttempts] = useState(1);
  const [timing, setTiming] = useState('pace');
  const [minutes, setMinutes] = useState(30);
  const [due, setDue] = useState('');
  const [publishMode, setPublishMode] = useState('now');
  const [publishAt, setPublishAt] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return toLocalInput(d); });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const size = Math.max(1, Math.min(rows.length, Number(partSize) || rows.length));
  const parts = Math.ceil(rows.length / size);
  const { target, classId, picked } = recipients;
  const ids = target === 'class' ? roster.students.filter((s) => s.classIds.includes(classId)).map((s) => s.id) : [...picked];

  const create = async () => {
    setError(null);
    if (!title.trim()) { setError({ message: 'Add a title.' }); return; }
    if (target === 'class' && !classId) { setError({ message: 'Pick a class.' }); return; }
    if (!ids.length && target !== 'class') { setError({ message: 'Pick at least one student.' }); return; }
    const rank = { Easy: 0, Medium: 1, Hard: 2 };
    const ordered = order === 'difficulty' ? [...rows].sort((a, b) => rank[a.difficulty] - rank[b.difficulty]) : order === 'random' ? shuffled(rows) : rows;
    setBusy(true);
    try {
      for (let p = 0; p < parts; p += 1) {
        const chunk = ordered.slice(p * size, (p + 1) * size);
        const { payload, key } = splitTest({ style: 'sat', sections: [{ id: 'sat', title: '', instructions: '', questions: chunk.map((r) => bankToQuiz(r, api.satImageUrl)) }] });
        payload.subject = test;
        payload.max_attempts = Number(attempts) || 1;
        payload.time_limit_min = timing === 'none' ? 0 : timing === 'custom' ? Number(minutes) || 0 : satPaceMinutes(chunk.length, test);
        const name = parts > 1 ? `${title.trim()} [Part ${p + 1}]` : title.trim();
        const skills = [...new Set(chunk.map((r) => r.skill))];
        // eslint-disable-next-line no-await-in-loop
        await api.createAssignment({
          kind: 'quiz', title: name,
          instructions: `SAT ${SAT_TESTS[test]} · ${skills.join('; ')}. ${chunk.length} questions${payload.time_limit_min ? `, ${payload.time_limit_min} minutes` : ''}${payload.max_attempts > 1 ? `, ${payload.max_attempts} attempts` : ''}. Correct answers and explanations open in Review and analyze on your results page.`,
          payload, class_id: target === 'class' ? classId : null,
          due_at: due ? new Date(due).toISOString() : null,
          publish_at: publishMode === 'later' ? new Date(publishAt).toISOString() : new Date().toISOString(),
        }, ids, (created) => api.saveQuizKey(created.id, key));
      }
      onCreated(parts);
    } catch (e) { setError(e); setBusy(false); }
  };

  return (
    <div className="card bank-create">
      <div className="hub-section-head"><h2 className="h3">Assign {rows.length} question{rows.length === 1 ? '' : 's'}</h2><button type="button" className="hub-icon-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button></div>
      <div className="bank-form">
        <label className="form-field"><span className="form-label">Title</span>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Algebra Medium" /></label>
        <label className="form-field"><span className="form-label">Questions per quiz</span>
          <input className="form-input" type="number" min="1" max={rows.length} value={partSize} onChange={(e) => setPartSize(e.target.value)} />
          <small className="form-help">{parts > 1 ? `${parts} quizzes, named "${title.trim() || 'Title'} [Part 1]"…` : 'One quiz'}</small></label>
        <label className="form-field"><span className="form-label">Order</span>
          <select className="form-select" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="difficulty">Easy → Hard</option><option value="random">Random</option><option value="list">As listed</option>
          </select></label>
        <label className="form-field"><span className="form-label">Attempts allowed</span>
          <select className="form-select" value={attempts} onChange={(e) => setAttempts(e.target.value)}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {Number(attempts) > 1 && <small className="form-help">Answers and explanations open only after the last attempt (or if the student chooses to see them early, which ends their attempts).</small>}</label>
        <label className="form-field"><span className="form-label">Timer</span>
          <select className="form-select" value={timing} onChange={(e) => setTiming(e.target.value)}>
            <option value="pace">SAT pace ({satPaceMinutes(size, test)} min for {size})</option><option value="custom">Custom</option><option value="none">No timer</option>
          </select>
          {timing === 'custom' && <input className="form-input" type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Minutes" />}</label>
        <label className="form-field"><span className="form-label">Due (optional)</span>
          <input className="form-input" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        <div className="form-field"><span className="form-label">Publish</span>
          <Seg label="Publish" value={publishMode} onChange={setPublishMode} options={[{ value: 'now', label: 'Now' }, { value: 'later', label: 'Schedule' }]} />
          {publishMode === 'later' && <input className="form-input" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />}</div>
      </div>
      <RecipientPicker roster={roster} value={recipients} onChange={setRecipients} />
      {error && <ErrorNote error={error} />}
      <div className="hub-actions">
        <button type="button" className="btn btn-primary" disabled={busy || !user} onClick={create}>
          {busy ? 'Creating…' : parts > 1 ? `Create ${parts} quizzes` : 'Create quiz'}
        </button>
      </div>
    </div>
  );
}

function RecipientPicker({ roster, value, onChange }) {
  const { target, classId, picked } = value;
  return (
    <div className="form-field">
      <span className="form-label">Assign to</span>
      <div className="hub-tabs">
        <button type="button" className={`chip${target === 'class' ? ' is-selected' : ''}`} onClick={() => onChange({ ...value, target: 'class' })}>A class</button>
        <button type="button" className={`chip${target === 'students' ? ' is-selected' : ''}`} onClick={() => onChange({ ...value, target: 'students' })}>Specific students</button>
      </div>
      {target === 'class' ? (
        <select className="form-select" value={classId} onChange={(e) => onChange({ ...value, classId: e.target.value })} aria-label="Class">
          <option value="">Choose a class…</option>
          {roster.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      ) : (
        <div className="hub-picklist">
          {roster.students.map((s) => (
            <label key={s.id} className="hub-pick">
              <input type="checkbox" checked={picked.has(s.id)} onChange={() => {
                const n = new Set(picked); if (n.has(s.id)) n.delete(s.id); else n.add(s.id);
                onChange({ ...value, picked: n });
              }} />
              <PersonName person={s} />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SatBank() {
  const { user } = useHub();
  const data = useAsync(async () => {
    const [rows, roster, assignments] = await Promise.all([api.satQuestions(), api.teacherStudents(user.id), api.teacherAssignments(user.id)]);
    return { rows, roster, assignments };
  }, [user.id]);
  const [test, setTest] = useState('math');
  const [domains, setDomains] = useState(new Set());
  const [skills, setSkills] = useState(new Set());
  const [diffs, setDiffs] = useState(new Set());
  const [type, setType] = useState('all');
  const [idQuery, setIdQuery] = useState('');
  const [recipients, setRecipients] = useState({ target: 'class', classId: '', picked: new Set() });
  const [exclude, setExclude] = useState('assigned');
  const [selected, setSelected] = useState(new Set());
  const [open, setOpen] = useState(new Set());
  const [shown, setShown] = useState(PAGE);
  const [panel, setPanel] = useState(null);
  const [notice, setNotice] = useState(null);
  const [randomN, setRandomN] = useState(20);
  const top = useRef(null);

  const toggle = (set, setSet, v) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); setSet(n); setShown(PAGE); };

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Question bank" lead="SAT questions from the College Board question bank. Filter, look up a Question ID, and assign them as SAT-style quizzes.">
        <button type="button" className="btn btn-sm" onClick={() => setPanel(panel === 'import' ? null : 'import')}><Icon name="upload" size={14} /> Import</button>
      </PageTitle>
      {panel === 'import' && <ImportPanel onClose={() => setPanel(null)} onDone={() => data.reload()} />}
      <Loaded state={data}>
        {({ rows, roster, assignments }) => {
          if (!rows.length) {
            return <EmptyPanel icon="layers" title="No questions yet" lead="Import the sat-question-bank folder to add the College Board questions." />;
          }
          const ids = parseIds(idQuery);
          const studentIds = recipients.target === 'class'
            ? roster.students.filter((s) => s.classIds.includes(recipients.classId)).map((s) => s.id)
            : [...recipients.picked];
          const used = exclude !== 'none' && studentIds.length ? usedBankIds(assignments, studentIds, exclude) : new Set();
          const usedIn = (id) => assignments.filter((a) => a.kind === 'quiz' && (a.payload?.sections || []).some((s) => s.questions.some((q) => q.bank?.id === id || q.id === `q${id}`))).map((a) => a.title);
          const counts = { math: 0, rw: 0 };
          rows.forEach((r) => { counts[r.test] += 1; });
          const list = ids.length
            ? rows.filter((r) => ids.includes(r.id))
            : rows.filter((r) => r.test === test
              && (!domains.size || domains.has(r.domain))
              && (!skills.size || skills.has(r.skill))
              && (!diffs.size || diffs.has(r.difficulty))
              && (type === 'all' || r.type === type)
              && !used.has(r.id));
          const missing = ids.filter((id) => !rows.some((r) => r.id === id));
          const chosen = rows.filter((r) => selected.has(r.id));
          const chosenTest = chosen[0]?.test || test;
          const mixed = new Set(chosen.map((r) => r.test)).size > 1;
          const doms = SAT_DOMAINS[test];
          return (
            <div className="bank" ref={top}>
              <aside className="card bank-filters">
                <div className="form-field">
                  <span className="form-label">Question ID</span>
                  <input className="form-input" value={idQuery} onChange={(e) => { setIdQuery(e.target.value); setShown(PAGE); }} placeholder="e.g. b86123af (several: separate by spaces)" spellCheck={false} />
                </div>
                <div className={ids.length ? 'bank-off' : ''}>
                  <Seg label="Test" value={test} onChange={(v) => { setTest(v); setDomains(new Set()); setSkills(new Set()); setShown(PAGE); }} options={[
                    { value: 'math', label: `Math (${counts.math})` }, { value: 'rw', label: `Reading & Writing (${counts.rw})` },
                  ]} />
                  <div className="bank-group">
                    <span className="form-label">Difficulty</span>
                    <div className="bank-chips">{DIFFICULTIES.map((d) => (
                      <button key={d} type="button" className={`chip${diffs.has(d) ? ' is-selected' : ''}`} onClick={() => toggle(diffs, setDiffs, d)}>{d}</button>
                    ))}</div>
                  </div>
                  {test === 'math' && (
                    <div className="bank-group">
                      <span className="form-label">Answer type</span>
                      <select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setShown(PAGE); }}>
                        <option value="all">All</option><option value="mcq">Multiple choice</option><option value="spr">Student-produced response</option>
                      </select>
                    </div>
                  )}
                  <div className="bank-group">
                    <span className="form-label">Domain and skill</span>
                    {Object.entries(doms).map(([d, sk]) => (
                      <div key={d} className="bank-domain">
                        <label className="bank-check"><input type="checkbox" checked={domains.has(d)} onChange={() => toggle(domains, setDomains, d)} /> <strong>{d}</strong>
                          <small>{rows.filter((r) => r.domain === d).length}</small></label>
                        <div className="bank-skills">
                          {sk.map((s) => (
                            <label key={s} className="bank-check"><input type="checkbox" checked={skills.has(s)} onChange={() => toggle(skills, setSkills, s)} /> {s}
                              <small>{rows.filter((r) => r.skill === s).length}</small></label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bank-group">
                  <span className="form-label">Hide questions already given to</span>
                  <RecipientPicker roster={roster} value={recipients} onChange={(v) => { setRecipients(v); setShown(PAGE); }} />
                  <select className="form-select" value={exclude} onChange={(e) => setExclude(e.target.value)} aria-label="Which questions to hide">
                    <option value="assigned">Hide questions assigned to them before</option>
                    <option value="submitted">Hide only questions they submitted</option>
                    <option value="none">Show everything</option>
                  </select>
                  {studentIds.length > 0 && exclude !== 'none' && <small className="form-help">{used.size} question{used.size === 1 ? '' : 's'} hidden for {studentIds.length} student{studentIds.length === 1 ? '' : 's'}.</small>}
                </div>
              </aside>

              <section className="bank-results">
                {notice && <div className="card bank-notice"><Icon name="checkCircle" size={16} /> {notice} <HubLink to="/teach/assignments">Open Assignments</HubLink></div>}
                {panel === 'create' && chosen.length > 0 && !mixed && (
                  <CreatePanel rows={chosen} test={chosenTest} roster={roster} recipients={recipients} setRecipients={setRecipients}
                    onClose={() => setPanel(null)}
                    onCreated={(n) => { setPanel(null); setSelected(new Set()); setNotice(`Created ${n} quiz${n === 1 ? '' : 'zes'}.`); data.reload(); }} />
                )}
                <div className="bank-bar">
                  <strong>{list.length} question{list.length === 1 ? '' : 's'}</strong>
                  {missing.length > 0 && <span className="hub-warn">Not in the bank: {missing.join(', ')}</span>}
                  <span className="bank-bar-spacer" />
                  <button type="button" className="btn btn-sm" onClick={() => setSelected(new Set([...selected, ...list.map((r) => r.id)]))} disabled={!list.length}>Select all</button>
                  <span className="bank-random">
                    <input className="form-input" type="number" min="1" value={randomN} onChange={(e) => setRandomN(e.target.value)} aria-label="How many" />
                    <button type="button" className="btn btn-sm" disabled={!list.length}
                      onClick={() => setSelected(new Set([...selected, ...shuffled(list.filter((r) => !selected.has(r.id))).slice(0, Number(randomN) || 0).map((r) => r.id)]))}>Pick random</button>
                  </span>
                  {selected.size > 0 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>Clear ({selected.size})</button>}
                </div>
                <div className="bank-list">
                  {list.slice(0, shown).map((r) => {
                    const isOpen = open.has(r.id) || ids.length > 0;
                    return (
                      <article key={r.id} className={`card bank-row${selected.has(r.id) ? ' is-selected' : ''}`}>
                        <div className="bank-row-head">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(selected, setSelected, r.id)} aria-label={`Select ${r.id}`} />
                          <code className="bank-id">{r.id}</code>
                          <span className={`pill bank-diff is-${r.difficulty.toLowerCase()}`}>{r.difficulty}</span>
                          <span className="bank-skill">{r.skill}</span>
                          {r.type === 'spr' && <span className="pill">SPR</span>}
                          {used.has(r.id) && <span className="pill pill-amber">Given before</span>}
                          <button type="button" className="btn btn-ghost btn-sm bank-toggle" onClick={() => toggle(open, setOpen, r.id)}>
                            {isOpen ? 'Hide' : 'Preview'}
                          </button>
                        </div>
                        {isOpen && <BankQuestion row={r} used={usedIn(r.id)} />}
                      </article>
                    );
                  })}
                </div>
                {list.length > shown && <button type="button" className="btn btn-block" onClick={() => setShown((n) => n + PAGE)}>Show more ({list.length - shown} left)</button>}
              </section>

              {selected.size > 0 && panel !== 'create' && (
                <div className="bank-dock">
                  <span><strong>{selected.size}</strong> selected{mixed ? ' (Math and Reading & Writing can\'t share a quiz)' : ''}</span>
                  <button type="button" className="btn btn-primary" disabled={mixed} onClick={async () => {
                    if (selected.size > 100 && !await confirmDialog({ title: `Assign ${selected.size} questions?`, body: 'They will be split into several quizzes.', confirmLabel: 'Continue' })) return;
                    setPanel('create'); setNotice(null); top.current?.scrollIntoView({ behavior: 'smooth' });
                  }}><Icon name="plus" size={16} /> Assign as quiz</button>
                </div>
              )}
            </div>
          );
        }}
      </Loaded>
    </>
  );
}
