import { useEffect, useRef, useState } from 'react';

// Smoothly animates a displayed number from 0 up to `target`. Replays
// whenever `target` changes (e.g. a live Firestore counter ticking up).
export default function useCountUp(target, duration = 1200) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = typeof target === 'number' ? target : 0;
    if (from === to) return;

    const start = performance.now();
    cancelAnimationFrame(rafRef.current);

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (to - from) * eased);
      setDisplay(value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}