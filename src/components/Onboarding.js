import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './Onboarding.css';

// IELTS bands are numeric (the profiles.target_score column is numeric), so we
// store numbers — no "8.5+" string that would fail the cast.
const TARGET_OPTIONS = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

const PREP_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'just-started', label: 'Just getting started' },
  { value: 'less-1-month', label: 'Less than 1 month' },
  { value: '1-3-months', label: '1–3 months' },
  { value: '3-6-months', label: '3–6 months' },
  { value: '6-months-plus', label: 'More than 6 months' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'google', label: 'Google search' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'friend', label: 'Friend or family' },
  { value: 'teacher', label: 'Teacher recommendation' },
  { value: 'other', label: 'Other' },
];

const GOAL_OPTIONS = [
  'Practice speaking skills',
  'Improve listening comprehension',
  'Learn grammar structures',
  'Get band 9 sample answers',
  'Take mock tests',
  'Track my progress',
];

const firstName = (profile) => {
  const n = (profile?.name || '').trim();
  return n ? n.split(/\s+/)[0] : null;
};

// One-time questionnaire shown after a user's first Google sign-in (until their
// profile.onboarded flag is true). It tailors their experience and is skippable.
export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const { isDark } = useTheme();

  const [targetScore, setTargetScore] = useState(7.0);
  const [prepDuration, setPrepDuration] = useState('');
  const [referral, setReferral] = useState('');
  const [goals, setGoals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleGoal = (goal) =>
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));

  const save = async (updates) => {
    setError('');
    setSaving(true);
    const { error: err } = await updateProfile({ ...updates, onboarded: true });
    if (err) {
      setError('Something went wrong saving your preferences. Please try again.');
      setSaving(false);
    }
    // On success the profile (with onboarded: true) updates in context and this
    // screen unmounts — no further action needed.
  };

  const handleFinish = () =>
    save({
      target_score: targetScore,
      prep_duration: prepDuration || null,
      referral_source: referral || null,
      goals,
    });

  const name = firstName(profile);

  return (
    <main className="onb-root" role="main">
      <div className="onb-card">
        <img className="onb-logo" src={isDark ? '/logo-dark.svg' : '/logo-light.svg'} alt="IELTS Wiz" />

        <h1 className="onb-title">{name ? `Welcome, ${name}` : 'Welcome to IELTS Wiz'}</h1>
        <p className="onb-sub">A few quick questions so we can tailor your practice. Takes about 20 seconds.</p>

        {error && <div className="onb-error" role="alert">{error}</div>}

        <div className="onb-field">
          <span className="onb-label">What band score are you aiming for?</span>
          <div className="onb-segmented" role="group" aria-label="Target band score">
            {TARGET_OPTIONS.map((band) => (
              <button
                key={band}
                type="button"
                className={`onb-seg ${targetScore === band ? 'is-selected' : ''}`}
                aria-pressed={targetScore === band}
                onClick={() => setTargetScore(band)}
              >
                {band.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="onb-field">
          <label className="onb-label" htmlFor="onb-prep">How long have you been preparing?</label>
          <select id="onb-prep" className="form-select" value={prepDuration} onChange={(e) => setPrepDuration(e.target.value)}>
            {PREP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="onb-field">
          <label className="onb-label" htmlFor="onb-source">How did you hear about IELTS Wiz?</label>
          <select id="onb-source" className="form-select" value={referral} onChange={(e) => setReferral(e.target.value)}>
            {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="onb-field">
          <span className="onb-label">What do you want to achieve?</span>
          <div className="onb-chips">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal}
                type="button"
                className={`chip ${goals.includes(goal) ? 'is-selected' : ''}`}
                aria-pressed={goals.includes(goal)}
                onClick={() => toggleGoal(goal)}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div className="onb-actions">
          <button type="button" className="btn btn-primary btn-lg onb-primary" onClick={handleFinish} disabled={saving}>
            {saving ? 'Saving…' : 'Get started'}
          </button>
          <button type="button" className="onb-skip" onClick={() => save({})} disabled={saving}>
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
