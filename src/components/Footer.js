import React from 'react';
import Icon from './ui/icons';
import AppLink from './ui/AppLink';
import { hrefFor } from '../lib/routes';

const SECTIONS = [
  {
    title: 'Practice',
    links: [
      { label: 'Listening', page: 'listening' },
      { label: 'Reading', page: 'reading' },
      { label: 'Writing', page: 'writing' },
      { label: 'Speaking', page: 'speaking' },
      { label: 'Grammar', page: 'grammar' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'About IELTS', href: 'https://www.ielts.org/for-test-takers/test-format', external: true },
      { label: 'Band Score Guide', href: 'https://www.ielts.org/for-test-takers/how-ielts-is-scored', external: true },
      { label: 'Dashboard', page: 'dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', page: 'login' },
    ],
  },
];

const Footer = ({ setCurrentPage }) => (
  <footer className="site-footer">
    <div className="site-footer-inner">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <Icon name="sparkle" size={18} style={{ color: 'var(--purple-400)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            IELTS Wiz
          </span>
        </div>
        <p className="body" style={{ fontSize: 'var(--text-sm)', maxWidth: '32ch', margin: 0 }}>
          Real exam questions, Band 9 sample answers, and structured practice for every section of IELTS Academic.
        </p>
      </div>
      {SECTIONS.map(section => (
        <div key={section.title}>
          <h4>{section.title}</h4>
          {section.links.map(link => link.external ? (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
          ) : (
            <AppLink
              key={link.label}
              href={hrefFor(link.page)}
              onNavigate={setCurrentPage ? () => setCurrentPage(link.page) : undefined}
            >
              {link.label}
            </AppLink>
          ))}
        </div>
      ))}
    </div>
    <div className="site-footer-bottom">
      <span>© {new Date().getFullYear()} IELTS Wiz. Built for learners worldwide.</span>
      <span>Made with care for serious IELTS candidates.</span>
    </div>
  </footer>
);

export default Footer;
