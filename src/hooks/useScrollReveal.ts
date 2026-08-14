import { useEffect, useRef } from 'react';

/**
 * Lightweight IntersectionObserver hook for 60fps scroll reveal
 * Automatically unobserves elements after they enter viewport
 */
export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            obs.unobserve(entry.target); // Stop observing revealed element for maximum performance
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px 50px 0px',
      }
    );

    const targets = container.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return containerRef;
}
