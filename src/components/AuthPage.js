import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './AuthPage.css';

// Official Google "G" mark (multi-colour), per Google's branding guidelines.
const GoogleMark = () => (
  <svg className="auth-g" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);

const ButtonSpinner = () => (
  <span className="auth-btn-spinner" aria-hidden="true" />
);

// Google is the only sign-in method. login/signup routes both land here — with
// OAuth there's no separate "register" step, so we show one clean screen.
const AuthPage = () => {
  const { signInWithGoogle } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      const { error: oauthError } = await signInWithGoogle(next);
      if (oauthError) throw oauthError;
      // Success → the browser is now redirecting to Google; nothing more to do.
    } catch (err) {
      setError(err?.message || 'Could not start sign-in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="page-shell--centered">
      <div className="auth-wrap">
        <div className="auth-card">
          <img
            className="auth-logo"
            src={isDark ? '/logo-dark.svg' : '/logo-light.svg'}
            alt="IELTS Wiz"
          />

          <h1 className="auth-title">Sign in to IELTS&nbsp;Wiz</h1>
          <p className="auth-sub">
            Continue with Google to save your progress, track your band scores, and pick up
            on any device.
          </p>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogle}
            disabled={loading}
          >
            {loading ? <ButtonSpinner /> : <GoogleMark />}
            <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
          </button>

          <p className="auth-reassure">
            No extra passwords to remember — your Google account keeps you secure.
          </p>

          <p className="auth-legal">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
