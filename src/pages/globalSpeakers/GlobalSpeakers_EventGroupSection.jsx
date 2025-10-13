import React from "react";
import PropTypes from "prop-types";
import EventSpeakersGrid from "../../components/event/speakers/EventSpeakersGrid";
import EventMetaBar from "./GlobalSpeakers_EventMetaBar";

/** One event header + its speakers grid + 'Show more' pagination */
export default function EventGroupSection({
  anchorId,
  eventId,
  eventMeta,
  count = 0,
  items = [],
  isLoggedIn = false,
  onPreview,             // (item, idx, visibleList)
  getReadMoreHref,
  selectedIds = new Set(),
  onToggleSelect,
  initialCount = 24,
  step = 24
}) {
  const [shown, setShown] = React.useState(Math.min(initialCount, items.length));
  React.useEffect(() => setShown(Math.min(initialCount, items.length)), [items, initialCount]);

  const visible = React.useMemo(() => items.slice(0, shown), [items, shown]);

  const anchorMap = React.useMemo(() => {
    const seen = new Set();
    const map = {};
    visible.forEach((s, idx) => {
      const ch = ((s?.fullName || s?.orgName || "?").trim()[0] || "?").toUpperCase();
      if (/[A-Z]/.test(ch) && !seen.has(ch)) { seen.add(ch); map[idx] = ch; }
    });
    return map;
  }, [visible]);

  const canShowMore = shown < items.length;

  return (
    <section className="gsp-group" id={anchorId || `ev-${eventId}`}>
      <EventMetaBar eventId={eventId} meta={eventMeta} count={count || items.length} />

      <EventSpeakersGrid
        heading="" subheading=""
        items={visible}
        isLoading={false}
        errorText=""
        isLoggedIn={isLoggedIn}
        onPreview={(item, idx) => onPreview?.(item, idx, visible)}
        getReadMoreHref={getReadMoreHref}
        anchorMap={anchorMap}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
      />

      {canShowMore ? (
        <div className="gsp-morewrap">
          <button
            type="button"
            className="gsp-morebtn"
            onClick={() => setShown((v) => Math.min(v + step, items.length))}
          >
            Show more
          </button>
          <div className="gsp-morehint">{shown} / {items.length}</div>
        </div>
      ) : null}
    </section>
  );
}

EventGroupSection.propTypes = {
  anchorId: PropTypes.string,
  eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  eventMeta: PropTypes.object,
  count: PropTypes.number,
  items: PropTypes.array,
  isLoggedIn: PropTypes.bool,
  onPreview: PropTypes.func,
  getReadMoreHref: PropTypes.func,
  selectedIds: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
  initialCount: PropTypes.number,
  step: PropTypes.number
};
