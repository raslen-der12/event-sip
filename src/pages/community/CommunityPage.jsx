// src/pages/community/CommunityPage.jsx
import React, { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
import imageLink from "../../utils/imageLink";
import {
  useGetCommunityFacetsQuery,
  useGetCommunityListQuery,
} from "../../features/bp/BPApiSlice";
import "../marketplace/market.css";
import { canonCountry } from "../../utils/countriesFix";

/* ------------------------------ utils ------------------------------ */
const cap = (s) => String(s || "").replace(/\b\w/g, (m) => m.toUpperCase());
const AVATAR_FALLBACK = "/uploads/default/photodef.png";
const stripDiacritics = (s = "") =>
  s.normalize?.("NFD").replace(/[\u0300-\u036f]/g, "") || s;
const uc = (s = "") => stripDiacritics(String(s || "").trim().toUpperCase());

/* ---------------------------- small parts --------------------------- */
function MemberCard({ m }) {
  const navigate = useNavigate();
  const avatar = m.avatar ? imageLink(m.avatar) : AVATAR_FALLBACK;

  return (
    <article className="mk-card" style={{ paddingBottom: 12 }}>
      <div className="mk-card-body">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <img
            src={avatar}
            alt={m.fullName}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              objectFit: "cover",
              background: "#f3f4f6",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              className="mk-title"
              style={{
                marginBottom: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {m.fullName}
            </div>
            <div className="mk-muted" style={{ fontSize: 12 }}>
              {m.orgName || "—"} {m.country ? `• ${m.country}` : ""}
            </div>

            {/* Attendance badge */}
            {m.isAtt && (
              <div style={{ marginTop: 4 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: "#16a34a", // green
                    color: "#ffffff",
                    letterSpacing: 0.2,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "999px",
                      backgroundColor: "rgba(255,255,255,0.9)",
                    }}
                  />
                  Attended
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mk-card-actions">
          <button
            className="mk-btn ghost"
            onClick={() => navigate(`/profile/${m.id}`)}
          >
            View Profile
          </button>
          <button
            className="mk-btn primary"
            onClick={() => navigate(`/messages?member=${m.id}`)}
          >
            Send Message
          </button>
        </div>
      </div>
    </article>
  );
}

function GroupBlock({ g, onViewRole }) {
  return (
    <section className="card" style={{ padding: 16, marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div className="mk-h-sub" style={{ fontWeight: 700 }}>
          {cap(g.name)} <span className="mk-muted">({g.count})</span>
        </div>
      </div>

      <div className="mk-grid">
        {(g.items || []).map((m) => (
          <MemberCard key={`g-${g.name}-${m.id}`} m={m} />
        ))}
      </div>

      {/* Button under the group card to open full list for this role */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          className="mk-btn link primary"
          title={`View all ${cap(g.name)}`}
          onClick={() => onViewRole && onViewRole(g.name)}
        >
          View all {cap(g.name)}
        </button>
      </div>
    </section>
  );
}

/* -------------------------- pagination UI -------------------------- */
function Pagination({ page, total, limit, onGo }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));
  if (totalPages <= 1) return null;

  const buildPages = () => {
    const p = page;
    const t = totalPages;
    const set = new Set([1, t, p, p - 1, p + 1, 2, t - 1]);
    const arr = [...set].filter((x) => x >= 1 && x <= t).sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      out.push(arr[i]);
      if (i < arr.length - 1 && arr[i + 1] - arr[i] > 1) out.push("…");
    }
    return out;
  };
  const pages = buildPages();

  return (
    <nav
      className="mk-pager"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        flexWrap: "wrap",
      }}
    >
      <button
        className="mk-btn "
        disabled={page <= 1}
        onClick={() => onGo(1)}
        title="First"
      >
        «
      </button>
      <button
        className="mk-btn "
        disabled={page <= 1}
        onClick={() => onGo(page - 1)}
        title="Previous"
      >
        ‹
      </button>

      {pages.map((v, i) =>
        v === "…" ? (
          <span
            key={`e-${i}`}
            className="mk-muted"
            style={{ padding: "6px 8px" }}
          >
            …
          </span>
        ) : (
          <button
            key={`p-${v}`}
            className={"mk-btn" + (v === page ? " primary" : " ")}
            onClick={() => onGo(v)}
            aria-current={v === page ? "page" : undefined}
          >
            {v}
          </button>
        )
      )}

      <button
        className="mk-btn "
        disabled={page >= totalPages}
        onClick={() => onGo(page + 1)}
        title="Next"
      >
        ›
      </button>
      <button
        className="mk-btn "
        disabled={page >= totalPages}
        onClick={() => onGo(totalPages)}
        title="Last"
      >
        »
      </button>
    </nav>
  );
}

/* ----------------------------- main page ---------------------------- */
export default function CommunityPage() {
  const [sp, setSp] = useSearchParams();

  // query params
  const q = sp.get("q") || "";
  const eventId = sp.get("eventId") || "";
  const subRole = sp.get("subRole") || ""; // when present => flat list mode
  const country = sp.get("country") || "";
  const viewMode = sp.get("view") || ""; // "role" => hide filters and show Back
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = 24;

  // helpers
  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === undefined || v === null || v === "") next.delete(k);
    else next.set(k, String(v));
    if (k !== "page") next.set("page", "1");
    setSp(next, { replace: false });
  };

  const openRoleView = (role) => {
    const next = new URLSearchParams(sp);
    next.set("subRole", String(role));
    next.set("view", "role");
    next.delete("q");
    next.delete("country");
    next.set("page", "1");
    setSp(next, { replace: false });
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const exitRoleView = () => {
    const next = new URLSearchParams(sp);
    next.delete("subRole");
    next.delete("view");
    next.set("page", "1");
    setSp(next, { replace: false });
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  // facets (events, roles, countries)
  const { data: facets } = useGetCommunityFacetsQuery(
    eventId ? { eventId } : undefined
  );
  const events = facets?.events || [];
  const defaultId = facets?.defaultEventId || "";
  const roles = facets?.subRoles || [];
  const rawCountries = facets?.countries || [];

  // normalize/merge country list on the UI
  const uiCountries = useMemo(() => {
    const map = new Map();
    (rawCountries || []).forEach((c) => {
      const key = canonCountry(c.code);
      map.set(key, (map.get(key) || 0) + (c.count || 0));
    });
    return [...map.entries()]
      .sort(
        (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))
      )
      .map(([code, count]) => ({ code, count }));
  }, [rawCountries]);

  // push default eventId once facets load
  useEffect(() => {
    if (!eventId && defaultId) setParam("eventId", defaultId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultId]);

  // data for list
  const listParams = {
    eventId: eventId || defaultId,
    subRole,
    country,
    q,
    page,
    limit,
  };
  const { data, isFetching } = useGetCommunityListQuery(listParams);

  const groups = !subRole ? data?.groups || [] : [];
  const items = subRole ? data?.items || [] : [];
  const total = data?.total || 0;

  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const rangeStart = total ? (page - 1) * limit + 1 : 0;
  const rangeEnd = total ? Math.min(page * limit, total) : 0;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="mk container-lg">
        {/* Header + Filters */}
        <div className="mk-header card">
          <div className="mk-h-title">Community</div>

          {viewMode === "role" && subRole ? (
            <div className="mk-toprow" style={{ alignItems: "center", gap: 12 }}>
              <button className="mk-btn ghost" onClick={exitRoleView}>
                ← Back
              </button>
              <div className="mk-muted">
                Showing role: <strong>{cap(subRole)}</strong>
              </div>
            </div>
          ) : (
            <div className="mk-toprow">
              <input
                className="mk-input grow"
                placeholder="Search people or organizations…"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
              <select
                className="mk-select"
                value={eventId || defaultId}
                onChange={(e) => setParam("eventId", e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title || ev.id}
                  </option>
                ))}
              </select>

              <select
                className="mk-select"
                value={subRole}
                onChange={(e) => setParam("subRole", e.target.value)}
                title="Filter by role"
              >
                <option value="">All Roles</option>
                {roles.map((r) => (
                  <option key={r.name} value={r.name}>
                    {cap(r.name)}
                    {r.count ? ` (${r.count})` : ""}
                  </option>
                ))}
              </select>

              <select
                className="mk-select"
                value={country}
                onChange={(e) => setParam("country", e.target.value)}
                title="Filter by country"
              >
                <option value="">All Countries</option>
                {uiCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                    {c.count ? ` (${c.count})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Summary + small top pager */}
        <div className="mk-controls" style={{ alignItems: "center" }}>
          <div className="mk-muted">
            {isFetching
              ? "Loading…"
              : `${rangeStart || 0}–${rangeEnd || 0} of ${total} • Page ${page} of ${totalPages}`}
          </div>
          <div className="mk-right">
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onGo={(p) => setParam("page", String(p))}
            />
          </div>
        </div>

        {/* Content */}
        {!subRole ? (
          <div>
            {isFetching && !groups.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="mk-skel" style={{ height: 120 }} />
                ))
              : groups.map((g) => (
                  <GroupBlock
                    key={`grp-${g.name}`}
                    g={g}
                    onViewRole={(role) => openRoleView(role)}
                  />
                ))}
          </div>
        ) : (
          <>
            <div className="mk-grid">
              {isFetching && !items.length
                ? Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="mk-skel" />
                  ))
                : items.map((m) => <MemberCard key={`m-${m.id}`} m={m} />)}
            </div>

            <Pagination
              page={page}
              total={total}
              limit={limit}
              onGo={(p) => {
                setParam("page", String(p));
                window.scrollTo?.({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </div>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );  
}
