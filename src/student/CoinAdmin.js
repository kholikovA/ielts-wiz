import React, { useState, useMemo } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub, useAsync, Loaded, PageTitle, PersonName, ErrorNote, Coin } from './ui';
import { EarnTable } from './Dashboard';

const QUICK = [1, 2, 5, -1, -2];

// Give or take coins from one or more students. Shows as "Teacher" in their history.
export function GiveCoins({ students, fixed, onDone }) {
  const [picked, setPicked] = useState(() => new Set(fixed ? fixed.map((s) => s.id) : []));
  const [q, setQ] = useState('');
  const [amount, setAmount] = useState('1');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const n = Number(amount);
  const valid = Number.isInteger(n) && n !== 0 && Math.abs(n) <= 100 && reason.trim() && picked.size > 0;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(needle)) : students;
  }, [students, q]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null); setDone(null);
    try {
      const count = await api.teacherAwardCoins([...picked], n, reason.trim());
      setDone(`${n > 0 ? 'Gave' : 'Took'} ${Math.abs(n)} coin${Math.abs(n) === 1 ? '' : 's'} ${n > 0 ? 'to' : 'from'} ${count} student${count === 1 ? '' : 's'}.`);
      setReason('');
      if (!fixed) setPicked(new Set());
      onDone?.();
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <form className="card" onSubmit={submit}>
      {!fixed && (
        <div className="form-field">
          <span className="form-label">Students</span>
          <input className="form-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search students" />
          <div className="hub-picklist">
            {shown.length ? shown.map((s) => (
              <label key={s.id} className="hub-pick">
                <input type="checkbox" checked={picked.has(s.id)} onChange={() => setPicked((p) => { const x = new Set(p); if (x.has(s.id)) x.delete(s.id); else x.add(s.id); return x; })} />
                <PersonName person={s} />
              </label>
            )) : <p style={{ padding: 8 }}>No students.</p>}
          </div>
          {shown.length > 0 && (
            <div className="hub-actions" style={{ marginTop: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked(new Set(shown.map((s) => s.id)))}>Select all</button>
              {picked.size > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicked(new Set())}>Clear ({picked.size})</button>}
            </div>
          )}
        </div>
      )}
      <div className="hub-form-row">
        <div className="form-field">
          <label className="form-label" htmlFor="gc-amount">Coins</label>
          <input id="gc-amount" type="number" min="-100" max="100" step="1" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="hub-actions" style={{ marginTop: 6 }}>
            {QUICK.map((v) => (
              <button key={v} type="button" className={`btn btn-sm${Number(amount) === v ? ' btn-primary' : ''}`} onClick={() => setAmount(String(v))}>{v > 0 ? '+' : ''}{v}</button>
            ))}
          </div>
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="gc-reason">Reason (students see this)</label>
          <input id="gc-reason" className="form-input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120} placeholder="e.g. Excellent speaking practice" />
        </div>
      </div>
      {error && <ErrorNote error={error} />}
      {done && <div className="form-success" style={{ marginBottom: 12 }}>{done}</div>}
      <button className="btn btn-primary" disabled={busy || !valid}>
        <Coin /> {n < 0 ? 'Take coins' : 'Give coins'}
      </button>
    </form>
  );
}

function RuleRow({ rule, onSaved }) {
  const [coins, setCoins] = useState(String(rule.coins));
  const [enabled, setEnabled] = useState(rule.enabled);
  const [threshold, setThreshold] = useState(rule.threshold == null ? '' : String(rule.threshold));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const dirty = Number(coins) !== rule.coins || enabled !== rule.enabled
    || (rule.threshold != null && Number(threshold) !== rule.threshold);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const fields = { coins: Number(coins), enabled };
      if (rule.threshold != null) fields.threshold = Number(threshold);
      await api.updateRewardRule(rule.key, fields);
      onSaved();
    } catch (err) { setError(err); }
    setBusy(false);
  };

  return (
    <div className="coin-rule">
      <label className="coin-rule-toggle" title={enabled ? 'On' : 'Off'}>
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
      </label>
      <div className="coin-rule-main">
        <strong>{rule.label}</strong>
        {rule.description && <small>{rule.description}</small>}
        {error && <small className="hub-neg" style={{ textAlign: 'left' }}>{error.message}</small>}
      </div>
      {rule.threshold != null && (
        <label className="coin-rule-field">
          <small>Threshold</small>
          <input type="number" min="1" className="form-input" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </label>
      )}
      <label className="coin-rule-field">
        <small>Coins</small>
        <input type="number" className="form-input" value={coins} onChange={(e) => setCoins(e.target.value)} />
      </label>
      <button type="button" className={`btn btn-sm${dirty ? ' btn-primary' : ''}`} disabled={!dirty || busy || coins === '' || Number.isNaN(Number(coins))} onClick={save}>
        {busy ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

export function CoinAdmin() {
  const { user, isAdmin } = useHub();
  const rules = useAsync(api.rewardRules, []);
  const roster = useAsync(() => api.teacherStudents(user.id), [user.id]);
  const recent = useAsync(() => api.recentManualAwards(15), []);
  const [showOff, setShowOff] = useState(false);

  return (
    <>
      <PageTitle eyebrow="Teaching" title="Coins"
        lead={isAdmin ? 'Give or take coins, and set how many coins each automatic rule is worth.' : 'Give or take coins. Automatic rules are set by the admin.'} />

      <div className="hub-cols">
        <section>
          <h2 className="h3" style={{ marginBottom: 12 }}>Give or take coins</h2>
          <Loaded state={roster}>
            {({ students }) => <GiveCoins students={students} onDone={recent.reload} />}
          </Loaded>

          <h2 className="h3" style={{ margin: '28px 0 12px' }}>{isAdmin ? 'Automatic rules' : 'How coins work'}</h2>
          <Loaded state={rules}>
            {(list) => {
              if (!isAdmin) return <EarnTable rules={list} />;
              const on = list.filter((r) => r.enabled);
              const off = list.filter((r) => !r.enabled);
              return (
                <>
                  <div className="hub-list">
                    {on.map((r) => <RuleRow key={`${r.key}:${r.coins}:${r.enabled}:${r.threshold}`} rule={r} onSaved={rules.reload} />)}
                  </div>
                  <p className="form-help">Changes apply to coins earned from now on. Use a negative number for a penalty. Weekly rules are checked every hour after a week ends (Monday 4am).</p>
                  {off.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowOff((v) => !v)}>
                        <Icon name={showOff ? 'chevronDown' : 'chevronRight'} size={14} /> Switched-off rules ({off.length})
                      </button>
                      {showOff && (
                        <div className="hub-list" style={{ marginTop: 8 }}>
                          {off.map((r) => <RuleRow key={`${r.key}:${r.coins}:${r.enabled}`} rule={r} onSaved={rules.reload} />)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            }}
          </Loaded>
        </section>

        <aside>
          <h2 className="h3" style={{ marginBottom: 12 }}>Recent teacher awards</h2>
          <Loaded state={recent}>
            {(rows) => rows.length ? (
              <div className="card">
                <ul className="dash-feed">
                  {rows.map((t) => (
                    <li key={t.id}>
                      <span>{t.profiles?.name || t.profiles?.email} · {t.label}</span>
                      <b className={t.amount < 0 ? 'is-neg' : ''}>{t.amount > 0 ? '+' : ''}{t.amount}</b>
                    </li>
                  ))}
                </ul>
              </div>
            ) : <div className="card"><p>No manual awards yet.</p></div>}
          </Loaded>
        </aside>
      </div>
    </>
  );
}
