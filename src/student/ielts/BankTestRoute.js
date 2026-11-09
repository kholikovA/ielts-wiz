import React, { Suspense, lazy, useMemo } from 'react';
import * as api from '../api';
import { useAsync } from '../ui';
import { bankKind, bankTestId, sanitizeSpec, tidySpec } from './ielts';

const ReadingTestPlayer = lazy(() => import('../../features/test-player/ReadingTestPlayer'));
const ListeningTestPlayer = lazy(() => import('../../features/test-player/ListeningTestPlayer'));

const Loading = () => <div className="hub-loading hub-loading--full"><div className="hub-spinner" /></div>;

// Plays a test from the IELTS question bank in the main site's player.
// `dryRun` previews it without recording an attempt.
export function BankPlayer({ test, review = false, onExit, dryRun = false }) {
  const Player = test.skill === 'listening' ? ListeningTestPlayer : ReadingTestPlayer;
  // Checked again here: bank specs come from uploaded files.
  const spec = useMemo(() => tidySpec(sanitizeSpec(test.spec)), [test.spec]);
  const entry = { kind: bankKind(test.skill), id: bankTestId(test.id || 'preview'), spec };
  return (
    <Suspense fallback={<Loading />}>
      <Player test={entry} review={review} onExit={onExit} dryRun={dryRun} />
    </Suspense>
  );
}

// /reading-test/bank-<id> and /listening-test/bank-<id>
export default function BankTestRoute({ id, review, onExit }) {
  const state = useAsync(() => api.ieltsTest(id), [id]);
  if (state.loading) return <Loading />;
  if (!state.data) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p className="body">{state.error ? 'This test could not be loaded. Check your connection and try again.' : 'That test isn’t available.'}</p>
        <button type="button" className="btn btn-primary" onClick={onExit}>Back to homework</button>
      </div>
    );
  }
  return <BankPlayer test={state.data} review={review} onExit={onExit} />;
}
