import React from "react";
import PropTypes from "prop-types";
import { FiSearch, FiX, FiRefreshCw } from "react-icons/fi";
import "./event-speakers-browser.css";
import EventSpeakersGrid from "./EventSpeakersGrid";
import EventSpeakerQuickView from "./EventSpeakerQuickView";
import EventSpeakersCompareDrawer from "./EventSpeakersCompareDrawer";
import COUNTRIES from "../../../utils/countries";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../lib/hooks/useAuth";

export default function EventSpeakersBrowser({
  heading = "Speakers",
  subheading = "Browse and filter all confirmed speakers.",
  items = [],
  isLoading = false,
  errorText = "",
  isLoggedIn = false,

  // NEW: server-driven mode (search & limit handled by page hook)
  serverMode = false,
  query,
  onQueryChange,
  onlyOpen,
  onOnlyOpenChange,
  country,
  onCountryChange,
  limit,
  onLimitChange,
}) {
  const navigate = useNavigate();
  const { ActorId } = useAuth();

  const onBook = (id) => {
    if (!ActorId) {
      navigate("/login");
      return;
    }
    navigate(`/meeting/${id}`);
  };

  const safe = Array.isArray(items) ? items : [];

  // ---------------- Countries (for dropdown) ----------------
  const getCountry = (s) =>
    (s?.country || s?.personal?.country || s?.identity?.country || "").toString().trim();

  const countryFlagMap = React.useMemo(() => {
    const m = new Map();
    if (Array.isArray(COUNTRIES)) {
      COUNTRIES.forEach((c) => {
        if (c?.name) m.set(c.name.toLowerCase(), c.flag || c.emoji || "");
      });
    } else if (COUNTRIES && typeof COUNTRIES === "object") {
      const obj = COUNTRIES.byName || COUNTRIES;
      Object.entries(obj).forEach(([k, v]) => {
        if (v && typeof v === "object") m.set(k.toLowerCase(), v.flag || v.emoji || "");
        else m.set(k.toLowerCase(), v || "");
      });
    }
    return m;
  }, []);

  const countries = React.useMemo(() => {
    const set = new Set();
    for (const s of safe) {
      const c = getCountry(s);
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) =>
      a?.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [safe]);

  // ---------------- Client-mode (fallback) logic ----------------
  // If serverMode=false we keep old local filtering & infinite reveal.
  const STEP = 24;
  const [qLocal, setQLocal] = React.useState("");
  const [onlyOpenLocal, setOnlyOpenLocal] = React.useState(false);
  const [countryLocal, setCountryLocal] = React.useState("");
  const [sort, setSort] = React.useState("name");
  const [visible, setVisible] = React.useState(STEP);
  const sentinelRef = React.useRef(null);

  // Compute filtered/shown only in client mode
  const filtered = React.useMemo(() => {
    if (serverMode) return safe;
    const text = qLocal.trim().toLowerCase();
    let arr = safe.filter((s) => {
      if (!s) return false;
      const fullName = (s.fullName || "").toLowerCase();
      const org = (s.orgName || s.organization || "").toLowerCase();
      const job = (s.jobTitle || "").toLowerCase();
      const role = (s.BusinessRole || s.businessRole || "").toLowerCase();
      const matchesText =
        !text || fullName.includes(text) || org.includes(text) || job.includes(text) || role.includes(text);
      const matchesOpen = !(onlyOpenLocal) || !!s.openMeetings;
      const c = getCountry(s);
      const matchesCountry = !countryLocal || (c && c.toLowerCase() === countryLocal.toLowerCase());
      return matchesText && matchesOpen && matchesCountry;
    });
    arr.sort((a, b) => {
      const A = (sort === "org" ? a?.orgName : a?.fullName) || "";
      const B = (sort === "org" ? b?.orgName : b?.fullName) || "";
      return A?.localeCompare(B, undefined, { sensitivity: "base" });
    });
    return arr;
  }, [serverMode, safe, qLocal, onlyOpenLocal, countryLocal, sort]);

  React.useEffect(() => {
    if (serverMode) return;
    setVisible(STEP);
  }, [serverMode, qLocal, onlyOpenLocal, countryLocal, sort, items]);

  React.useEffect(() => {
    if (serverMode) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            setVisible((v) => Math.min(v + STEP, filtered.length));
          }
        });
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [serverMode, filtered.length]);

  const shown = React.useMemo(() => {
    if (serverMode) return safe; // server already limited
    return filtered.slice(0, visible);
  }, [serverMode, safe, filtered, visible]);

  // ---------------- Quick View / Compare (unchanged) ----------------
  const [modalIndex, setModalIndex] = React.useState(null);
  const openPreview = (_item, idx) => setModalIndex(idx);
  const closePreview = () => setModalIndex(null);
  const current = typeof modalIndex === "number" ? shown[modalIndex] : null;
  const onPrev = typeof modalIndex === "number" && modalIndex > 0 ? () => setModalIndex((i) => i - 1) : undefined;
  const onNext =
    typeof modalIndex === "number" && modalIndex < shown.length - 1
      ? () => setModalIndex((i) => i + 1)
      : undefined;
  const readMoreHref = (s) => `/profile/${s?._id || s?.id || ""}`;

  const [selected, setSelected] = React.useState([]);
  const selectedIds = React.useMemo(() => new Set(selected.map((s) => s?._id || s?.id)), [selected]);
  const toggleSelect = (item) => {
    const id = item?._id || item?.id;
    if (!id) return;
    setSelected((cur) => {
      const has = cur.some((x) => (x?._id || x?.id) === id);
      if (has) return cur.filter((x) => (x?._id || x?.id) !== id);
      if (cur.length >= 3) return cur;
      return [...cur, item];
    });
  };
  const removeSel = (item) =>
    setSelected((cur) => cur.filter((x) => (x?._id || x?.id) !== (item?._id || item?.id)));
  const clearSel = () => setSelected([]);

  // Reset
  const onReset = () => {
    if (serverMode) {
      onQueryChange?.("");
      onOnlyOpenChange?.(false);
      onCountryChange?.("");
      onLimitChange?.(24);
      return;
    }
    setQLocal("");
    setOnlyOpenLocal(false);
    setCountryLocal("");
    setSort("name");
  };

  // Helpers for toolbar bindings (controlled vs uncontrolled)
  const qValue = serverMode ? (query ?? "") : qLocal;
  const setQValue = serverMode ? onQueryChange : setQLocal;

  const onlyOpenValue = serverMode ? !!onlyOpen : onlyOpenLocal;
  const setOnlyOpenValue = serverMode ? onOnlyOpenChange : setOnlyOpenLocal;

  const countryValue = serverMode ? (country ?? "") : countryLocal;
  const setCountryValue = serverMode ? onCountryChange : setCountryLocal;

  const limitValue = serverMode ? (limit ?? 24) : undefined; // only shown in server mode

  return (
    <section className="esb">
      <div className="esb-container esb-with-rail">
        <div className="esb-maincol">
          <header className="esb-head">
            <h2 className="esb-title">{heading}</h2>
            {subheading ? <p className="esb-sub">{subheading}</p> : null}
          </header>

          {/* TOOLBAR */}
          <div className={`esb-toolbar is-open`}>
            <div className="esb-row">
              {/* Search (drives server or client) */}
              <div className="esb-search">
                <FiSearch className="esb-ico" />
                <input
                  className="esb-input"
                  value={qValue}
                  onChange={(e) => setQValue?.(e.target.value)}
                  placeholder="Search by name, company, title, or role…"
                  aria-label="Search speakers"
                />
                {qValue ? (
                  <button
                    type="button"
                    className="esb-clear"
                    onClick={() => setQValue?.("")}
                    aria-label="Clear search"
                  >
                    <FiX />
                  </button>
                ) : null}
              </div>

              {/* Country (optional server param) */}
              <div className="esb-country" aria-label="Country filter">
                <label htmlFor="esb-country">Country</label>
                <select
                  id="esb-country"
                  className="esb-select"
                  value={countryValue}
                  onChange={(e) => setCountryValue?.(e.target.value)}
                >
                  <option value="">All countries</option>
                  {countries.map((c) => {
                    const flag = countryFlagMap.get(c.toLowerCase()) || "";
                    return (
                      <option key={c} value={c}>
                        {flag ? `${flag} ` : ""}{c}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Limit (server-side page size) */}
              {serverMode ? (
                <div className="esb-limit" aria-label="Limit">
                  <label htmlFor="esb-limit">Limit</label>
                  <select
                    id="esb-limit"
                    className="esb-select"
                    value={String(limitValue)}
                    onChange={(e) => onLimitChange?.(Number(e.target.value))}
                  >
                    {[12, 24, 48, 96].map((n) => (
                      <option key={n} value={n}>
                        {n} / page
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <div id="esb-advanced" className="esb-adv">
              <div className="esb-tabs">
                <button
                  type="button"
                  className={`esb-tab ${!onlyOpenValue ? "is-active" : ""}`}
                  onClick={() => setOnlyOpenValue?.(false)}
                  aria-pressed={!onlyOpenValue}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`esb-tab ${onlyOpenValue ? "is-active" : ""}`}
                  onClick={() => setOnlyOpenValue?.(true)}
                  aria-pressed={onlyOpenValue}
                >
                  Open to meetings
                </button>
              </div>

              {!serverMode && (
                <div className="esb-end">
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
                </div>
              )}

              <button
                type="button"
                className="esb-reset"
                onClick={onReset}
                title="Reset filters"
                style={{ marginLeft: "auto" }}
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>

          {/* GRID */}
          <EventSpeakersGrid
            heading="All Speakers"
            subheading=""
            items={shown}
            onBook={onBook}
            isLoading={isLoading}
            errorText={errorText}
            isLoggedIn={isLoggedIn}
            onPreview={(it, idx) => openPreview(it, idx)}
            getReadMoreHref={(s) => `/profile/${s?._id || s?.id || ""}`}
            anchorMap={{}} // anchors optional in server mode
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            sentinelRef={serverMode ? undefined : sentinelRef}
          />
        </div>
      </div>

      {/* Quick View & Compare drawers unchanged */}
      <EventSpeakerQuickView
        open={typeof modalIndex === "number"}
        item={current}
        index={modalIndex ?? 0}
        total={shown.length}
        onClose={closePreview}
        onPrev={onPrev}
        onNext={onNext}
        onReadMore={() => {
          const href = current ? readMoreHref(current) : "#";
          if (href && href !== "#") window.location.assign(href);
        }}
        onBook={onBook}
        onMessage={() => alert("Message: TODO")}
        isLoggedIn={isLoggedIn}
      />

      <EventSpeakersCompareDrawer
        items={selected}
        onRemove={removeSel}
        onClear={clearSel}
        open={selected.length > 0}
        onClose={clearSel}
      />
    </section>
  );
}

EventSpeakersBrowser.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.array,
  isLoading: PropTypes.bool,
  errorText: PropTypes.string,
  isLoggedIn: PropTypes.bool,
  serverMode: PropTypes.bool,
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
  onlyOpen: PropTypes.bool,
  onOnlyOpenChange: PropTypes.func,
  country: PropTypes.string,
  onCountryChange: PropTypes.func,
  limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onLimitChange: PropTypes.func,
};
