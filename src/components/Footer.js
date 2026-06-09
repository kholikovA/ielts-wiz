import React from 'react';
import Icon from './ui/icons';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';
import { useAuth } from '../contexts/AuthContext';
import { SKILLS, ACCOUNT_LINKS, RESOURCE_LINKS } from '../lib/navConfig';

const Footer = ({ setCurrentPage }) => {
  const { user } = useAuth();

  const onNav = (page) => setCurrentPage ? () => setCurrentPage(page) : undefined;

  // Account column adapts to auth state — no dead "Sign In" once you're in.
  const accountLinks = user
    ? ACCOUNT_LINKS
    : [{ id: 'login', label: 'Sign in' }];

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <Icon name="sparkle" size={18} style={{ color: 'var(--purple-400)' }} />
            <span>IELTS Wiz</span>
          </div>
          <p>
            Real exam questions, Band 9 sample answers, and structured practice for every section of IELTS Academic.
          </p>
        </div>

        <div>
          <h4>Practice</h4>
          {SKILLS.map(s => (
            <AppLink key={s.id} href={hrefFor(s.id)} onNavigate={onNav(s.id)}>{s.label}</AppLink>
          ))}
        </div>

        <div>
          <h4>Account</h4>
          {accountLinks.map(a => (
            <AppLink key={a.id} href={hrefFor(a.id)} onNavigate={onNav(a.id)}>{a.label}</AppLink>
          ))}
        </div>

        <div>
          <h4>Resources</h4>
          {RESOURCE_LINKS.map(r => (
            <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer">{r.label}</a>
          ))}
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} IELTS Wiz. Built for learners worldwide.</span>
        <span>Made with care for serious IELTS candidates.</span>
      </div>
    </footer>
  );
};

export default Footer;
