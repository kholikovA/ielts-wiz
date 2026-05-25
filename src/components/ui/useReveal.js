import { useEffect, useRef } from 'react';

// Scroll-reveal hook. Attach the returned ref to any element with class="reveal";
// when it scrolls into view, data-reveal="in" is set and CSS animates it in.
// Once revealed, the observer disconnects — the element stays visible.
export default function useReveal(options = {}) {
  const ref = useRef(null);
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.setAttribute('data-reveal', 'in');
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.setAttribute('data-reveal', 'in');
            obs.unobserve(el);
          }
        });
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
