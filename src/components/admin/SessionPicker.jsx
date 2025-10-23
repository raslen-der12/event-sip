import React, { useMemo } from "react";
import "./session-picker.css";

function pct(taken = 0, cap = 0) {
  if (!cap) return 0;
  const p = Math.round((Number(taken) / Number(cap)) * 100);
  return Math.max(0, Math.min(100, p));
}

export default function SessionPicker({
  sessions = [],           // [{ _id, title, track, startAt, endAt, room:{name,capacity}, seatsTaken }]
  selectedIds = [],        // string[]
  onToggle,                // (session) => void
  title = "Select sessions",
  hint  = "Masterclass & Atelier can be combined; others are exclusive per time slot."
}) {
  const byTrack = useMemo(() => {
    const m = new Map();
    sessions.forEach(s => {
      const k = (s.track || "Session").trim();
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(s);
    });
    for (const arr of m.values()) {
      arr.sort((a,b) => new Date(a.startAt) - new Date(b.startAt));
    }
    return Array.from(m.entries());
  }, [sessions]);

  return (
    <div className="sp-wrap">
      <div className="sp-head">
        <div className="sp-title">{title}</div>
        {hint ? <div className="sp-hint">{hint}</div> : null}
      </div>

      {!byTrack.length ? (
        <div className="sp-empty">No sessions available.</div>
      ) : (
        byTrack.map(([track, items]) => (
          <section key={track} className="sp-section">
            <div className="sp-sep">{track}</div>
            <div className="sp-grid">
              {items.map((s) => {
                const sid = String(s._id || s.id);
                const sel = selectedIds.includes(sid);
                const cap = Number(s?.room?.capacity || 0);
                const taken = Number(s?.seatsTaken || 0);
                const bar = pct(taken, cap);
                const start = new Date(s.startAt);
                const end   = s.endAt ? new Date(s.endAt) : null;
                const full  = cap > 0 && taken >= cap;

                return (
                  <article
                    key={sid}
                    className={`sp-card ${sel ? "is-selected" : ""} ${full ? "is-full" : ""}`}
                    onClick={() => onToggle?.(s)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onToggle?.(s); }}
                    title={s.title}
                  >
                    <div className="sp-card-head">
                      <div className="sp-name" title={s.title}>
                        {String(s.title || "Session").length > 120
                          ? String(s.title).slice(0, 120) + "…"
                          : (s.title || "Session")}
                      </div>
                      <div className="sp-chipline">
                        {s?.room?.name ? <span className="sp-chip">Room: {s.room.name}</span> : null}
                        <span className="sp-chip">
                          {start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                          {" • "}
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {end ? ` – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                        </span>
                      </div>
                    </div>

                    {(cap || taken) ? (
                      <div className="sp-cap">
                        <div className="sp-cap-line"><div className="sp-cap-bar" style={{ width: `${bar}%` }} /></div>
                        <div className="sp-cap-meta">
                          <span><b>{taken}</b> registered</span>
                          {cap ? <span>• <b>{cap}</b> capacity</span> : null}
                          {full ? <span className="sp-full">• Full</span> : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="sp-actions">
                      <button
                        type="button"
                        className={`sp-btn ${sel ? "-sel" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onToggle?.(s); }}
                      >
                        {sel ? "Selected" : "Select"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
