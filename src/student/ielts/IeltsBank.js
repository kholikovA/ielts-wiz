import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/ui/icons';
import * as api from '../api';
import { useHub, useAsync, Loaded, PageTitle, Seg, ErrorNote, EmptyPanel, HubLink } from '../ui';
import { confirmDialog } from '../dialog';
import { BankPlayer } from './BankTestRoute';
import {
  SKILLS, bankCatalogEntry, validateSpec, normalizeSpec, allQuestionNumbers, groupNeedsImage,
  withGroupImage, keyText, setKey, cleanHtml, mergeParts,
} from './ielts';

// Teaching → Question bank → IELTS. Admins upload a test as a PDF or a saved web
// page; Claude (ielts-import edge function) turns it into the main site's test
// format. The admin checks it in the real player, adds audio/pictures and any
// missing answers, then saves it. Teachers browse, preview and assign.

// SAT / IELTS switch shown at the top of both question bank pages.
export function BankTabs({ active }) {
  const tabs = [{ key: 'sat', label: 'SAT', to: '/teach/bank' }, { key: 'ielts', label: 'IELTS', to: '/teach/bank/ielts' }];
  return (
    <nav className="hub-seg bank-tabs" aria-label="Question bank">
      {tabs.map((t) => (
        <HubLink key={t.key} to={t.to} className={active === t.key ? 'is-selected' : ''} aria-current={active === t.key ? 'page' : undefined}>{t.label}</HubLink>
      ))}
    </nav>
  );
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

// Full-screen preview in the real player. Nothing is recorded.
function Preview({ test, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return createPortal(
    <div className="ielts-preview" role="dialog" aria-modal="true" aria-label={`Preview: ${test.spec?.title || 'test'}`}>
      <div className="ielts-preview-bar">
        <span><Icon name="eye" size={14} /> Preview. Answers are marked but nothing is saved.</span>
        <button type="button" onClick={onClose}><Icon name="close" size={14} /> Close preview</button>
      </div>
      <div className="ielts-preview-body">
        <BankPlayer test={test} onExit={onClose} dryRun />
      </div>
    </div>,
    document.body,
  );
}

// ── Upload + convert ─────────────────────────────────────────────────────────
function ImportPanel({ onConverted, onClose }) {
  const [skill, setSkill] = useState('reading');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!busy) return undefined;
    setSeconds(0);
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [busy]);

  const convert = async () => {
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      const isHtml = /\.html?$/i.test(file.name) || file.type === 'text/html';
      // A test already converted (e.g. in Claude Code): no AI step, straight to checking.
      if (/\.json$/i.test(file.name) || file.type === 'application/json') {
        let spec;
        try { spec = JSON.parse(await file.text()); } catch { throw new Error("That JSON file couldn't be read."); }
        if (!spec || !Array.isArray(spec.parts)) throw new Error("That JSON file isn't a test (it has no parts).");
        const asSkill = spec.skill === 'listening' || spec.skill === 'reading' ? spec.skill : skill;
        onConverted({ skill: asSkill, spec: normalizeSpec(spec, asSkill), notes: [], source_name: file.name });
        return;
      }
      if (!isPdf && !isHtml) throw new Error('Choose a PDF, an HTML or a converted .json file.');
      if (isPdf && file.size > 25 * 1024 * 1024) throw new Error('The PDF is too large (25 MB at most).');
      const settled = await api.importIeltsFile(isPdf ? { skill, file } : { skill, html: cleanHtml(await file.text()) });
      const { spec, notes } = mergeParts(skill, file.name, settled);
      onConverted({ skill, spec: normalizeSpec(spec, skill), notes, source_name: file.name });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card ielts-import">
      <div className="hub-section-head"><h2 className="h3">Upload a test</h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
      </div>
      <p className="form-help" style={{ marginTop: 0 }}>
        A PDF of the test (with its answer key, and the audioscript for listening if you have it), or a test page saved as HTML.
        It is copied word for word into the site&apos;s test format. You check it before it&apos;s saved.
        A <strong>.json</strong> test that is already converted opens straight away, with no AI cost.
      </p>
      <div className="ielts-import-row">
        <Seg label="Skill" value={skill} onChange={setSkill} options={SKILLS.map((s) => ({ ...s, icon: s.value === 'reading' ? 'bookOpen' : 'headphones' }))} />
        <label className="btn btn-sm ielts-file">
          <Icon name="upload" size={14} /> {file ? file.name : 'Choose PDF, HTML or JSON'}
          <input type="file" accept=".pdf,.html,.htm,.json,application/pdf,text/html,application/json" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={busy} />
        </label>
        <button type="button" className="btn btn-primary btn-sm" onClick={convert} disabled={!file || busy}>
          <Icon name="sparkle" size={14} /> {busy ? `Converting… ${seconds}s` : (file && /\.json$/i.test(file.name) ? 'Open' : 'Convert')}
        </button>
      </div>
      {busy && <p className="form-help">A full test usually takes one to three minutes. Keep this tab open.</p>}
      {error && <div style={{ marginTop: 12 }}><ErrorNote error={error} /></div>}
    </div>
  );
}

// ── Check, complete and save ─────────────────────────────────────────────────
function Editor({ draft, onSaved, onCancel }) {
  const { skill } = draft;
  const [spec, setSpec] = useState(draft.spec);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(false);
  const [json, setJson] = useState(null);
  const check = useMemo(() => validateSpec(spec, skill), [spec, skill]);
  const nums = useMemo(() => allQuestionNumbers(spec), [spec]);

  const upload = async (what, file, apply) => {
    if (!file) return;
    setUploading(what); setError(null);
    try { apply(await api.uploadIeltsMedia(file)); } catch (e) { setError(e); } finally { setUploading(null); }
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const title = String(spec.title || '').trim();
      await api.saveIeltsTest({ id: draft.id, skill, title, spec: normalizeSpec({ ...spec, title }, skill), question_count: nums.length, source_name: draft.source_name });
      onSaved();
    } catch (e) { setError(e); setBusy(false); }
  };

  const applyJson = () => {
    try { setSpec(normalizeSpec(JSON.parse(json), skill)); setJson(null); setError(null); } catch (e) { setError(new Error(`That JSON isn't valid: ${e.message}`)); }
  };

  const imageGroups = [];
  (spec.parts || []).forEach((p, pi) => (p.question_groups || []).forEach((g, gi) => {
    const labelling = skill === 'listening' ? /labelling/.test(g.type) : g.type === 'diagram_completion';
    if (labelling || groupNeedsImage(skill, g)) imageGroups.push({ p, g, pi, gi });
  }));

  return (
    <div className="card ielts-editor">
      <div className="hub-section-head">
        <h2 className="h3">{draft.id ? 'Edit test' : 'Check the converted test'}</h2>
        <div className="hub-actions">
          <button type="button" className="btn btn-sm" onClick={() => setPreview(true)} disabled={check.errors.length > 0}><Icon name="eye" size={14} /> Preview</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={busy || check.errors.length > 0}><Icon name="check" size={14} /> {busy ? 'Saving…' : 'Save to bank'}</button>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="ib-title">Title</label>
        <input id="ib-title" className="form-input" value={spec.title || ''} onChange={(e) => setSpec({ ...spec, title: e.target.value })} maxLength={200} />
      </div>
      <p className="hub-muted ielts-summary">
        {skill === 'listening' ? 'Listening' : 'Reading'} · {spec.parts.length} {skill === 'listening' ? 'part' : 'passage'}{spec.parts.length === 1 ? '' : 's'} · {nums.length} questions
        {spec.parts.map((p) => ` · ${skill === 'listening' ? 'Part' : 'Passage'} ${p.part_number}: ${(p.question_groups || []).map((g) => g.type.replace(/_/g, ' ')).join(', ')}`).join('')}
      </p>

      {check.errors.length > 0 && <div className="form-error"><strong>Fix before saving:</strong><ul>{check.errors.map((m) => <li key={m}>{m}</li>)}</ul></div>}
      {check.warnings.length > 0 && <div className="ielts-warn"><ul>{check.warnings.map((m) => <li key={m}>{m}</li>)}</ul></div>}
      {draft.notes?.length > 0 && (
        <details className="ielts-notes"><summary>Converter notes ({draft.notes.length})</summary><ul>{draft.notes.map((m, i) => <li key={i}>{m}</li>)}</ul></details>
      )}

      {skill === 'listening' && (
        <section className="ielts-block">
          <h3 className="ielts-h">Audio</h3>
          <div className="ielts-import-row">
            <label className="btn btn-sm ielts-file">
              <Icon name="upload" size={14} /> {uploading === 'audio' ? 'Uploading…' : 'Upload audio'}
              <input type="file" accept="audio/*" disabled={Boolean(uploading)} onChange={(e) => upload('audio', e.target.files?.[0], (url) => setSpec((s) => ({ ...s, audio_url: url })))} />
            </label>
            <input className="form-input" style={{ flex: 1, minWidth: 220 }} placeholder="or paste an audio URL" value={spec.audio_url || ''} onChange={(e) => setSpec({ ...spec, audio_url: e.target.value.trim() })} />
          </div>
          {spec.audio_url && <audio controls src={spec.audio_url} style={{ width: '100%', marginTop: 10 }} />}
        </section>
      )}

      {imageGroups.length > 0 && (
        <section className="ielts-block">
          <h3 className="ielts-h">Pictures</h3>
          {imageGroups.map(({ p, g, pi, gi }) => {
            const ns = g.questions.map((q) => q.number);
            const what = `img-${pi}-${gi}`;
            const has = !groupNeedsImage(skill, g) && (g.image_url || /<img\b/i.test(g.layout?.body_html || ''));
            return (
              <div className="ielts-img-row" key={what}>
                <span>{skill === 'listening' ? 'Part' : 'Passage'} {p.part_number}, questions {Math.min(...ns)}–{Math.max(...ns)} ({g.type.replace(/_/g, ' ')})</span>
                {has ? <span className="pill pill-success"><Icon name="check" size={12} /> Added</span> : <span className="pill pill-amber">Needed</span>}
                <label className="btn btn-sm ielts-file">
                  <Icon name="upload" size={14} /> {uploading === what ? 'Uploading…' : has ? 'Replace' : 'Upload picture'}
                  <input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(e) => upload(what, e.target.files?.[0], (url) => setSpec((s) => withGroupImage(s, skill, pi, gi, url)))} />
                </label>
              </div>
            );
          })}
        </section>
      )}

      <section className="ielts-block">
        <h3 className="ielts-h">Answer key</h3>
        <p className="form-help" style={{ marginTop: 0 }}>Separate alternative answers with “ / ”. For “choose two/three”, list the letters, e.g. “A, C”.</p>
        <div className="ielts-key">
          {nums.map((n) => (
            <label key={n} className="ielts-key-cell">
              <b>{n}</b>
              <input className="form-input" value={keyText(spec.answer_key?.[String(n)])} onChange={(e) => setSpec((s) => setKey(s, n, e.target.value))} aria-label={`Answer for question ${n}`} />
            </label>
          ))}
        </div>
      </section>

      <details className="ielts-notes" onToggle={(e) => setJson(e.currentTarget.open ? JSON.stringify(spec, null, 2) : null)}>
        <summary>Edit the test JSON</summary>
        {json != null && (
          <>
            <textarea className="form-textarea ielts-json" value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
            <button type="button" className="btn btn-sm" onClick={applyJson}>Apply JSON</button>
          </>
        )}
      </details>

      {error && <div style={{ marginTop: 12 }}><ErrorNote error={error} /></div>}
      {preview && <Preview test={{ skill, spec }} onClose={() => setPreview(false)} />}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function IeltsBank() {
  const { isAdmin } = useHub();
  const list = useAsync(() => api.ieltsTests(), []);
  const [filter, setFilter] = useState('all');
  const [panel, setPanel] = useState(null); // 'import' | null
  const [draft, setDraft] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const top = useRef(null);

  const open = async (row, then) => {
    setLoadingId(row.id); setError(null);
    try { then(await api.ieltsTest(row.id)); } catch (e) { setError(e); } finally { setLoadingId(null); }
  };
  const edit = (row) => open(row, (t) => {
    setPanel(null);
    setDraft({ id: t.id, skill: t.skill, spec: normalizeSpec({ ...t.spec, title: t.title }, t.skill), notes: [] });
    top.current?.scrollIntoView({ behavior: 'smooth' });
  });
  const remove = async (row) => {
    const yes = await confirmDialog({ title: `Delete “${row.title}”?`, body: 'Students with this test as homework will no longer be able to open it. Their past results stay.', confirmLabel: 'Delete', danger: true });
    if (!yes) return;
    try { await api.deleteIeltsTest(row.id); list.reload(); } catch (e) { setError(e); }
  };

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Question bank" lead="IELTS Reading and Listening tests in the site's test format. Preview one, or assign it as homework.">
        <div className="hub-actions">
          <BankTabs active="ielts" />
          {isAdmin && !draft && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setPanel(panel === 'import' ? null : 'import')}><Icon name="upload" size={14} /> Upload test</button>
          )}
        </div>
      </PageTitle>
      <div ref={top} />
      {panel === 'import' && !draft && (
        <ImportPanel onClose={() => setPanel(null)} onConverted={(d) => { setPanel(null); setDraft(d); }} />
      )}
      {draft && (
        <Editor key={draft.id || draft.source_name} draft={draft} onCancel={() => setDraft(null)} onSaved={() => { setDraft(null); list.reload(); }} />
      )}
      {error && <ErrorNote error={error} />}

      <Loaded state={list}>
        {(rows) => {
          if (!rows.length) {
            return (
              <EmptyPanel icon="layers" title="No IELTS tests yet"
                lead={isAdmin ? 'Upload a test as a PDF or HTML file to add it to the bank.' : 'Tests the admin uploads appear here.'} />
            );
          }
          const counts = { reading: 0, listening: 0 };
          rows.forEach((r) => { counts[r.skill] += 1; });
          const shown = rows.filter((r) => filter === 'all' || r.skill === filter);
          return (
            <>
              <div style={{ margin: '4px 0 12px' }}>
                <Seg label="Skill" value={filter} onChange={setFilter} options={[
                  { value: 'all', label: `All (${rows.length})` },
                  { value: 'reading', label: `Reading (${counts.reading})` },
                  { value: 'listening', label: `Listening (${counts.listening})` },
                ]} />
              </div>
              <div className="hub-list">
                {shown.map((r) => {
                  const entry = bankCatalogEntry(r);
                  return (
                    <div key={r.id} className="card hub-row ielts-row">
                      <span className="hub-kind-icon"><Icon name={r.skill === 'listening' ? 'headphones' : 'bookOpen'} size={16} /></span>
                      <div className="hub-row-main">
                        <strong>{r.title}</strong>
                        <small>{r.skill === 'listening' ? 'Listening' : 'Reading'} · {r.question_count} questions · added {fmtDate(r.created_at)}</small>
                      </div>
                      <div className="hub-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => open(r, setPreview)} disabled={loadingId === r.id}><Icon name="eye" size={14} /> Preview</button>
                        <HubLink to={`/teach/assignments/new?test=${encodeURIComponent(`${entry.kind}:${entry.test_id}`)}`} className="btn btn-sm"><Icon name="plus" size={14} /> Assign</HubLink>
                        {isAdmin && <button type="button" className="btn btn-ghost btn-sm" onClick={() => edit(r)} disabled={loadingId === r.id}><Icon name="edit" size={14} /> Edit</button>}
                        {isAdmin && <button type="button" className="btn btn-ghost btn-sm hub-danger" onClick={() => remove(r)}>Delete</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        }}
      </Loaded>
      {preview && <Preview test={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
