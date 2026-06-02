import React from 'react';
import Hub from './reading/Hub';
import AboutGuide from './reading/AboutGuide';
import PartsView from './reading/PartsView';
import FullStub from './reading/FullStub';

// Reading section router. The subPage value dictates which child renders:
//   hub                       — three-card landing (default)
//   about                     — full guide page
//   parts | passage1/2/3      — passage-by-passage test catalogue
//   full                      — full-test (placeholder, no data yet)
// Older `/reading/passageN` URLs still resolve correctly because PartsView
// accepts those values as initial-tab hints.
export default function ReadingPage({ subPage, setSubPage, setCurrentPage }) {
  if (subPage === 'about') return <AboutGuide setSubPage={setSubPage} />;
  if (subPage === 'full')  return <FullStub setSubPage={setSubPage} />;
  if (subPage === 'parts' || (typeof subPage === 'string' && subPage.startsWith('passage'))) {
    return <PartsView subPage={subPage} setSubPage={setSubPage} setCurrentPage={setCurrentPage} />;
  }
  return <Hub setSubPage={setSubPage} />;
}
