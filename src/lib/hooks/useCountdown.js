import { useEffect, useMemo, useState } from "react";

export default function useCountdown(targetISO) {
  const target = useMemo(() => (targetISO ? new Date(targetISO).getTime() : null), [targetISO]);
  const getLeft = () => {
    const now = Date.now();
    const d = Math.max(0, (target ?? now) - now);
    const days = Math.floor(d / (24 * 3600e3));
    const hours = Math.floor((d % (24 * 3600e3)) / 3600e3);
    const minutes = Math.floor((d % 3600e3) / 60e3);
    const seconds = Math.floor((d % 60e3) / 1e3);
    return { days, hours, minutes, seconds, done: d === 0 };
  };
  const [left, setLeft] = useState(getLeft);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setLeft(getLeft()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [targetISO]);
  return left;
}
