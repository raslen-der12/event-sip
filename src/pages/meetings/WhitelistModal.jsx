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
import { useTranslation } from "react-i18next";

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

const ALLOWED_TIMES = [
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

function isSlotAllowed(iso) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return ALLOWED_TIMES.includes(`${h}:${m}`);
}

export default function WhitelistModal({
  eventId = "68e6764bb4f9b08db3ccec04",
  date = "2025-11-13",
  open: openProp,
  onClose,
  autoOpen = false,
}) {
  const { t } = useTranslation("common", { keyPrefix: "whitelist" });
  const { ActorId } = useAuth();
  const sp = useMemo(() => new URLSearchParams(window.location.search), []);
  const qpOpen = readBoolQP(sp.get("open"));
  const qpAuto = autoOpen;

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
    if (!actorHasWhitelist && qpAuto) return true;
    if (qpOpen) return true;
    return !!openProp;
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
      .filter(isSlotAllowed)
      .sort((a, b) => new Date(a) - new Date(b));
  }, [slotsRaw]);

  const [picked, setPicked] = useState(() => new Set());

  useEffect(() => {
    if (!resolvedOpen) return;

    if (!actorHasWhitelist && qpAuto) {
      setPicked(new Set(freeGrid));
      return;
    }
    if (actorHasWhitelist && Array.isArray(myWl?.data)) {
      const validPrev = myWl.data.filter((s) => freeGrid.includes(s));
      setPicked(new Set(validPrev));
    }
  }, [resolvedOpen, actorHasWhitelist, qpAuto, freeGrid, myWl?.data]);

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
          t("whitelistSaveError")
      );
    }
  };

  if (!resolvedOpen) return null;

  const modal = (
    <div className="wlm-root" role="dialog" aria-modal="true" aria-label={t("whitelistModalTitle")}>
      <div className="wlm-backdrop" onClick={() => onClose?.(false)} />
      <div className="wlm-sheet" data-testid="whitelist-modal">
        <div className="wlm-header">
          <div className="wlm-title">
            {t("whitelistEditTitle")}{" "}
            <span className="wlm-sub" style={{ fontSize: "1.1em", fontWeight: "600" }}>
              {t("whitelistForDate", { date })}
            </span>
          </div>
          <button className="wlm-close" onClick={() => onClose?.(false)} aria-label={t("close")}>
            X
          </button>
        </div>

        <div className="wlm-body" ref={wrapRef}>
          <p className="wlm-help">
            {t("whitelistHelp")}
          </p>

          {slotsLoading ? (
            <div className="wlm-empty">{t("loadingSlots")}</div>
          ) : !freeGrid.length ? (
            <div className="wlm-empty">{t("noSlotsAvailable")}</div>
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
                    style={{ fontSize: "1.05em" }}
                  >
                    <input type="checkbox" readOnly checked={on} />
                    <span>{timeLabel(iso)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="wlm-footer">
          <button
            className="wlm-action"
            disabled={saving || wlLoading}
            onClick={submit}
          >
            {saving ? t("saving") : t("saveCount", { count: picked.size })}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

WhitelistModal.propTypes = {
  eventId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  autoOpen: PropTypes.bool,
};