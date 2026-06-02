import React from 'react';

// A real <a href> for in-app navigation. Plain left-clicks are intercepted and
// routed by the SPA (via onNavigate); cmd/ctrl/shift/alt and middle-clicks fall
// through to the browser, so "open in new tab", "copy link address", and
// middle-click work exactly like any normal link.
//
//   <AppLink href={hrefFor('reading')} onNavigate={() => setCurrentPage('reading')}>
//     Reading
//   </AppLink>
export default function AppLink({ href, onNavigate, children, className, style, ...rest }) {
  const handleClick = (e) => {
    // Let the browser handle modified / non-primary clicks natively.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    if (onNavigate) {
      e.preventDefault();
      onNavigate(e);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} style={style} {...rest}>
      {children}
    </a>
  );
}
