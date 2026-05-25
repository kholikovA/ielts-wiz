import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GOAL_OPTIONS = [
  'Practice speaking skills',
  'Improve listening comprehension',
  'Learn grammar structures',
  'Get band 9 sample answers',
  'Take mock tests',
  'Track my progress',
];

const TARGET_OPTIONS = [
  { value: '5.5', label: 'Band 5.5' },
  { value: '6.0', label: 'Band 6.0' },
  { value: '6.5', label: 'Band 6.5' },
  { value: '7.0', label: 'Band 7.0' },
  { value: '7.5', label: 'Band 7.5' },
  { value: '8.0', label: 'Band 8.0' },
  { value: '8.5+', label: 'Band 8.5+' },
];

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

const StepDots = ({ step, total }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
    {Array.from({ length: total }, (_, i) => (
      <span
        key={i}
        style={{
          width: i + 1 === step ? '24px' : '8px',
          height: '8px',
          borderRadius: 'var(--r-pill)',
          background: i + 1 <= step ? 'var(--purple-500)' : 'var(--border-color)',
          transition: 'width var(--dur-base) var(--ease), background var(--dur-base) var(--ease)',
        }}
      />
    ))}
  </div>
);

const AuthPage = ({ type, setCurrentPage }) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const [targetScore, setTargetScore] = useState('7.0');
  const [prepDuration, setPrepDuration] = useState('');
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [goals, setGoals] = useState([]);

  const isSignup = type === 'signup';

  const handleGoalToggle = (goal) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);

    if (isSignup) {
      if (step === 1) {
        if (!email || !password || !name) { setError('Please fill in all fields'); setLoading(false); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
        setStep(2); setLoading(false); return;
      }
      try {
        const { error } = await signUp(email, password, name, {
          target_score: targetScore,
          prep_duration: prepDuration,
          referral_source: hearAboutUs,
          goals,
        });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm.');
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    } else {
      if (!email || !password) { setError('Please fill in all fields'); setLoading(false); return; }
      try {
        const { error } = await signIn(email, password);
        if (error) throw error;
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next');
        if (next && next.startsWith('/')) {
          window.location.href = next;
        } else {
          setCurrentPage('dashboard');
        }
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    }
  };

  const wide = isSignup && step === 2;
  const heading = !isSignup ? 'Welcome back' : step === 1 ? 'Create account' : 'Tell us about you';
  const sub = !isSignup ? 'Sign in to continue' : step === 1 ? 'Start your IELTS journey in two quick steps.' : 'A few quick questions to tailor your practice.';

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: wide ? '540px' : '440px', padding: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-8)', borderRadius: 'var(--r-3xl)' }}>
          {isSignup && <StepDots step={step} total={2} />}

          <h1 className="h2" style={{ textAlign: 'center', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {heading}
          </h1>
          <p className="body" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            {sub}
          </p>

          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {isSignup && step === 1 && (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="name">Full name</label>
                  <input id="name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
                </div>
              </>
            )}

            {isSignup && step === 2 && (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="target">What's your target band score?</label>
                  <select id="target" className="form-select" value={targetScore} onChange={(e) => setTargetScore(e.target.value)}>
                    {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="prep">How long have you been preparing?</label>
                  <select id="prep" className="form-select" value={prepDuration} onChange={(e) => setPrepDuration(e.target.value)}>
                    {PREP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="source">How did you hear about IELTS Wiz?</label>
                  <select id="source" className="form-select" value={hearAboutUs} onChange={(e) => setHearAboutUs(e.target.value)}>
                    {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <span className="form-label">What do you want to achieve?</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {GOAL_OPTIONS.map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleGoalToggle(goal)}
                        className={`chip ${goals.includes(goal) ? 'is-selected' : ''}`}
                        aria-pressed={goals.includes(goal)}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!isSignup && (
              <>
                <div className="form-field">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              {isSignup && step === 2 && (
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>
                  Back
                </button>
              )}
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? 'Please wait…' : !isSignup ? 'Sign in' : step === 1 ? 'Continue' : 'Create account'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {!isSignup ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => setCurrentPage('signup')} style={{ color: 'var(--purple-400)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 'inherit', padding: 0 }}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => setCurrentPage('login')} style={{ color: 'var(--purple-400)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 'inherit', padding: 0 }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
