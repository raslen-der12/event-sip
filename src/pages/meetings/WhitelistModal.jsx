// src/pages/meetings/WhitelistModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import { useGetAvailableSlotsQuery } from "../../features/Actor/toolsApiSlice";

import {
  useGetMyWhitelistQuery,
  useUpsertMyWhitelistMutation,
} from "../../features/meetings/meetingsApiSlice";
import useAuth from "../../lib/hooks/useAuth";

/** Utils */
function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}
function readBoolQP(v) {
  if (!v) return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}
function timeLabel(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}


export default function WhitelistModal({
  eventId ="68e6764bb4f9b08db3ccec04",
  date = "2025-11-13",
  open: openProp,
  onClose,
  autoOpen = false,
}) {
  const { ActorId } = useAuth();
  const sp = useMemo(() => new URLSearchParams(window.location.search), []);
  const qpOpen = readBoolQP(sp.get("open"));
  const qpAuto = autoOpen

  const { data: slotsRaw, isFetching: slotsLoading } = useGetAvailableSlotsQuery(
    { eventId, date, actorId: ActorId, ignoreWhitelist: true },
    { skip: !eventId || !ActorId || !date }
  );

  const { data: myWl, isFetching: wlLoading } = useGetMyWhitelistQuery(
    { eventId, date, actorId: ActorId },
    { skip: !eventId || !date || !ActorId }
  );

  const actorHasWhitelist = !!myWl?.hasWhitelist;
  const resolvedOpen = useMemo(() => {
    if (!actorHasWhitelist && qpAuto) return true;  // auto-open only when no whitelist
    if (qpOpen) return true;                        // explicit open wins
    return !!openProp;                              // fallback to prop
  }, [actorHasWhitelist, qpAuto, qpOpen, openProp]);

  useBodyScrollLock(resolvedOpen);

  const freeGrid = useMemo(() => {
    const arr =
      (Array.isArray(slotsRaw?.data) && slotsRaw.data) ||
      (Array.isArray(slotsRaw) && slotsRaw) ||
      [];
    return arr
      .map((r) => (typeof r === "string" ? r : r?.iso || r?.slotISO || r?.startISO))
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b));
  }, [slotsRaw]);

  // Local selection state
  const [picked, setPicked] = useState(() => new Set());


  useEffect(() => {
    if (!resolvedOpen) return;

    if (!actorHasWhitelist && qpAuto) {
      setPicked(new Set(freeGrid));
      return;
    }
    if (actorHasWhitelist && Array.isArray(myWl?.data)) {
      setPicked(new Set(myWl.data));
      return;
    }
    // otherwise leave empty
  }, [resolvedOpen, actorHasWhitelist, qpAuto, freeGrid, myWl?.data]);

  // Drag-select (optional)
  const wrapRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragAdd, setDragAdd] = useState(true);

  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const toggleOne = (iso, force = null) => {
    setPicked((prev) => {
      const next = new Set(prev);
      const willAdd = force === true ? true : force === false ? false : !prev.has(iso);
      if (willAdd) next.add(iso);
      else next.delete(iso);
      return next;
    });
  };
  const onPointerDown = (iso, e) => {
    e.preventDefault();
    const willAdd = !picked.has(iso);
    setDragAdd(willAdd);
    setDragging(true);
    toggleOne(iso, willAdd);
  };
  const onPointerEnter = (iso) => {
    if (!dragging) return;
    toggleOne(iso, dragAdd);
  };

  const [saveWhitelist, { isLoading: saving }] = useUpsertMyWhitelistMutation();

  const submit = async () => {
    if (!picked.size) {

    }
    try {
      await saveWhitelist({
        actorId: ActorId,
        eventId,
        date,
        slots: Array.from(picked).sort(),
      }).unwrap();
      onClose?.(true);
    } catch (e) {
      alert(
        e?.data?.message ||
          e?.message ||
          "Failed to save your availability. Please try again."
      );
    }
  };

  if (!resolvedOpen) return null;

  const modal = (
    <div className="wlm-root" role="dialog" aria-modal="true" aria-label="Edit availability">
      <div className="wlm-backdrop" onClick={() => onClose?.(false)} />
      <div className="wlm-sheet" data-testid="whitelist-modal">
        {/* Header */}
        <div className="wlm-header">
          <div className="wlm-title">
            Edit your availability <span className="wlm-sub">for {date}</span>
          </div>
          <button className="wlm-close" onClick={() => onClose?.(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="wlm-body" ref={wrapRef}>
          <p className="wlm-help">
            Click to toggle 30-min slots. Drag across slots to select a range.
          </p>

          {slotsLoading ? (
            <div className="wlm-empty">Loading slots…</div>
          ) : !freeGrid.length ? (
            <div className="wlm-empty">No free slots on this date.</div>
          ) : (
            <div className="wlm-chip-grid">
              {freeGrid.map((iso) => {
                const on = picked.has(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`mx-1 wlm-chip ${on ? "is-on" : ""}`}
                    title={iso}
                    onPointerDown={(e) => onPointerDown(iso, e)}
                    onPointerEnter={() => onPointerEnter(iso)}
                  >
                    <input type="checkbox" readOnly checked={on} />
                    <span>{timeLabel(iso)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wlm-footer">
          <button className="wlm-action" disabled={saving || wlLoading} onClick={submit}>
            {saving ? "Saving…" : `Save (${picked.size})`}
          </button>
        </div>

        {/* Scoped styles */}
        
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

WhitelistModal.propTypes = {
  eventId: PropTypes.string.isRequired,
  receiverId: PropTypes.string.isRequired, // other participant (for slot grid)
  date: PropTypes.string.isRequired,       // YYYY-MM-DD (UTC day)
  open: PropTypes.bool,                    // optional; URL params can still open
  onClose: PropTypes.func.isRequired,      // (ok:boolean)=>void
};
