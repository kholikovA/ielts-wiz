import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AVATAR_OPTIONS, { AVATAR_NAMES } from '../data/avatar-options';
import PageHeader from './ui/PageHeader';
import Icon from './ui/icons';
import ActivityHeatmap from './ui/ActivityHeatmap';
import useBodyScrollLock from './ui/useBodyScrollLock';
import { getCompletedIds, getCurrentStreak, migrateLegacy } from '../lib/progressStore';
import { pullAndMerge } from '../lib/cloudSync';

// Practice catalog totals — bump when content grows.
const SECTIONS = [
  { id: 'listening',  kind: 'listening',  label: 'Listening',          page: 'listening', total: 80, color: 'var(--purple-500)', icon: 'headphones' },
  { id: 'reading-p1', kind: 'reading_p1', label: 'Reading · Passage 1', page: 'reading',  total: 40, color: 'var(--violet-500)', icon: 'book' },
  { id: 'reading-p2', kind: 'reading_p2', label: 'Reading · Passage 2', page: 'reading',  total: 20, color: 'var(--blue-500)',   icon: 'book' },
  { id: 'reading-p3', kind: 'reading_p3', label: 'Reading · Passage 3', page: 'reading',  total: 9,  color: 'var(--green-500)',  icon: 'book' },
];

const SHORTCUTS = [
  { label: 'Listening', page: 'listening', desc: '80 Practice Tests', icon: 'headphones', tint: 'var(--purple-500)' },
  { label: 'Reading',   page: 'reading',   desc: '69 Practice Tests', icon: 'book',       tint: 'var(--blue-500)' },
  { label: 'Speaking',  page: 'speaking',  desc: 'Part 1, 2, 3',      icon: 'mic',        tint: 'var(--green-500)' },
  { label: 'Grammar',   page: 'grammar',   desc: '6 Lessons',         icon: 'graduation', tint: 'var(--amber-500)' },
];

const TARGET_SCORES = ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

const ProgressBar = ({ pct, color }) => (
  <div style={{ width: '100%', height: '6px', borderRadius: 'var(--r-pill)', background: 'var(--tag-bg)', overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min(pct, 100)}%`,
      height: '100%',
      borderRadius: 'var(--r-pill)',
      background: color,
      transition: 'width var(--dur-slow) var(--ease)',
    }} />
  </div>
);

const Dashboard = ({ setCurrentPage }) => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(profile?.target_score || '7.0');
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  // Read completion counts from versioned progress store on mount. Reads
  // happen here (not in the per-section render) so the value can drive both
  // the section list and the overall stats strip below.
  const [completed, setCompleted] = useState(() => {
    migrateLegacy();
    return Object.fromEntries(SECTIONS.map(s => [s.id, getCompletedIds(s.kind).length]));
  });
  const [streak, setStreak] = useState(() => getCurrentStreak());
  // Lock page scroll while the avatar picker modal is open.
  useBodyScrollLock(showAvatarPicker);

  useEffect(() => {
    if (profile?.target_score) setEditTarget(profile.target_score.toString());
  }, [profile]);

  // Cross-device sync: on mount, pull any server-side test results recorded on
  // other devices and merge them into the local cache. Best-effort — silent on
  // failure, the dashboard still works offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await pullAndMerge();
      if (!cancelled && res?.added > 0) {
        setCompleted(Object.fromEntries(SECTIONS.map(s => [s.id, getCompletedIds(s.kind).length])));
        setStreak(getCurrentStreak());
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!user) return null;

  const handleSaveTarget = async () => {
    setSaving(true);
    const { error } = await updateProfile({ target_score: parseFloat(editTarget) });
    setSaving(false);
    if (!error) setIsEditing(false);
  };

  const handleAvatarSelect = async (avatarIndex) => {
    await updateProfile({ avatar_index: avatarIndex });
    setShowAvatarPicker(false);
  };

  const selectedAvatar = profile?.avatar_index != null ? profile.avatar_index : -1;
  const totalCompleted = SECTIONS.reduce((sum, s) => sum + completed[s.id], 0);
  const totalAvailable = SECTIONS.reduce((sum, s) => sum + s.total, 0);
  const overallPct = totalAvailable ? Math.round((totalCompleted / totalAvailable) * 100) : 0;

  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '960px' }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-10)' }}>
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            aria-label="Change avatar"
            style={{
              position: 'relative',
              width: '76px', height: '76px',
              background: 'transparent', border: 'none', padding: 0,
              cursor: 'pointer', display: 'block',
            }}
          >
            {/* Circular avatar — clipping lives here, not on the button, so
                the edit badge below can overflow at the corner. */}
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--purple-500)',
              background: selectedAvatar >= 0 ? 'transparent' : 'linear-gradient(135deg, var(--purple-500), var(--purple-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxSizing: 'border-box',
            }}>
              {selectedAvatar >= 0 && AVATAR_OPTIONS[selectedAvatar] ? (
                <img src={AVATAR_OPTIONS[selectedAvatar]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'white' }}>
                  {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Edit badge sits outside the circle clip, anchored to the
                button's bounding box. */}
            <div style={{
              position: 'absolute', bottom: '-4px', right: '-4px',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--purple-600)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid var(--bg-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <Icon name="pen" size={13} strokeWidth={2.5} />
            </div>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PageHeader
              title={profile?.name || 'Student'}
              lead={profile?.email || user.email}
            />
          </div>
        </div>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div className="modal-backdrop" onClick={() => setShowAvatarPicker(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="h3" style={{ marginBottom: 'var(--space-5)', textAlign: 'center', color: 'var(--text-primary)' }}>
                Choose your avatar
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                {AVATAR_OPTIONS.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAvatarSelect(i)}
                    aria-label={AVATAR_NAMES[i] || `Avatar ${i + 1}`}
                    title={AVATAR_NAMES[i]}
                    aria-pressed={selectedAvatar === i}
                    style={{
                      width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedAvatar === i ? '3px solid var(--purple-500)' : '3px solid transparent',
                      transition: 'border-color var(--dur-fast) var(--ease)',
                      background: 'var(--bg-secondary)', padding: 0,
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAvatarPicker(false)} style={{ width: '100%' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Stats strip — at-a-glance numbers */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-5)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Tests Done</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {totalCompleted}<span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-lg)', fontWeight: 500 }}> / {totalAvailable}</span>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Overall</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--purple-400)', lineHeight: 1 }}>
                {overallPct}%
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Streak</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: streak > 0 ? 'var(--amber-400)' : 'var(--text-tertiary)', lineHeight: 1 }}>
                  {streak}
                </span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>day{streak === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Target Band</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {profile?.target_score || '7.0'}
              </div>
            </div>
          </div>
        </div>

        {/* First-time onboarding card — only renders when the user has zero
            completed tests across all skills. Disappears once they finish their
            first practice, so this isn't a permanent dashboard fixture. */}
        {totalCompleted === 0 && (
          <div className="panel panel-info" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Icon name="compass" size={18} style={{ color: 'var(--purple-400)' }} />
              <h3 className="h3" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
                Welcome — start here
              </h3>
            </div>
            <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Take a single timed test in any section to get a real diagnostic. The score lands on this dashboard, builds your activity heatmap, and starts your streak.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={() => setCurrentPage('listening')}>
                Start with Listening <Icon name="arrowRight" size={14} />
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('reading')}>
                Or try Reading
              </button>
            </div>
          </div>
        )}

        {/* Activity heatmap — last 6 months. Reads from progressStore which is
            the same key HTML test pages write on submit. */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icon name="trending" size={18} style={{ color: 'var(--purple-400)' }} />
              <h2 className="h3" style={{ color: 'var(--text-primary)' }}>Activity</h2>
            </div>
            {totalCompleted > 0 && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('history')}>
                Full history <Icon name="arrowRight" size={14} />
              </button>
            )}
          </div>
          <ActivityHeatmap onGoToHistory={() => setCurrentPage('history')} />
        </div>

        {/* Target Band Card */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icon name="target" size={18} style={{ color: 'var(--purple-400)' }} />
              <h2 className="h3" style={{ color: 'var(--text-primary)' }}>Target Band Score</h2>
            </div>
            {!isEditing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <Icon name="edit" size={14} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setIsEditing(false); setEditTarget(profile?.target_score?.toString() || '7.0'); }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveTarget} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-5xl)', fontWeight: 800, color: 'var(--purple-400)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
                {profile?.target_score || '7.0'}
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-lg)' }}>/ 9.0</span>
            </div>
          ) : (
            <select
              className="form-select"
              value={editTarget}
              onChange={(e) => setEditTarget(e.target.value)}
              style={{ maxWidth: '140px', fontSize: 'var(--text-xl)', fontWeight: 600 }}
            >
              {TARGET_SCORES.map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          )}
        </div>

        {/* Progress Section */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <Icon name="trending" size={18} style={{ color: 'var(--purple-400)' }} />
            <h2 className="h3" style={{ color: 'var(--text-primary)' }}>Your Progress</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {SECTIONS.map((s) => {
              const done = completed[s.id];
              const pct = (done / s.total) * 100;
              return (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Icon name={s.icon} size={16} style={{ color: s.color }} />
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>{s.label}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {done} / {s.total}
                    </span>
                  </div>
                  <ProgressBar pct={pct} color={s.color} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Continue Learning */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <Icon name="layout" size={18} style={{ color: 'var(--purple-400)' }} />
            <h2 className="h3" style={{ color: 'var(--text-primary)' }}>Continue Learning</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {SHORTCUTS.map((action) => (
              <button
                key={action.page}
                type="button"
                onClick={() => setCurrentPage(action.page)}
                className="card card-interactive"
                style={{ padding: 'var(--space-5)', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: 'var(--r-md)',
                  background: 'var(--badge-bg)', color: action.tint,
                  marginBottom: 'var(--space-3)',
                }}>
                  <Icon name={action.icon} size={16} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tip card */}
        <div className="panel panel-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <Icon name="lightbulb" size={16} style={{ color: 'var(--amber-400)' }} />
            <h3 className="h3" style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
              Today's tip
            </h3>
          </div>
          <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
            In Speaking Part 2, use the one-minute preparation time wisely. Jot down 2–3 key points for each bullet on the cue card, then speak for the full 2 minutes by expanding on each point with examples and details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
