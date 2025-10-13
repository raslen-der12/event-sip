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

const normIndustry = (v) => {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map((x) => String(x || "")).join(", ").trim();
  if (v && typeof v === "object") {
    // common shapes: { name }, { label }
    return String(v.name || v.label || "").trim();
  }
  return String(v ?? "").trim();
};
export default function EventExhibitorsGallery({
  heading = "Exhibitors",
  subheading = "Discover teams showcasing products, partnerships, and bold ideas.",
  items = null,
  isLoading = false,
  errorText = "",
  isLoggedIn = false,

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
  // Safe mock if nothing
  const fallback = React.useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: `mock-${i + 1}`,
        orgName: ["Vectorly", "Formify", "EdgeKit", "CloudRail", "StackForge", "DevDeck"][i % 6],
        industry: ["AI", "FinTech", "Health", "Cloud", "IoT", "Security"][i % 6],
        logo: "https://dummyimage.com/240x240/ffffff/0f1221.png&text=LOGO",
        offering: "End-to-end solution suite delivering performance at scale with seamless integrations.",
        openToMeet: i % 3 !== 0,
      })),
    []
  );

  const safeItems = Array.isArray(items) && items.length ? items : fallback;

  // Build industry list from current data
 const industries = React.useMemo(() => {
  const set = new Set();
  safeItems.forEach((x) => {
    const ind = normIndustry(x?.industry);
    if (ind) set.add(ind);
  });
  const arr = Array.from(set).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
  return ["All", ...arr];
}, [safeItems]);

  // ----- client-mode states (fallback if not serverMode) -----
  const [qLocal, setQLocal] = React.useState("");
  const [onlyOpenLocal, setOnlyOpenLocal] = React.useState(false);
  const [industryLocal, setIndustryLocal] = React.useState("All");

  // Apply filtering (client only)
  const filtered = React.useMemo(() => {
  if (serverMode) return safeItems;
  const q = qLocal.trim().toLowerCase();
  const ind = industryLocal;
  return safeItems.filter((x) => {
    const itemInd = normIndustry(x?.industry);
    const byInd = ind === "All" || itemInd === ind;
    const byOpen = onlyOpenLocal ? !!x?.openToMeet : true;
    const byQ =
      !q ||
      (x?.orgName || "").toLowerCase().includes(q) ||
      (x?.offering || "").toLowerCase().includes(q);
    return byInd && byOpen && byQ;
  });
}, [serverMode, safeItems, qLocal, onlyOpenLocal, industryLocal]);
  const currentList = serverMode ? safeItems : filtered;

  const hrefOf = (it) =>
    (typeof getReadMoreHref === "function" && getReadMoreHref(it)) ||
    `/profile/${it?._id || it?.id || ""}`;

  // Quick view modal
  const [previewItem, setPreviewItem] = React.useState(null);
  const closePreview = () => setPreviewItem(null);
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (previewItem) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewItem]);

  // Compare selection
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const selectedList = React.useMemo(
    () => currentList.filter((x) => selectedIds.has(x?._id || x?.id)),
    [currentList, selectedIds]
  );
  const toggleSelect = (it) => {
    const id = it?._id || it?.id;
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const removeFromCompare = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const clearCompare = () => setSelectedIds(new Set());

  // Drawer open/close
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  if (isLoading) {
    return (
      <section className="exg container">
        <Header heading={heading} subheading={subheading} />
        <div className="exg-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="exg-card is-skel" />
          ))}
        </div>
      </section>
    );
  }

  if (errorText) {
    return (
      <section className="exg container">
        <Header heading={heading} subheading={subheading} />
        <div className="exg-empty">{errorText}</div>
      </section>
    );
  }

  // Controlled vs local bindings
  const qVal = serverMode ? (query ?? "") : qLocal;
  const setQVal = serverMode ? onQueryChange : setQLocal;

  const onlyOpenVal = serverMode ? !!onlyOpen : onlyOpenLocal;
  const setOnlyOpenVal = serverMode ? onOnlyOpenChange : setOnlyOpenLocal;

  const industryVal = serverMode ? (industry ?? "All") : industryLocal;
  const setIndustryVal = serverMode ? onIndustryChange : setIndustryLocal;

  const limitVal = serverMode ? (limit ?? 24) : undefined;

  return (
    <section className="exg container">
      <Header heading={heading} subheading={subheading} />

      {/* Controls */}
      <div className="exg-controls">
        <div className="exg-left">
          <span className="exg-ctl-label">
            <FiFilter />
            Filter
          </span>

          {/* Industry pills (drive server/client) */}
          <div className="exg-pills">
            {industries.map((ind) => (
              <button
                key={ind}
                type="button"
                className={`exg-pill ${industryVal === ind ? "is-active" : ""}`}
                onClick={() => setIndustryVal?.(ind)}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        <div className="exg-right">
          {/* Open toggle */}
          <label className="exg-toggle">
            <input
              type="checkbox"
              checked={onlyOpenVal}
              onChange={(e) => setOnlyOpenVal?.(e.target.checked)}
            />
            <span className="exg-toggle-ui" />
            <span className="exg-toggle-txt">Open to meet</span>
          </label>

          {/* Search */}
          <div className="exg-search">
            <input
              className="exg-input"
              placeholder="Search exhibitors…"
              value={qVal}
              onChange={(e) => setQVal?.(e.target.value)}
            />
          </div>

          {/* Limit (server mode only) */}
          {serverMode ? (
            <div className="exg-limit">
              <select
                className="exg-select"
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
            </div>
          ) : null}

          <button
            type="button"
            className={`exg-compare-launch ${selectedIds.size ? "on" : ""}`}
            disabled={!selectedIds.size}
            onClick={() => setDrawerOpen(true)}
            title={selectedIds.size ? "Open compare" : "Select exhibitors to compare"}
          >
            <FiLayers />
            <span>Compare</span>
            <span className="exg-badge">{selectedIds.size}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {currentList.length === 0 ? (
        <div className="exg-empty">No exhibitors match your filters.</div>
      ) : (
        <div className="exg-grid">
          {currentList.map((x, i) => {
            const id = x?._id || x?.id || `${i}`;
            const org = x?.orgName || "—";
            const logo = x?.logo || "https://dummyimage.com/240x240/ffffff/0f1221.png&text=LOGO";
            const offering = x?.offering || "—";
            const ind = normIndustry(x?.industry) || "—";
            const open = !!x?.openToMeet;
            const isSel = selectedIds.has(id);

            return (
              <article
                key={id}
                className={`exg-card exg-variant-${(i % 6) + 1} ${isSel ? "is-selected" : ""}`}
              >
                <span className="exg-shine" aria-hidden="true" />

                {open ? (
                  <span className="exg-ribbon" aria-label="Open to meetings">
                    <FiZap />
                    Open
                  </span>
                ) : null}

                {/* Select toggle */}
                <button
                  type="button"
                  className={`exg-select ${isSel ? "on" : ""}`}
                  onClick={() => toggleSelect(x)}
                  aria-pressed={isSel}
                  title={isSel ? "Remove from compare" : "Add to compare"}
                >
                  <FiCheck />
                </button>

                {/* Frame with logo (click -> quick view) */}
                <button
                  type="button"
                  className="exg-frame"
                  onClick={() => setPreviewItem(x)}
                  aria-label={`Preview ${org}`}
                >
                  <div
                    className="exg-logo"
                    style={{ backgroundImage: `url(${imageLink(logo)})` }}
                    role="img"
                    aria-label={`${org} logo`}
                  />
                  <div className="exg-tag">{ind}</div>
                </button>

                {/* Body */}
                <div className="exg-body">
                  <h4 className="exg-name">{org}</h4>
                  <p className="exg-desc">{offering}</p>

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
                          onClick={() => onBook?.(x)}
                          title="Book a meeting"
                        >
                          <FiUserPlus />
                          Meet
                        </button>
                        <button
                          type="button"
                          className="exg-btn"
                          onClick={() => onMessage?.(x)}
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

      {/* Quick View Modal */}
      <ExhibitorQuickView
        open={!!previewItem}
        item={previewItem}
        isLoggedIn={isLoggedIn}
        onClose={closePreview}
        onReadMore={(it) => hrefOf(it)}
        onBook={onBook}
        onMessage={onMessage}
      />

      {/* Compare Drawer */}
      <CompareDrawer
        open={drawerOpen}
        items={selectedList}
        isLoggedIn={isLoggedIn}
        onClose={() => setDrawerOpen(false)}
        onRemove={(id) => removeFromCompare(id)}
        onClear={clearCompare}
        getReadMoreHref={hrefOf}
        onBook={onBook}
        onMessage={onMessage}
      />
    </section>
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
