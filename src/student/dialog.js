import React, { useEffect, useRef, useState } from 'react';

// Hub-styled, centred replacements for window.confirm / window.prompt.
//   if (await confirmDialog({ title, body, confirmLabel, danger })) …
//   const name = await promptDialog({ title, label, value });  // null if cancelled
// <DialogHost /> (mounted once in StudentApp) renders whatever is open.

let push = null;
const queue = [];
let seq = 0;

function open(spec) {
  return new Promise((resolve) => {
    seq += 1;
    const item = { ...spec, id: seq, resolve };
    if (push) push(item); else queue.push(item);
  });
}

export const confirmDialog = (spec) => open({ kind: 'confirm', ...spec });
export const promptDialog = (spec) => open({ kind: 'prompt', ...spec });

function Dialog({ item, onClose }) {
  const [value, setValue] = useState(item.value || '');
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const done = (result) => onClose(result);
  const accept = () => {
    if (item.kind === 'prompt') {
      if (!value.trim()) return;
      done(value.trim());
    } else done(true);
  };
  const cancel = () => done(item.kind === 'prompt' ? null : false);

  useEffect(() => {
    const prev = document.activeElement;
    (inputRef.current || boxRef.current?.querySelector('[data-autofocus]'))?.focus();
    if (inputRef.current) inputRef.current.select();
    return () => prev?.focus?.();
  }, []);

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    if (e.key === 'Enter' && item.kind === 'prompt') { e.preventDefault(); accept(); }
    if (e.key === 'Tab') { // keep focus inside
      const f = boxRef.current.querySelectorAll('button, input');
      if (!f.length) return;
      const first = f[0]; const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  return (
    <div className="hub-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) cancel(); }}>
      <div className="hub-dialog" role="dialog" aria-modal="true" aria-labelledby="hub-dialog-title" ref={boxRef} onKeyDown={onKey}>
        <h2 id="hub-dialog-title">{item.title}</h2>
        {item.body && <p>{item.body}</p>}
        {item.kind === 'prompt' && (
          <input ref={inputRef} className="form-input" value={value} maxLength={item.maxLength || 200}
            aria-label={item.label || item.title} onChange={(e) => setValue(e.target.value)} />
        )}
        <div className="hub-dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={cancel} data-autofocus={item.danger ? true : undefined}>{item.cancelLabel || 'Cancel'}</button>
          <button type="button" className={`btn ${item.danger ? 'hub-btn-danger' : 'btn-primary'}`} onClick={accept}
            data-autofocus={item.danger ? undefined : true} disabled={item.kind === 'prompt' && !value.trim()}>
            {item.confirmLabel || (item.kind === 'prompt' ? 'Save' : 'OK')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DialogHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    push = (item) => setItems((list) => [...list, item]);
    if (queue.length) setItems((list) => [...list, ...queue.splice(0)]);
    return () => { push = null; };
  }, []);
  const current = items[0];
  if (!current) return null;
  return (
    <Dialog key={current.id} item={current} onClose={(result) => {
      current.resolve(result);
      setItems((list) => list.slice(1));
    }} />
  );
}
