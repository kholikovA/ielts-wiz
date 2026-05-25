import { useEffect } from 'react';

// Adds `body.modal-open` while the calling component is mounted so the page
// behind a modal stops scrolling. Restores whatever class state was there
// before — safe to stack with other locks.
export default function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const had = document.body.classList.contains('modal-open');
    document.body.classList.add('modal-open');
    return () => { if (!had) document.body.classList.remove('modal-open'); };
  }, [enabled]);
}
