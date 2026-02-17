import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const AuthPage = ({ type, setCurrentPage }) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // For multi-step signup
  
  // Marketing/profile questions
  const [targetScore, setTargetScore] = useState('7.0');
  const [prepDuration, setPrepDuration] = useState('');
  const [hearAboutUs, setHearAboutUs] = useState('');
  const [goals, setGoals] = useState([]);

  const goalOptions = [
    'Practice speaking skills',
    'Improve listening comprehension',
    'Learn grammar structures',
    'Get band 9 sample answers',
    'Take mock tests',
    'Track my progress'
  ];

  const handleGoalToggle = (goal) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    
    if (type === 'signup') {
      if (step === 1) {
        if (!email || !password || !name) { 
          setError('Please fill in all fields'); 
          setLoading(false); 
          return; 
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        setStep(2);
        setLoading(false);
        return;
      }
      
      // Step 2 - complete signup with profile data
      try {
        const { error } = await signUp(email, password, name, {
          target_score: targetScore,
          prep_duration: prepDuration,
          referral_source: hearAboutUs,
          goals: goals
        });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm.');
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    } else {
      // Login
      if (!email || !password) { 
        setError('Please fill in all fields'); 
        setLoading(false); 
        return; 
      }
      try {
        const { error } = await signIn(email, password);
        if (error) throw error;
        setCurrentPage('dashboard');
      } catch (err) { 
        setError(err.message); 
      } finally { 
        setLoading(false); 
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: type === 'signup' && step === 2 ? '520px' : '420px', padding: '2rem' }}>
        <div style={{ padding: '2.5rem', borderRadius: '24px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
            {type === 'login' ? 'Welcome back' : step === 1 ? 'Create account' : 'Almost there!'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
            {type === 'login' ? 'Sign in to continue' : step === 1 ? 'Start your IELTS journey' : 'Tell us about your goals'}
          </p>
          
          {error && <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</div>}
          {success && <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{success}</div>}
          
          <form onSubmit={handleSubmit}>
            {type === 'signup' && step === 1 && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
              </>
            )}
            
            {type === 'signup' && step === 2 && (
              <>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>What's your target IELTS band score?</label>
                  <select value={targetScore} onChange={(e) => setTargetScore(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="5.5">Band 5.5</option>
                    <option value="6.0">Band 6.0</option>
                    <option value="6.5">Band 6.5</option>
                    <option value="7.0">Band 7.0</option>
                    <option value="7.5">Band 7.5</option>
                    <option value="8.0">Band 8.0</option>
                    <option value="8.5+">Band 8.5+</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How long have you been preparing for IELTS?</label>
                  <select value={prepDuration} onChange={(e) => setPrepDuration(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select an option</option>
                    <option value="just-started">Just getting started</option>
                    <option value="less-1-month">Less than 1 month</option>
                    <option value="1-3-months">1-3 months</option>
                    <option value="3-6-months">3-6 months</option>
                    <option value="6-months-plus">More than 6 months</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How did you hear about IELTS Wiz?</label>
                  <select value={hearAboutUs} onChange={(e) => setHearAboutUs(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select an option</option>
                    <option value="google">Google search</option>
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="friend">Friend or family</option>
                    <option value="teacher">Teacher recommendation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>What do you want to achieve? (Select all that apply)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {goalOptions.map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleGoalToggle(goal)}
                        style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: '20px',
                          border: goals.includes(goal) ? '1px solid var(--purple-500)' : '1px solid var(--border-color)',
                          background: goals.includes(goal) ? 'var(--purple-600-20)' : 'transparent',
                          color: goals.includes(goal) ? 'var(--purple-400)' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {type === 'login' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
              </>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {type === 'signup' && step === 2 && (
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
                >
                  Back
                </button>
              )}
              <button 
                type="submit" 
                disabled={loading} 
                style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--purple-600), var(--purple-700))', color: 'white', fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Please wait...' : (type === 'login' ? 'Sign In' : step === 1 ? 'Continue' : 'Create Account')}
              </button>
            </div>
          </form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {type === 'login' ? (
              <>Don't have an account? <span onClick={() => setCurrentPage('signup')} style={{ color: 'var(--purple-400)', cursor: 'pointer' }}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => setCurrentPage('login')} style={{ color: 'var(--purple-400)', cursor: 'pointer' }}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== DASHBOARD ====================

export default AuthPage;
