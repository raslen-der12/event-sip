import React from "react";
import PropTypes from "prop-types";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
} from "react-icons/fi";
import "./event-attendees-browser.css";
import EventAttendeesGrid from "./EventAttendeesGrid";
import EventAttendeeQuickView from "./EventAttendeeQuickView";
import EventAttendeesCompareDrawer from "./EventAttendeesCompareDrawer";

/**
 * When `serverMode` is true, this component uses the controlled
 * props (query/onlyOpen/limit) and does NOT apply local filtering or
 * infinite scroll slicing. In client mode (default), it keeps the previous
 * behavior with local search/filter/sort and infinite scroll.
 */
export default function EventAttendeesBrowser({
  heading = "Attendees",
  subheading = "Browse and filter all confirmed attendees.",
  items = [],
  isLoading = false,
  errorText = "",
  isLoggedIn = false,
  onBook,

  // server mode controls
  serverMode = false,
  query,
  onQueryChange,
  onlyOpen,
  onOnlyOpenChange,
  limit,
  onLimitChange,
}) {
  const safe = Array.isArray(items) ? items : [];

  // ---------- CLIENT-MODE STATE ----------
  const [qLocal, setQLocal] = React.useState("");
  const [onlyOpenLocal, setOnlyOpenLocal] = React.useState(false);
  const [sort, setSort] = React.useState("name");
  const [expanded, setExpanded] = React.useState(false);

  // infinite scroll (client mode only)
  const STEP = 24;
  const [visible, setVisible] = React.useState(STEP);
  const sentinelRef = React.useRef(null);

  // QuickView
  const [modalIndex, setModalIndex] = React.useState(null);

  // Compare
  const [selected, setSelected] = React.useState([]); // array of attendee objs, max 3

  // ---------- FILTERING ----------
  const clientFiltered = React.useMemo(() => {
    if (serverMode) return safe;
    const text = qLocal.trim().toLowerCase();
    const filtered = safe
      .filter((s) => {
        if (!s) return false;
        const fullName = (s.fullName || "").toLowerCase();
        const org = (s.orgName || s.organization || "").toLowerCase();
        const job = (s.jobTitle || "").toLowerCase();
        const role = (s.BusinessRole || s.businessRole || "").toLowerCase();

        const matchesText =
          !text ||
          fullName.includes(text) ||
          org.includes(text) ||
          job.includes(text) ||
          role.includes(text);
        const matchesOpen = !onlyOpenLocal || !!s.openMeetings;
        return matchesText && matchesOpen;
      })
      .sort((a, b) => {
        const A = (sort === "org" ? a?.orgName : a?.fullName) || "";
        const B = (sort === "org" ? b?.orgName : b?.fullName) || "";
        return A?.localeCompare(B, undefined, { sensitivity: "base" });
      });
    return filtered;
  }, [serverMode, safe, qLocal, onlyOpenLocal, sort]);

  // Show list
  const currentList = serverMode ? safe : clientFiltered;

  // ---------- INFINITE (client mode only) ----------
  React.useEffect(() => {
    if (serverMode) return; // no local paging in server mode
    setVisible(STEP);
  }, [serverMode, qLocal, onlyOpenLocal, sort, items]);

  React.useEffect(() => {
    if (serverMode) return; // do not attach observer in server mode
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setVisible((v) => Math.min(v + STEP, clientFiltered.length));
          }
        });
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [serverMode, clientFiltered.length]);

  const shown = React.useMemo(
    () => (serverMode ? currentList : currentList.slice(0, visible)),
    [serverMode, currentList, visible]
  );

  // A–Z map for anchors (first idx per letter)
  const anchorMap = React.useMemo(() => {
    const seen = new Set();
    const map = {};
    shown.forEach((s, idx) => {
      const ch = ((s?.fullName || s?.orgName || "?").trim()[0] || "?").toUpperCase();
      if (/[A-Z]/.test(ch) && !seen.has(ch)) {
        seen.add(ch);
        map[idx] = ch;
      }
    });
    return map;
  }, [shown]);

  // QuickView handlers
  const openPreview = (item, idx) => setModalIndex(idx);
  const closePreview = () => setModalIndex(null);
  const current = typeof modalIndex === "number" ? shown[modalIndex] : null;
  const onPrev =
    typeof modalIndex === "number" && modalIndex > 0
      ? () => setModalIndex((i) => i - 1)
      : undefined;
  const onNext =
    typeof modalIndex === "number" && modalIndex < shown.length - 1
      ? () => setModalIndex((i) => i + 1)
      : undefined;
  const readMoreHref = (s) => `/profile/${s?._id || s?.id || ""}`;

  // Compare handlers
  const selectedIds = React.useMemo(
    () => new Set(selected.map((s) => s?._id || s?.id)),
    [selected]
  );
  const toggleSelect = (item) => {
    const id = item?._id || item?.id;
    if (!id) return;
    setSelected((cur) => {
      const has = cur.find((x) => (x?._id || x?.id) === id);
      if (has) return cur.filter((x) => (x?._id || x?.id) !== id);
      if (cur.length >= 3) return cur;
      return [...cur, item];
    });
  };
  const removeSel = (item) =>
    setSelected((cur) => cur.filter((x) => (x?._id || x?.id) !== (item?._id || item?.id)));
  const clearSel = () => setSelected([]);

  // Reset filters
  const onReset = () => {
    if (serverMode) {
      onQueryChange?.("");
      onOnlyOpenChange?.(false);
      onLimitChange?.(24);
    } else {
      setQLocal("");
      setOnlyOpenLocal(false);
      setSort("name");
    }
  };

  // Controlled vs local bindings
  const qVal = serverMode ? (query ?? "") : qLocal;
  const setQVal = serverMode ? onQueryChange : setQLocal;

  const onlyOpenVal = serverMode ? !!onlyOpen : onlyOpenLocal;
  const setOnlyOpenVal = serverMode ? onOnlyOpenChange : setOnlyOpenLocal;

  const limitVal = serverMode ? (limit ?? 24) : undefined;

  if (isLoading) {
    return (
      <section className="esb">
        <div className="esb-container esb-with-rail">
          <div className="esb-maincol">
            <header className="esb-head">
              <h2 className="esb-title">{heading}</h2>
              {subheading ? <p className="esb-sub">{subheading}</p> : null}
            </header>
            <div className="esb-skel-list">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="esb-skel" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (errorText) {
    return (
      <section className="esb">
        <div className="esb-container esb-with-rail">
          <div className="esb-maincol">
            <header className="esb-head">
              <h2 className="esb-title">{heading}</h2>
              {subheading ? <p className="esb-sub">{subheading}</p> : null}
            </header>
            <div className="esb-empty">{errorText}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="esb">
      <div className="esb-container esb-with-rail">
        {/* Left content */}
        <div className="esb-maincol">
          {/* Head */}
          <header className="esb-head">
            <h2 className="esb-title">{heading}</h2>
            {subheading ? <p className="esb-sub">{subheading}</p> : null}
          </header>

          {/* Toolbar */}
          <div className={`esb-toolbar ${expanded ? "is-open" : ""}`}>
            <div className="esb-row">
              <div className="esb-search">
                <FiSearch className="esb-ico" />
                <input
                  className="esb-input"
                  value={qVal}
                  onChange={(e) => setQVal?.(e.target.value)}
                  placeholder="Search by name, company, title, or role…"
                  aria-label="Search attendees"
                />
                {qVal ? (
                  <button
                    type="button"
                    className="esb-clear"
                    onClick={() => setQVal?.("")}
                    aria-label="Clear search"
                  >
                    <FiX />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="esb-tgl"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded ? "true" : "false"}
                aria-controls="esb-advanced"
              >
                <FiFilter />
                Filters
                {expanded ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>

            <div id="esb-advanced" className="esb-adv">
              <div className="esb-tabs">
                <button
                  type="button"
                  className={`esb-tab ${!onlyOpenVal ? "is-active" : ""}`}
                  onClick={() => setOnlyOpenVal?.(false)}
                  aria-pressed={!onlyOpenVal}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`esb-tab ${onlyOpenVal ? "is-active" : ""}`}
                  onClick={() => setOnlyOpenVal?.(true)}
                  aria-pressed={onlyOpenVal}
                >
                  Open to meetings
                </button>
              </div>

              <div className="esb-end">
                {/* Sort (client mode only) */}
                {!serverMode ? (
                  <>
                    <label className="esb-sortlab" htmlFor="esb-sort">
                      Sort by
                    </label>
                    <select
                      id="esb-sort"
                      className="esb-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="name">Name</option>
                      <option value="org">Organization</option>
                    </select>
                  </>
                ) : null}

                {/* Limit (server mode only) */}
                {serverMode ? (
                  <select
                    className="esb-select"
                    value={String(limitVal)}
                    onChange={(e) => onLimitChange?.(Number(e.target.value))}
                    aria-label="Page size"
                  >
                    {[12, 24, 48, 96].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                ) : null}

                <button
                  type="button"
                  className="esb-reset"
                  onClick={onReset}
                  title="Reset filters"
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <EventAttendeesGrid
            heading="All Attendees"
            subheading=""
            items={shown}
            isLoading={isLoading}
            errorText={errorText}
            isLoggedIn={isLoggedIn}
            onPreview={openPreview}
            getReadMoreHref={(s) => `/profile/${s?._id || s?.id || ""}`}
            anchorMap={anchorMap}
            selectedIds={new Set(selected.map((s) => s?._id || s?.id))}
            onToggleSelect={toggleSelect}
            sentinelRef={serverMode ? undefined : sentinelRef}
          />
        </div>
      </div>

      {/* Quick View Modal */}
      <EventAttendeeQuickView
        open={typeof modalIndex === "number"}
        item={current}
        index={modalIndex ?? 0}
        total={shown.length}
        onClose={closePreview}
        onPrev={onPrev}
        onNext={onNext}
        onReadMore={() => {
          const href = current ? `/profile/${current?._id || current?.id || ""}` : "#";
          if (href && href !== "#") window.location.assign(href);
        }}
        onBook={onBook}
        onMessage={(id) => {
          const href = `/messages?member=${id}`;;
          window.location.assign(href);
        }}
        isLoggedIn={isLoggedIn}
      />

      {/* Compare drawer */}
      <EventAttendeesCompareDrawer
        items={selected}
        onRemove={removeSel}
        onClear={clearSel}
        open={selected.length > 0}
        onClose={clearSel}
      />
    </section>
  );
}

EventAttendeesBrowser.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.array,
  isLoading: PropTypes.bool,
  errorText: PropTypes.string,
  isLoggedIn: PropTypes.bool,
  onBook: PropTypes.func,

  serverMode: PropTypes.bool,
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
  onlyOpen: PropTypes.bool,
  onOnlyOpenChange: PropTypes.func,
  limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onLimitChange: PropTypes.func,
};
