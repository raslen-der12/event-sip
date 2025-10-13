import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./overview.css";

/** Accessible pill tabs with keyboard support (Left/Right/Home/End + Enter/Space) */
export default function PillTabs({ tabs, defaultActiveId, onChange }) {
  const [active, setActive] = useState(defaultActiveId ?? tabs?.[0]?.id);
  const listRef = useRef(null);
  const btnRefs = useRef([]);
  const groupId = useId();

  useEffect(() => { onChange?.(active); }, [active, onChange]);

  const idxMap = useMemo(
    () => Object.fromEntries(tabs.map((t, i) => [t.id, i])),
    [tabs]
  );

  const onKeyDown = (e) => {
    const cur = idxMap[active] ?? 0;
    const max = tabs.length - 1;
    let next = cur;
    switch (e.key) {
      case "ArrowRight": next = cur === max ? 0 : cur + 1; break;
      case "ArrowLeft":  next = cur === 0 ? max : cur - 1; break;
      case "Home":       next = 0; break;
      case "End":        next = max; break;
      case "Enter":
      case " ":
        e.preventDefault(); setActive(tabs[cur].id); return;
      default: return;
    }
    e.preventDefault();
    const id = tabs[next].id;
    setActive(id);
    btnRefs.current[next]?.focus();
  };

  return (
    <div className="pilltabs">
      <div
        className="pilltabs-row"
        role="tablist"
        aria-label="Overview tabs"
        aria-orientation="horizontal"
        ref={listRef}
        onKeyDown={onKeyDown}
      >
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              className={`pill ${selected ? "is-active" : ""}`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${groupId}-${t.id}-panel`}
              id={`${groupId}-${t.id}-tab`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              ref={(el) => (btnRefs.current[i] = el)}
              type="button"
            >
              {t.icon ? <span className="pill-ic" aria-hidden="true">{t.icon}</span> : null}
              {t.label}
            </button>
          );
        })}
      </div>
      {/* active id for parent */}
      <input type="hidden" value={active} readOnly />
    </div>
  );
}

PillTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, icon: PropTypes.node })
  ).isRequired,
  defaultActiveId: PropTypes.string,
  onChange: PropTypes.func,
};
