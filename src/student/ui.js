import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Icon from '../components/ui/icons';
import AppLink from '../components/ui/AppLink';
import { STATUS_LABEL, statusPillClass, KINDS } from './homework';

// Hub-wide context: navigation + who's signed in.
export const HubContext = createContext(null);
export const useHub = () => useContext(HubContext);

export function HubLink({ to, children, ...rest }) {
  const { go } = useHub();
  return <AppLink href={to} onNavigate={() => go(to)} {...rest}>{children}</AppLink>;
}

// Run an async loader on mount / when deps change. `reload()` re-runs it.
export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    fn().then(
      (data) => live && setState({ loading: false, data, error: null }),
      (error) => live && setState({ loading: false, data: null, error }),
    );
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export const Spinner = () => <div className="hub-loading"><div className="spinner" /></div>;

export const ErrorNote = ({ error }) => (
  <div className="form-error">{error?.message || 'Something went wrong. Please try again.'}</div>
);

// Standard loading / error wrapper for a useAsync result.
export function Loaded({ state, children }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error) return <ErrorNote error={state.error} />;
  return children(state.data);
}

export function EmptyPanel({ icon, title, lead, children }) {
  return (
    <div className="card hub-empty">
      <div className="coming-soon-icon"><Icon name={icon} size={28} /></div>
      <h2>{title}</h2>
      {lead && <p>{lead}</p>}
      {children}
    </div>
  );
}

export const BackLink = ({ to, label }) => (
  <HubLink to={to} className="hub-back"><Icon name="arrowLeft" size={16} /> {label}</HubLink>
);

export const StatusPill = ({ status }) => (
  <span className={statusPillClass(status)}>{STATUS_LABEL[status] || status}</span>
);

export const KindTag = ({ kind }) => (
  <span className="hub-kind"><Icon name={KINDS[kind]?.icon || 'edit'} size={14} /> {KINDS[kind]?.label || kind}</span>
);

export const Avatar = ({ person, size = 32 }) => {
  const initial = (person?.name || person?.email || '?').charAt(0).toUpperCase();
  return person?.avatar_url
    ? <img className="hub-avatar" src={person.avatar_url} alt="" width={size} height={size} referrerPolicy="no-referrer" />
    : <span className="hub-avatar hub-avatar--initial" style={{ width: size, height: size }}>{initial}</span>;
};

export const PersonName = ({ person }) => (
  <span className="hub-person">
    <Avatar person={person} />
    <span>
      <strong>{person?.name || 'Unnamed'}</strong>
      {person?.email && <small>{person.email}</small>}
    </span>
  </span>
);

export function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
      <Icon name={done ? 'check' : 'copy'} size={14} /> {done ? 'Copied' : label}
    </button>
  );
}

// Percent bar for progress rows.
export const Bar = ({ value }) => (
  <span className="hub-bar" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>
);
