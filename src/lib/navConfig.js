// Single source of truth for the site's primary information architecture —
// shared by Navigation, the mobile drawer, the Footer, and the command palette
// so every navigation surface stays in lockstep. Add a destination once here and
// it shows up everywhere it should.
//
// Keep this module LIGHTWEIGHT. It's imported by the eager app shell
// (Navigation), so it must not pull in heavy catalogues — test specs, the
// grammar curriculum, etc. The command palette imports those itself, inside its
// own lazy chunk.

import { getActivity } from './progressStore';

// Core product nav — the five IELTS skills, in exam order.
export const SKILLS = [
  { id: 'listening', label: 'Listening', icon: 'headphones' },
  { id: 'reading',   label: 'Reading',   icon: 'book' },
  { id: 'writing',   label: 'Writing',   icon: 'pen' },
  { id: 'speaking',  label: 'Speaking',  icon: 'mic' },
  { id: 'grammar',   label: 'Grammar',   icon: 'graduation' },
];

// Signed-in account destinations (avatar menu + mobile drawer). Admin is gated
// on `isAdmin` and appended where relevant rather than living in this list.
export const ACCOUNT_LINKS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout' },
  { id: 'history',   label: 'History',   icon: 'clock' },
];

// External reference links (footer).
export const RESOURCE_LINKS = [
  { label: 'About IELTS',      href: 'https://www.ielts.org/for-test-takers/test-format' },
  { label: 'Band Score Guide', href: 'https://www.ielts.org/for-test-takers/how-ielts-is-scored' },
];

// Maps an activity-log `kind` (see progressStore) to the best place to resume
// that skill. Used by the "Continue" quick-resume affordance.
const RESUME_TARGETS = {
  listening:    { page: 'listening', subPage: null,      label: 'Listening' },
  reading_p1:   { page: 'reading',   subPage: 'passage1', label: 'Reading · Passage 1' },
  reading_p2:   { page: 'reading',   subPage: 'passage2', label: 'Reading · Passage 2' },
  reading_p3:   { page: 'reading',   subPage: 'passage3', label: 'Reading · Passage 3' },
  reading_full: { page: 'reading',   subPage: 'full',     label: 'Reading · Full tests' },
  grammar:      { page: 'grammar',   subPage: null,       label: 'Grammar' },
  writing:      { page: 'writing',   subPage: 'practice', label: 'Writing' },
};

// "Continue where you left off" — the most recent logged activity mapped to a
// destination. Returns null when there's nothing to resume (new / signed-out
// users, or a kind we don't have a target for).
export const getResumeTarget = () => {
  let activity;
  try { activity = getActivity(); } catch { return null; }
  if (!activity || activity.length === 0) return null;
  const last = activity[activity.length - 1];
  if (!last || !last.t) return null;
  const base = RESUME_TARGETS[last.t];
  if (!base) return null;
  // Grammar entries carry the topic id — deep-link straight back into it.
  if (last.t === 'grammar' && last.id) {
    return { ...base, subPage: String(last.id) };
  }
  return base;
};
