import React from 'react';
import Hub from './listening/Hub';
import AboutGuide from './listening/AboutGuide';
import PartsView from './listening/PartsView';
import FullStub from './listening/FullStub';

// Listening section router. The subPage value dictates which child renders:
//   hub                  — three-card landing (default)
//   about                — full guide page
//   parts | part1..4     — section-by-section test catalogue
//   full                 — full-test (placeholder, no data yet)
// Older `/listening/partN` URLs still resolve correctly because PartsView
// accepts those values as initial-tab hints.
export default function ListeningPage({ subPage, setSubPage, setCurrentPage }) {
  if (subPage === 'about') return <AboutGuide setSubPage={setSubPage} />;
  if (subPage === 'full')  return <FullStub setSubPage={setSubPage} />;
  if (subPage === 'parts' || (typeof subPage === 'string' && subPage.startsWith('part'))) {
    return <PartsView subPage={subPage} setSubPage={setSubPage} setCurrentPage={setCurrentPage} />;
  }
  return <Hub setSubPage={setSubPage} />;
}
