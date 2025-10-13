import { useEffect, useState } from "react";

export default function useScrollElevate(threshold = 8) {
  const [elevated, setElevated] = useState(false);
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return elevated;
}
