import React, { useState, useMemo } from 'react';
import Icon from '../components/ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHub, PageTitle, ErrorNote, Avatar } from './ui';
import { CHARACTERS, Character } from './characters';

const todayIso = () => new Date().toISOString().slice(0, 10);

function splitName(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return ['', ''];
  return [parts[0], parts.slice(1).join(' ')];
}

function age(iso) {
  if (!iso) return null;
  const b = new Date(`${iso}T00:00:00`);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a -= 1;
  return a >= 0 && a < 130 ? a : null;
}

export default function Profile() {
  const { user, preview } = useHub();
  const { profile, updateProfile } = useAuth();
  const [fallbackFirst, fallbackLast] = useMemo(() => splitName(profile?.name), [profile?.name]);
  const [first, setFirst] = useState(profile?.first_name ?? fallbackFirst);
  const [last, setLast] = useState(profile?.last_name ?? fallbackLast);
  const [dob, setDob] = useState(profile?.birth_date || '');
  const [character, setCharacter] = useState(profile?.avatar_character || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  if (preview) {
    return <PageTitle title="Profile" lead="Profiles can only be edited by the student." />;
  }

  const dirty = first !== (profile?.first_name ?? fallbackFirst) || last !== (profile?.last_name ?? fallbackLast)
    || dob !== (profile?.birth_date || '') || character !== (profile?.avatar_character || null);

  const save = async (e) => {
    e.preventDefault();
    setError(null); setSaved(false);
    const f = first.trim(); const l = last.trim();
    if (!f) { setError({ message: 'Add your first name.' }); return; }
    if (dob && (dob > todayIso() || dob < '1900-01-01')) { setError({ message: 'Check your date of birth.' }); return; }
    setBusy(true);
    const { error: err } = await updateProfile({
      first_name: f, last_name: l || null, name: [f, l].filter(Boolean).join(' '),
      birth_date: dob || null, avatar_character: character,
    });
    setBusy(false);
    if (err) setError(err); else setSaved(true);
  };

  const preview_ = { ...profile, email: user.email, avatar_character: character, name: [first, last].filter(Boolean).join(' ') };
  const years = age(dob);

  return (
    <>
      <PageTitle title="Profile" lead="How you appear to your teachers and classmates." />
      <form className="hub-form prof" onSubmit={save}>
        <div className="card prof-head">
          <Avatar person={preview_} size={72} />
          <div>
            <strong>{preview_.name || 'Your name'}</strong>
            <small>{user.email}{years != null ? ` · ${years} years old` : ''}</small>
          </div>
        </div>

        <div className="form-field">
          <span className="form-label">Character</span>
          <div className="prof-chars" role="radiogroup" aria-label="Character">
            {CHARACTERS.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={character === c.id} aria-label={c.name}
                className={`prof-char${character === c.id ? ' is-selected' : ''}`} onClick={() => setCharacter(c.id)}>
                <Character id={c.id} size={76} />
                {character === c.id && <span className="prof-check"><Icon name="check" size={12} /></span>}
              </button>
            ))}
          </div>
          {character && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCharacter(null)} style={{ marginTop: 8 }}>
              Use {profile?.avatar_url ? 'my Google photo' : 'my initial'} instead
            </button>
          )}
        </div>

        <div className="hub-form-row">
          <div className="form-field">
            <label className="form-label" htmlFor="pf-first">First name</label>
            <input id="pf-first" className="form-input" value={first} maxLength={60} autoComplete="given-name" onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="pf-last">Last name</label>
            <input id="pf-last" className="form-input" value={last} maxLength={60} autoComplete="family-name" onChange={(e) => setLast(e.target.value)} />
          </div>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="pf-dob">Date of birth</label>
          <input id="pf-dob" type="date" className="form-input" value={dob} min="1900-01-01" max={todayIso()} autoComplete="bday" onChange={(e) => setDob(e.target.value)} />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="pf-email">Email</label>
          <input id="pf-email" className="form-input" value={user.email || ''} readOnly disabled />
          <p className="form-help">Your Google account's email. It can't be changed here.</p>
        </div>

        {error && <ErrorNote error={error} />}
        <div className="hub-actions">
          <button className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save profile'}</button>
          {saved && !dirty && <span className="prof-saved"><Icon name="check" size={14} /> Saved</span>}
        </div>
      </form>
    </>
  );
}
