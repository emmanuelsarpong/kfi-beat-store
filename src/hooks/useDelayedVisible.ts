import { useEffect, useRef, useState } from "react";

/**
 * useDelayedVisible
 * Returns a boolean that becomes true if `active` stays true for at least `delay` ms.
 * Prevents flashing spinners for very fast async operations while still
 * guaranteeing a fallback after the delay (default 500ms).
 */
export function useDelayedVisible(active: boolean, delay = 500) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) {
      timerRef.current = window.setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [active, delay]);

  return visible;
}
