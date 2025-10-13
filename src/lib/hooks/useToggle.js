import { useCallback, useState } from "react";
export default function useToggle(initial = false){
  const [open, setOpen] = useState(initial);
  const toggle = useCallback(() => setOpen(v => !v), []);
  const close  = useCallback(() => setOpen(false), []);
  const openFn = useCallback(() => setOpen(true), []);
  return { open, toggle, close, openFn, setOpen };
}
