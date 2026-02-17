import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import AVATAR_OPTIONS from '../data/avatar-options';

const Dashboard = ({ setCurrentPage }) => {
  const { user, profile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editTarget, setEditTarget] = useState(profile?.target_score || '7.0');
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [completedListening, setCompletedListening] = useState(() => {
    const saved = localStorage.getItem('completedListeningTests');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedP1] = useState(() => {
    const saved = localStorage.getItem('completedReading_passage1');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedP2] = useState(() => {
    const saved = localStorage.getItem('completedReading_passage2');
    return saved ? JSON.parse(saved) : [];
  });
  const [completedP3] = useState(() => {
    const saved = localStorage.getItem('completedReading_passage3');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (profile?.target_score) {
      setEditTarget(profile.target_score.toString());
    }
  }, [profile]);

  const handleSaveTarget = async () => {
    setSaving(true);
    const { error } = await updateProfile({ target_score: parseFloat(editTarget) });
    setSaving(false);
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleAvatarSelect = async (avatarIndex) => {
    await updateProfile({ avatar_index: avatarIndex });
    setShowAvatarPicker(false);
  };

  const selectedAvatar = profile?.avatar_index != null ? profile.avatar_index : -1;

  const ProgressBar = ({ completed, total, color }) => (
    <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((completed / total) * 100, 100)}%`, height: '100%', borderRadius: '4px', background: color, transition: 'width 0.5s ease' }} />
    </div>
  );

  const sections = [
    { label: 'Listening', page: 'listening', color: 'var(--purple-500)', completed: completedListening.length, total: 80, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>) },
    { label: 'Reading - Passage 1', page: 'reading', color: '#8b5cf6', completed: completedP1.length, total: 40, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>) },
    { label: 'Reading - Passage 2', page: 'reading', color: '#3b82f6', completed: completedP2.length, total: 20, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>) },
    { label: 'Reading - Passage 3', page: 'reading', color: '#10b981', completed: completedP3.length, total: 9, icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>) },
  ];

  if (!user) return null;
  
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div 
            onClick={() => setShowAvatarPicker(true)}
            style={{ 
              width: '72px', height: '72px', borderRadius: '50%', 
              background: selectedAvatar >= 0 ? 'transparent' : 'linear-gradient(135deg, var(--purple-500), var(--purple-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              border: '3px solid var(--purple-500)',
              transition: 'all 0.2s ease'
            }}
          >
            {selectedAvatar >= 0 && typeof AVATAR_OPTIONS !== 'undefined' && AVATAR_OPTIONS[selectedAvatar] ? (
              <img src={AVATAR_OPTIONS[selectedAvatar]} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>
                {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </span>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '22px', height: '22px', borderRadius: '50%', background: 'var(--purple-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--card-bg)' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              {profile?.name || 'Student'}
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{profile?.email || user.email}</p>
          </div>
        </div>

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAvatarPicker(false)}>
            <div style={{ background: 'var(--card-bg)', borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '90%', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)', textAlign: 'center' }}>Choose Your Avatar</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {typeof AVATAR_OPTIONS !== 'undefined' && AVATAR_OPTIONS.map((src, i) => (
                  <div 
                    key={i}
                    onClick={() => handleAvatarSelect(i)}
                    style={{ 
                      width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden',
                      cursor: 'pointer', border: selectedAvatar === i ? '3px solid var(--purple-500)' : '3px solid transparent',
                      transition: 'all 0.2s ease', background: 'var(--bg-secondary)'
                    }}
                  >
                    <img src={src} alt={`Avatar ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAvatarPicker(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Target Score Card */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              Target Band Score
            </h2>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--purple-500)', background: 'transparent', color: 'var(--purple-400)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => { setIsEditing(false); setEditTarget(profile?.target_score?.toString() || '7.0'); }}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTarget}
                  disabled={saving}
                  style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none', background: 'var(--purple-600)', color: 'white', fontSize: '0.8rem', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
          
          {!isEditing ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--purple-400)' }}>{profile?.target_score || '7.0'}</span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>/ 9.0</span>
            </div>
          ) : (
            <select 
              value={editTarget} 
              onChange={(e) => setEditTarget(e.target.value)}
              style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '600', cursor: 'pointer', width: '120px' }}
            >
              {['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map(score => (
                <option key={score} value={score}>{score}</option>
              ))}
            </select>
          )}
        </div>

        {/* Progress Section */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Your Progress
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {sections.map((s) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    {s.label}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: '500' }}>
                    {s.completed} / {s.total}
                  </span>
                </div>
                <ProgressBar completed={s.completed} total={s.total} color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.5rem' }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Continue Learning
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Listening', page: 'listening', desc: '80 Practice Tests', color: 'var(--purple-500)' },
              { label: 'Reading', page: 'reading', desc: '69 Practice Tests', color: '#3b82f6' },
              { label: 'Speaking', page: 'speaking', desc: 'Part 1, 2, 3', color: '#10b981' },
              { label: 'Grammar', page: 'grammar', desc: '6 Lessons', color: '#f59e0b' },
            ].map((action) => (
              <button 
                key={action.page} 
                onClick={() => setCurrentPage(action.page)} 
                style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: action.color, marginBottom: '0.75rem' }} />
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>{action.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{action.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'linear-gradient(135deg, var(--purple-600-20), var(--purple-700-20))', border: '1px solid var(--purple-500-30)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'text-bottom', marginRight: '0.4rem' }}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>
            Today's Tip
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            In Speaking Part 2, use the one minute preparation time wisely. Jot down 2-3 key points for each bullet on the cue card, then speak for the full 2 minutes by expanding on each point with examples and details.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== HOME PAGE ====================

export default Dashboard;
