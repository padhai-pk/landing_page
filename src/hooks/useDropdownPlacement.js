import { useEffect, useState } from 'react';

// Measures the trigger's position and returns fixed-position coordinates
// for a portal-rendered dropdown panel, flipping upward when there isn't
// room below. Rendering via a portal (see SubjectPicker/Autocomplete) is
// what actually fixes panels getting painted behind later sections — a
// panel confined to its own section's stacking context can never appear
// above a later sibling section no matter how high its z-index is.
export default function useDropdownPlacement(open, triggerRef, estimatedHeight = 340) {
  const [rect, setRect] = useState(null);
  const [placement, setPlacement] = useState('down');

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function measure() {
      const r = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      setPlacement(spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'up' : 'down');
      setRect(r);
    }

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, triggerRef, estimatedHeight]);

  if (!rect) return { style: null, placement };

  const style = {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    zIndex: 1000,
    ...(placement === 'down'
      ? { top: rect.bottom + 8 }
      : { bottom: window.innerHeight - rect.top + 8 }),
  };

  return { style, placement };
}