// src/components/event/exhibitors/EventExhibitorsGallery.jsx
import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  FiFilter,
  FiInfo,
  FiExternalLink,
  FiMessageCircle,
  FiUserPlus,
  FiZap,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import "./exhibitors.css";
import ExhibitorQuickView from "./ExhibitorQuickView";
import CompareDrawer from "./CompareDrawer";
import imageLink from "../../../utils/imageLink";

/* ---------- helpers ---------- */
function normIndustry(v) {
  if (Array.isArray(v)) return String(v[0] || "").trim();
  if (v && typeof v === "object") return String(v.name || v.label || "").trim();
  return String(v ?? "").trim();
}
function normItem(r) {
  const id = String(r?.ownerId || r?.id || r?._id || r?.owner?.actor || "").trim();
  const name = String(r?.name || r?.orgName || "—");
  const logo = r?.logoUpload || r?.logo || null;
  const industry = r?.industry ? normIndustry(r.industry) : normIndustry(r?.industries);
  const offering = String(r?.tagline || r?.offering || "");
  const openToMeet = !!r?.openToMeet; // public feed typically false/absent
  const createdAt = r?.createdAt ? new Date(r.createdAt) : null;
  const slug = String(r?.slug || "");
  return { id, name, logo, industry, offering, openToMeet, createdAt, slug, _raw: r };
}
function initials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  const a = (parts[0] || "").charAt(0);
  const b = (parts[1] || "").charAt(0);
  return (a + b).toUpperCase() || (a || "?").toUpperCase();
}
function Avatar({ src, name }) {
  const style = src ? { backgroundImage: `url(${imageLink(src)})` } : {};
  return (
    <div
      className="w-12 h-12 rounded-full bg-zinc-200 bg-center bg-cover flex items-center justify-center shrink-0"
      style={style}
    >
      {!src && <span className="text-xs font-semibold text-zinc-600">{initials(name)}</span>}
    </div>
  );
}
function Header({ heading, subheading }) {
  return (
    <header className="exg-head">
      <h2 className="exg-title">{heading}</h2>
      {subheading ? <p className="exg-sub">{subheading}</p> : null}
    </header>
  );
}

/* ---------- component ---------- */
export default function EventExhibitorsGallery({
  heading = "Exhibitors",
  subheading = "Discover teams showcasing products, partnerships, and bold ideas.",
  items = null,
  isLoading = false,
  errorText = "",
  isLoggedIn = false,

  // optional controls (support both server/client filtering)
  serverMode = false,
  query,
  onQueryChange,
  onlyOpen,
  onOnlyOpenChange,
  industry,
  onIndustryChange,
  limit,
  onLimitChange,

  getReadMoreHref,
  onMessage,
  onBook,
}) {
  // ALWAYS call hooks
  const itemsArr = Array.isArray(items) ? items : [];
  const rows = React.useMemo(() => itemsArr.map(normItem), [itemsArr]);

  const industries = React.useMemo(() => {
    const set = new Set();
    rows.forEach((x) => x.industry && set.add(x.industry));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  // local states (used when not serverMode)
  const [qLocal, setQLocal] = React.useState(query || "");
  const [onlyOpenLocal, setOnlyOpenLocal] = React.useState(!!onlyOpen);
  const [industryLocal, setIndustryLocal] = React.useState(industry || "All");
  const [limitLocal, setLimitLocal] = React.useState(limit || 24);

  // derive effective values + setters without changing hook order
  const qVal = serverMode ? (query ?? qLocal) : qLocal;
  const setQVal = serverMode && onQueryChange ? onQueryChange : setQLocal;

  const onlyOpenVal = serverMode ? !!onlyOpen : onlyOpenLocal;
  const setOnlyOpenVal = serverMode && onOnlyOpenChange ? onOnlyOpenChange : setOnlyOpenLocal;

  const industryVal = serverMode ? (industry ?? industryLocal) : industryLocal;
  const setIndustryVal = serverMode && onIndustryChange ? onIndustryChange : setIndustryLocal;

  const limitVal = serverMode ? (limit ?? limitLocal) : limitLocal;
  const setLimitVal = serverMode && onLimitChange ? onLimitChange : setLimitLocal; // kept for completeness

  // client-side filtered view (serverMode returns rows as-is)
  const list = React.useMemo(() => {
    if (serverMode) return rows;
    const q = qVal.trim().toLowerCase();
    return rows.filter((x) => {
      const byQ =
        !q ||
        x.name.toLowerCase().includes(q) ||
        x.offering.toLowerCase().includes(q) ||
        x.industry.toLowerCase().includes(q);
      const byInd = industryVal === "All" || x.industry === industryVal;
      const byOpen = onlyOpenVal ? x.openToMeet : true;
      return byQ && byInd && byOpen;
    });
  }, [rows, serverMode, qVal, industryVal, onlyOpenVal]);

  // Quick View
  const [previewItem, setPreviewItem] = React.useState(null);
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (previewItem) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewItem]);
  const closePreview = () => setPreviewItem(null);

  // Compare
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const selectedList = React.useMemo(
    () => list.filter((x) => selectedIds.has(x.id)),
    [list, selectedIds]
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const toggleSelect = (it) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(it.id) ? next.delete(it.id) : next.add(it.id);
      return next;
    });
  const removeFromCompare = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const clearCompare = () => setSelectedIds(new Set());

  const hrefOf = (it) =>
    (typeof getReadMoreHref === "function" && getReadMoreHref(it._raw)) || `/profile/${it.id}`;

  // --------- RENDER ---------
  return (
    <section className="exg container">
      <Header heading={heading} subheading={subheading} />

      {/* Controls (visible even while loading to avoid layout jumps) */}
      <div className="exg-controls">
        <div className="exg-left">
          <span className="exg-ctl-label">
            <FiFilter />
            Filter
          </span>
          <div className="exg-industry">
  <select
    className="exg-select-f"
    value={industryVal}
    onChange={(e) => setIndustryVal(e.target.value)}
    disabled={isLoading}
    aria-label="Industry"
  >
    {industries.map((ind) => (
      <option key={ind} value={ind}>
        {ind}
      </option>
    ))}
  </select>
</div>
        </div>

        <div className="exg-right">
          

          <div className="exg-search">
            <input
              className="exg-input"
              placeholder="Search exhibitors…"
              value={qVal}
              onChange={(e) => setQVal(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {serverMode ? (
            <div className="exg-limit">
              <select
                className="exg-select"
                value={String(limitVal)}
                onChange={(e) => setLimitVal(Number(e.target.value))}
                aria-label="Page size"
                disabled={isLoading}
              >
                {[12, 24, 48, 96].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <button
            type="button"
            className={`exg-compare-launch ${selectedIds.size ? "on" : ""}`}
            disabled={!selectedIds.size || isLoading}
            onClick={() => setDrawerOpen(true)}
            title={selectedIds.size ? "Open compare" : "Select exhibitors to compare"}
          >
            <FiLayers />
            <span>Compare</span>
            <span className="exg-badge">{selectedIds.size}</span>
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="exg-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="exg-card is-skel" />
          ))}
        </div>
      ) : errorText ? (
        <div className="exg-empty">{errorText}</div>
      ) : list.length === 0 ? (
        <div className="exg-empty">No exhibitors match your filters.</div>
      ) : (
        <div className="exg-grid">
          {list.map((x, i) => {
            const isSel = selectedIds.has(x.id);
            return (
              <article
                key={x.id}
                className={`exg-card exg-variant-${(i % 6) + 1} ${isSel ? "is-selected" : ""}`}
              >
                <span className="exg-shine" aria-hidden="true" />
                {x.openToMeet ? (
                  <span className="exg-ribbon" aria-label="Open to meetings">
                    <FiZap />
                    Open
                  </span>
                ) : null}

                <button
                  type="button"
                  className={`exg-select ${isSel ? "on" : ""}`}
                  onClick={() => toggleSelect(x)}
                  aria-pressed={isSel}
                  title={isSel ? "Remove from compare" : "Add to compare"}
                >
                  <FiCheck />
                </button>

                <button
                  type="button"
                  className="exg-frame"
                  onClick={() => setPreviewItem(x._raw)}
                  aria-label={`Preview ${x.name}`}
                >
                  <div
                    className="exg-logo"
                    style={{ backgroundImage: `url(${imageLink(x.logo)})` }}
                    role="img"
                    aria-label={`${x.name} logo`}
                  />
                  {x.industry ? <div className="exg-tag">{x.industry}</div> : null}
                </button>

                <div className="exg-body">
                  <h4 className="exg-name">{x.name}</h4>
                  {x.offering ? <p className="exg-desc">{x.offering}</p> : null}

                  <div className="exg-actions">
                    <Link className="exg-btn exg-primary" to={hrefOf(x)}>
                      <FiExternalLink />
                      Read more
                    </Link>

                    {isLoggedIn ? (
                      <>
                        <button
                          type="button"
                          className="exg-btn"
                          onClick={() => onBook?.(x.id)}
                          title="Book a meeting"
                        >
                          <FiUserPlus />
                          Meet
                        </button>
                        <button
                          type="button"
                          className="exg-btn"
                          onClick={() => onMessage?.(x.id)}
                          title="Message"
                        >
                          <FiMessageCircle />
                          Message
                        </button>
                      </>
                    ) : (
                      <Link className="exg-btn" to="/login" title="Sign in to contact">
                        <FiInfo />
                        Sign in to contact
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Quick View */}
      <ExhibitorQuickView
        open={!!previewItem}
        item={previewItem}
        isLoggedIn={isLoggedIn}
        onClose={closePreview}
        onReadMore={(it) => hrefOf(normItem(it))}
        onBook={(it) => onBook?.(normItem(it).id)}
        onMessage={(it) => onMessage?.(normItem(it).id)}
      />

      {/* Compare Drawer */}
      <CompareDrawer
        open={drawerOpen}
        items={selectedList.map((x) => ({
          id: x.id,
          orgName: x.name,
          logo: x.logo,
          industry: x.industry,
          offering: x.offering,
          _raw: x._raw,
        }))}
        isLoggedIn={isLoggedIn}
        onClose={() => setDrawerOpen(false)}
        onRemove={(id) => removeFromCompare(id)}
        onClear={clearCompare}
        getReadMoreHref={(it) => hrefOf(normItem(it))}
        onBook={(it) => onBook?.(normItem(it).id)}
        onMessage={(it) => onMessage?.(normItem(it).id)}
      />
    </section>
  );
}

/* ---------- prop types ---------- */
Header.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
};
EventExhibitorsGallery.propTypes = {
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
  industry: PropTypes.string,
  onIndustryChange: PropTypes.func,
  limit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onLimitChange: PropTypes.func,
  getReadMoreHref: PropTypes.func,
  onMessage: PropTypes.func,
  onBook: PropTypes.func,
};
