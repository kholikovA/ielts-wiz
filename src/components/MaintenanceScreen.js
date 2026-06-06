import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './MaintenanceScreen.css';

// Shown in place of the entire app while the accounts/user system is rebuilt.
// No navigation, no auth, no routes — just a calm, branded "we'll be back" page.
export default function MaintenanceScreen() {
  const { isDark } = useTheme();
  return (
    <main className="mnt-root" role="main">
      <div className="mnt-card">
        <img className="mnt-logo" src={isDark ? '/logo-dark.svg' : '/logo-light.svg'} alt="IELTS Wiz" />
        <span className="mnt-badge">
          <span className="mnt-dot" aria-hidden="true" />
          Scheduled upgrade
        </span>
        <h1 className="mnt-title">We&rsquo;re making IELTS&nbsp;Wiz better</h1>
        <p className="mnt-text">
          We&rsquo;re rebuilding accounts and progress tracking to be faster, more secure,
          and ready for everything coming next. The site is briefly offline while we finish up.
        </p>
        <p className="mnt-text mnt-sub">Thanks for your patience — we&rsquo;ll be back very soon.</p>
        <a className="mnt-contact" href="mailto:kholikovabdulloh@gmail.com">Questions? Get in touch</a>
      </div>
    </main>
  );
}
