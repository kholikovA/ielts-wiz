import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { ErrorNote } from './ui';

// Proof uploads for "task" homework: photos, screenshots, video, audio, PDFs.
// Files live in the private homework-uploads bucket; submissions.data.files
// lists them as [{ path, name, type, size }].

export const MAX_FILES = 10;
export const MAX_MB = 50;
export const ACCEPT = 'image/*,video/*,audio/*,application/pdf';

const kindOf = (f) => (f.type || '').split('/')[0];
const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function useFileUrls(files) {
  const [urls, setUrls] = useState({});
  const key = files.map((f) => f.path).join('|');
  useEffect(() => {
    let live = true;
    api.homeworkFileUrls(files.map((f) => f.path)).then((u) => live && setUrls(u)).catch(() => {});
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return urls;
}

function Tile({ f, url, onRemove, busy }) {
  const k = kindOf(f);
  return (
    <div className={`proof-tile proof-tile--${k || 'file'}`}>
      {busy ? <div className="proof-thumb"><span className="dx-spin" /></div>
        : k === 'image' && url ? <a href={url} target="_blank" rel="noopener noreferrer" className="proof-thumb"><img src={url} alt={f.name} loading="lazy" /></a>
          : k === 'video' && url ? <video className="proof-thumb" src={url} controls preload="metadata" />
            : k === 'audio' && url ? <div className="proof-thumb proof-thumb--audio"><Icon name="headphones" size={22} /><audio src={url} controls preload="none" /></div>
              : <a href={url || undefined} target="_blank" rel="noopener noreferrer" className="proof-thumb proof-thumb--file"><Icon name={k === 'audio' ? 'headphones' : k === 'video' ? 'play' : k === 'image' ? 'eye' : 'clipboard'} size={24} /></a>}
      <div className="proof-meta">
        <span title={f.name}>{f.name}</span>
        <small>{fmtSize(f.size || 0)}</small>
      </div>
      {onRemove && !busy && (
        <button type="button" className="proof-remove" onClick={onRemove} aria-label={`Remove ${f.name}`}><Icon name="close" size={14} /></button>
      )}
    </div>
  );
}

// Read-only list (teacher review, submitted work).
export function ProofFiles({ files = [] }) {
  const urls = useFileUrls(files);
  if (!files.length) return <p className="form-help">No files uploaded.</p>;
  return <div className="proof-grid">{files.map((f) => <Tile key={f.path} f={f} url={urls[f.path]} />)}</div>;
}

// Student uploader. `files` is the current list; onChange(next) persists it.
export function ProofUploader({ assignmentId, uid, files, onChange, disabled }) {
  const urls = useFileUrls(files);
  const [pending, setPending] = useState([]); // [{ name, size, type, tmp }]
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const filesRef = useRef(files);
  filesRef.current = files;

  const add = async (list) => {
    setError(null);
    const picked = [...list];
    const room = MAX_FILES - filesRef.current.length - pending.length;
    if (picked.length > room) setError({ message: `You can upload up to ${MAX_FILES} files.` });
    const ok = picked.slice(0, Math.max(0, room)).filter((f) => {
      if (f.size > MAX_MB * 1048576) { setError({ message: `${f.name} is over ${MAX_MB} MB.` }); return false; }
      return true;
    });
    const tmp = ok.map((f) => ({ name: f.name, size: f.size, type: f.type, tmp: `${f.name}-${f.size}-${Math.random()}` }));
    setPending((p) => [...p, ...tmp]);
    // One at a time, so each save includes every earlier upload.
    let current = filesRef.current;
    for (let i = 0; i < ok.length; i += 1) {
      try {
        const meta = await api.uploadHomeworkFile(assignmentId, uid, ok[i]); // eslint-disable-line no-await-in-loop
        current = [...current, meta];
        await onChange(current); // eslint-disable-line no-await-in-loop
      } catch (err) {
        setError(err);
      } finally {
        setPending((p) => p.filter((x) => x.tmp !== tmp[i].tmp));
      }
    }
  };

  const remove = async (f) => {
    setError(null);
    try {
      await onChange(filesRef.current.filter((x) => x.path !== f.path));
      api.removeHomeworkFile(f.path).catch(() => {});
    } catch (err) { setError(err); }
  };

  const full = files.length + pending.length >= MAX_FILES;
  return (
    <div className="proof">
      <div className="proof-grid">
        {files.map((f) => <Tile key={f.path} f={f} url={urls[f.path]} onRemove={disabled ? null : () => remove(f)} />)}
        {pending.map((f) => <Tile key={f.tmp} f={f} busy />)}
        {!disabled && !full && (
          <button type="button" className="proof-add"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}>
            <Icon name="upload" size={20} />
            <span>Add photos or files</span>
            <small>Screenshots, photos, video, audio or PDF · up to {MAX_MB} MB each</small>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" multiple accept={ACCEPT} hidden
        onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {error && <ErrorNote error={error} />}
    </div>
  );
}
