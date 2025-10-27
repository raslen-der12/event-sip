import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { useSetWhitelistMutation } from '../../features/Actor/adminApiSlice';
import { useGetAvailableSlotsQuery } from '../../features/Actor/toolsApiSlice';

function groupByHourISO(isoList) {
  const map = new Map();
  for (const s of isoList) {
    const d = new Date(s);
    const h = d.getUTCHours(); // backend grid is UTC
    if (!map.has(h)) map.set(h, []);
    map.get(h).push(s);
  }
  for (const arr of map.values()) arr.sort();
  return Array.from(map.entries()).sort((a,b)=>a[0]-b[0]);
}

function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

export default function WhitelistModal({ open, onClose, eventId, receiverId, date }) {
  useBodyScrollLock(open);

  const [picked, setPicked] = useState(() => new Set());
  const { data, isFetching } = useGetAvailableSlotsQuery(
    { eventId, date, actorId: receiverId, ignoreWhitelist: true },
    { skip: !open }
  );
  const [setWhitelist, { isLoading: saving }] = useSetWhitelistMutation();

  // normalize shape: {data:[{iso}]} | [{iso}]
  const slots = useMemo(() => {
    const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return arr.map(s => s.iso).filter(Boolean).sort();
  }, [data]);

  // selection helpers (tap + drag)
  const wrapRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragAdd, setDragAdd] = useState(true);

  useEffect(() => {
    const up = () => setDragging(false);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const toggleOne = (iso, force=null) => {
    setPicked(prev => {
      const next = new Set(prev);
      const doAdd = force===true ? true : force===false ? false : !prev.has(iso);
      if (doAdd) next.add(iso); else next.delete(iso);
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

  const grouped = useMemo(() => groupByHourISO(slots), [slots]);

  const submit = async () => {
    if (!slots.length || picked.size === 0) return;
    try {
      await setWhitelist({ eventId, slots: Array.from(picked).sort() }).unwrap();
      onClose(true);
    } catch {
      alert('Failed to save your availability. Please try again.');
    }
  };

  if (!open) return null;

  const modal = (
    <div className="wlm-root" role="dialog" aria-modal="true" aria-label="Select available slots">
      <div className="wlm-backdrop" onClick={() => onClose(false)} />
      <div className="wlm-sheet" data-testid="whitelist-modal">
        {/* Header */}
        <div className="wlm-header">
          <div className="wlm-title">
            Choose your availability
            <span className="wlm-sub">for {date}</span>
          </div>
          <button className="wlm-close" onClick={() => onClose(false)} aria-label="Close">✕</button>
        </div>

        {/* Body (scrollable) */}
        <div className="wlm-body" ref={wrapRef}>
          <p className="wlm-help">
            Tap to select 30-min slots. Drag to select a range. You can edit this later.
          </p>

          {isFetching ? (
            <div className="wlm-empty">Loading slots…</div>
          ) : !slots.length ? (
            <div className="wlm-empty">No free slots on this date.</div>
          ) : (
            <div className="wlm-grid">
              {grouped.map(([hour, arr]) => (
                <section className="wlm-hour" key={hour}>
                  <header className="wlm-hour-head">{String(hour).padStart(2,'0')}:00</header>
                  <div className="wlm-hour-body">
                    {arr.map((iso) => {
                      const dt = new Date(iso);
                      const label = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const isOn = picked.has(iso);
                      return (
                        <button
                          key={iso}
                          type="button"
                          title={label}
                          className={`wlm-chip ${isOn ? 'is-on' : ''}`}
                          onPointerDown={(e)=>onPointerDown(iso, e)}
                          onPointerEnter={()=>onPointerEnter(iso)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Footer (sticky) */}
        <div className="wlm-footer">
          <button className="wlm-action" disabled={saving || picked.size===0} onClick={submit}>
            {saving ? 'Saving…' : `Save ${picked.size || ''} slot${picked.size===1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );

  // Render at body level to avoid being “under the header”
  return ReactDOM.createPortal(modal, document.body);
}

WhitelistModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,   // onClose(success:boolean)
  eventId: PropTypes.string.isRequired,
  receiverId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};
