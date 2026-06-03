// Warm the browser cache for a standalone test page when the user hovers its
// link, so the click-to-open feels instant. Each URL is prefetched once.
const seen = new Set();

export function prefetchPage(href) {
  if (!href || typeof href !== 'string' || !href.startsWith('/') || seen.has(href)) return;
  seen.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = href;
  document.head.appendChild(link);
}
