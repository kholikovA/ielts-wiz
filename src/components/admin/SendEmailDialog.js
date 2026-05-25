import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Icon from '../ui/icons';

// Calls the `send-email-batch` Supabase Edge Function with the filtered list
// of recipients. The function uses Resend on the server side — no API key
// leaves the server. See supabase/functions/send-email-batch/index.ts.

const TEMPLATES = [
  {
    id: 'welcome',
    label: 'Welcome / nudge',
    subject: 'Quick tip: how to actually use IELTS Wiz',
    bodyMd: "Hi {{name}},\n\nThanks for signing up. The fastest way to know where you stand is to sit one timed test — pick any Listening or Reading passage, hit the timer, and you'll get an immediate band estimate plus a per-question breakdown.\n\nYou aimed for Band {{target_score}}, so I'd start with a Passage 2 Reading or a Part 3 Listening — that's where the score actually decides.\n\nGo here when you're ready: https://ielts-wiz.com/listening\n\n— IELTS Wiz",
  },
  {
    id: 'reengage',
    label: 'Re-engagement',
    subject: "We haven't seen you in a while — here's where to pick up",
    bodyMd: "Hi {{name}},\n\nIt's been a minute. You signed up with a target of Band {{target_score}} — the difference between where most people give up (around 6.5) and where you want to be is roughly 30 hours of structured practice.\n\nFifteen minutes today gets you back in. One reading passage, one listening section. Pick whichever you dread more: https://ielts-wiz.com/dashboard\n\n— IELTS Wiz",
  },
  {
    id: 'custom',
    label: 'Custom (write your own)',
    subject: '',
    bodyMd: '',
  },
];

// Markdown → HTML mini-renderer. Just enough to convert the templates above
// without pulling in a library. Supports paragraphs, links, line breaks.
const mdToHtml = (md) => {
  const escaped = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#7c3aed">$1</a>'
  );
  const paragraphs = linked.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  return paragraphs;
};

const personalise = (template, user) => template
  .replace(/\{\{name\}\}/g, (user.name || 'there').split(' ')[0])
  .replace(/\{\{target_score\}\}/g, user.target_score || '7.0')
  .replace(/\{\{email\}\}/g, user.email || '');

const SendEmailDialog = ({ recipients, onClose }) => {
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const template = TEMPLATES.find(t => t.id === templateId);
  const [subject, setSubject] = useState(template.subject);
  const [bodyMd, setBodyMd] = useState(template.bodyMd);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const onTemplateChange = (id) => {
    setTemplateId(id);
    const t = TEMPLATES.find(x => x.id === id);
    setSubject(t.subject);
    setBodyMd(t.bodyMd);
  };

  const preview = recipients[previewIdx] || recipients[0];
  const previewSubject = preview ? personalise(subject, preview) : subject;
  const previewBody = preview ? mdToHtml(personalise(bodyMd, preview)) : mdToHtml(bodyMd);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      // Edge function expects { recipients: [{email,name,target_score}], subject, bodyMd }
      const payload = {
        recipients: recipients.map(r => ({
          email: r.email,
          name: r.name || '',
          target_score: r.target_score ? String(r.target_score) : '7.0',
        })),
        subject,
        bodyMd,
      };
      const { data, error } = await supabase.functions.invoke('send-email-batch', { body: payload });
      if (error) throw error;
      setResult({ ok: true, ...data });
    } catch (e) {
      setResult({ ok: false, error: String(e?.message || e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900, padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 className="h3" style={{ color: 'var(--text-primary)' }}>
            Email {recipients.length} user{recipients.length === 1 ? '' : 's'}
          </h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>

        {result?.ok ? (
          <div className="panel panel-success">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Icon name="checkCircle" size={18} style={{ color: 'var(--success)' }} />
              <strong style={{ color: 'var(--success)' }}>Queued</strong>
            </div>
            <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
              Sent {result.sent ?? recipients.length} email{recipients.length === 1 ? '' : 's'} via Resend.
              {result.failed > 0 && ` ${result.failed} failed.`}
            </p>
            <button type="button" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={onClose}>
              Done
            </button>
          </div>
        ) : result?.ok === false ? (
          <div className="panel panel-error">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Icon name="xCircle" size={18} style={{ color: 'var(--error)' }} />
              <strong style={{ color: 'var(--error)' }}>Send failed</strong>
            </div>
            <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
              {result.error}
            </p>
            <p className="body" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Most likely cause: the <code>send-email-batch</code> Edge Function isn't deployed yet, or <code>RESEND_API_KEY</code> isn't set in Supabase secrets. See the deployment instructions in <code>supabase/functions/send-email-batch/README.md</code>.
            </p>
            <button type="button" className="btn btn-secondary" style={{ marginTop: 'var(--space-3)' }} onClick={() => setResult(null)}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="form-field">
              <label className="form-label">Template</label>
              <select className="form-select" value={templateId} onChange={(e) => onTemplateChange(e.target.value)}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Subject</label>
              <input type="text" className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="form-field">
              <label className="form-label">Body (markdown — supports {`{{name}}`}, {`{{target_score}}`})</label>
              <textarea className="form-textarea" value={bodyMd} onChange={(e) => setBodyMd(e.target.value)} style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }} />
            </div>

            {/* Preview */}
            <div className="card" style={{ background: 'var(--bg-secondary)', marginBottom: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <div className="eyebrow">Preview as recipient</div>
                <select
                  className="form-select"
                  value={previewIdx}
                  onChange={(e) => setPreviewIdx(parseInt(e.target.value, 10))}
                  style={{ width: 'auto' }}
                  disabled={recipients.length === 0}
                >
                  {recipients.slice(0, 20).map((r, i) => (
                    <option key={r.id || i} value={i}>{r.email}</option>
                  ))}
                </select>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'var(--card-bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-color)' }}>
                  {previewSubject || <em style={{ color: 'var(--text-tertiary)' }}>(empty subject)</em>}
                </div>
                <div style={{ color: 'var(--text-primary)', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: previewBody }} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I've reviewed the subject + body and want to send to <strong style={{ color: 'var(--text-primary)' }}>{recipients.length}</strong> recipient{recipients.length === 1 ? '' : 's'}.
            </label>

            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={send} disabled={!confirmed || sending || !subject || !bodyMd}>
                {sending ? 'Sending…' : `Send to ${recipients.length}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SendEmailDialog;
