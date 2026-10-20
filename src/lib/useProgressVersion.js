import { useEffect, useState } from 'react';
import { PROGRESS_EVENT } from './cloudSync';

// Re-render trigger for pages that read progress straight from localStorage.
// Bumps when a background sync merges in attempts, when another tab writes
// progress, and when the page comes back from the back/forward cache after a
// standalone test page recorded an attempt.
export default function useProgressVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const onStorage = (e) => { if (!e.key || e.key.startsWith('iw.v1.')) bump(); };
    const onShow = (e) => { if (e.persisted) bump(); };
    window.addEventListener(PROGRESS_EVENT, bump);
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, bump);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);
  return version;
}
