import { useEffect, useRef, useState } from "react";

/**
 * Returns {x, y, rotate} transforms based on mouse position.
 * Attach the returned "ref" to the container you want to track.
 */
export default function useParallax(strength = 10, rotateStrength = 6) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0, rotate: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setT({
        x: -(dx * strength),
        y: -(dy * strength),
        rotate: dx * rotateStrength,
      });
    };

    const onLeave = () => setT({ x: 0, y: 0, rotate: 0 });

    window.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength, rotateStrength]);

  return { ref, t };
}
