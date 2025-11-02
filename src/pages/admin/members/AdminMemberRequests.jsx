// src/pages/admin/members/AdminMemberRequests.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./admin.member-requests.css";

import {
  useGetAdminRegisterRequestQuery,
  useLazyGetAdminRegisterRequestQuery,
  useUpdateAdminRegisterRequestMutation,
} from "../../../features/Actor/adminApiSlice";

import imageLink from "../../../utils/imageLink";

/* ============================== Deep getters ============================== */
const isFilled = (v) =>
  v !== undefined && v !== null && String(v).trim() !== "";

const dget = (obj, path) => {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};
const pick = (obj, paths = []) => {
  for (const p of paths) {
    const v = dget(obj, p);
    if (isFilled(v)) return v;
  }
  return "";
};

/* ----------------------------- Field pickers ----------------------------- */
const getId = (it) =>
  pick(it, [
    "_id",
    "id",
    "data._id",
    "data.id",
    // last-resort stable-ish combo
  ]) || (pick(it, ["email", "data.email"]) + pick(it, ["createdAt", "data.createdAt", "ts", "data.ts"]));

const getName = (it) =>
  pick(it, [
    "data.name",
    "name",
    "data.personal.fullName",
    "personal.fullName",
    "data.identity.contactName",
    "identity.contactName",
    "data.identity.exhibitorName",
    "identity.exhibitorName",
  ]) || "—";

const getEmail = (it) =>
  pick(it, [
    "data.email",
    "email",
    "data.personal.email",
    "personal.email",
    "data.identity.email",
    "identity.email",
    "data.contactEmail",
    "contactEmail",
  ]) || "—";

const getRole = (it) =>
  String(
    pick(it, ["data.role", "role"]) || "member"
  ).toLowerCase();

const getEmailVerified = (it) =>
  !!pick(it, ["data.verifiedEmail", "verifiedEmail", "data.emailVerified", "emailVerified"]);

const getCountryText = (it) =>
  // we map this to the "Phone" column per your rule
  pick(it, [
    "data.country",      // primary, as you asked
    "country",
    "data.personal.country",
    "personal.country",
    "data.address.country",
    "address.country",
  ]);

const getCountryCode = (it) => {
  const c = getCountryText(it);
  if (!isFilled(c)) return "";
  return String(c).trim().toUpperCase();
};

const getGender = (it) =>
  pick(it, [
    "data.gender",
    "gender",
    "data.personal.gender",
    "personal.gender",
    "data.identity.gender",
    "identity.gender",
  ]);

const getOrg = (it) =>
  pick(it, [
    "data.organization.orgName",
    "organization.orgName",
    "data.identity.orgName",
    "identity.orgName",
    "data.identity.exhibitorName",
    "identity.exhibitorName",
    "data.orgName",
    "orgName",
    "data.companyName",
    "companyName",
  ]);

const getEventId = (it) =>
  String(
    pick(it, [
      "data.event._id",
      "event._id",
      "data.eventId",
      "eventId",
      "data.id_event",
      "id_event",
      "data.idEvent",
      "idEvent",
      "data.event_id",
      "event_id",
    ])
  );

const getEventTitle = (it) =>
  pick(it, [
    "data.event.title",
    "event.title",
    "data.eventTitle",
    "eventTitle",
    "data.event_name",
    "event_name",
    "data.eventName",
    "eventName",
  ]);

const getAdminStatus = (it) =>
  pick(it, ["data.adminVerified", "adminVerified", "data.adminVerify", "adminVerify", "status"]) || "pending";

const getCreatedAt = (it) =>
  pick(it, ["data.createdAt", "createdAt", "data.ts", "ts"]);

/* ------------------------------ Avatars/flags ----------------------------- */
const getAvatar = (item) => {
  const r = getRole(item);
  if (r === "exhibitor") return pick(item, ["data.logo", "logo"]) || "";
  if (r === "attendee") return pick(item, ["data.profilePic", "profilePic"]) || "";
  return "";
};

/* ------------------------------ Format helpers ---------------------------- */
const fmtDate = (d) => {
  if (!isFilled(d)) return "—";
  const t = new Date(d);
  return isNaN(+t) ? "—" : t.toLocaleString();
};

/* ---------------------------- Export utilities ---------------------------- */
const tableSection = (title, headers = [], rows = []) => {
  const th = headers
    .map(
      (h) =>
        `<th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:6px">${h}</th>`
    )
    .join("");
  const trs = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c) =>
              `<td style="padding:6px;border-bottom:1px solid #f1f5f9">${c ?? ""}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `
    <h3 style="font:700 14px system-ui;margin:12px 0 6px">${title}</h3>
    <table style="border-collapse:collapse;width:100%;font:12px system-ui">
      ${th ? `<thead><tr>${th}</tr></thead>` : ""}<tbody>${trs}</tbody>
    </table>
  `;
};
const downloadBlob = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function buildRows(items, eventTitleMap) {
  return (items || []).map((it) => {
    const name = getName(it) || "—";
    const email = getEmail(it) || "—";
    const role = getRole(it) || "member";
    const verified = getEmailVerified(it) ? "yes" : "no";
    // Per your rule: label "Phone" but use data.country value (with fallbacks)
    const phone = getCountryText(it) || "—";
    const gender = getGender(it) || "—";
    const organization = getOrg(it) || "—";
    const evId = getEventId(it);
    const event =
      (evId && (eventTitleMap?.get(evId) || getEventTitle(it) || evId)) || "—";
    const admin = getAdminStatus(it) || "pending";
    const createdAt = fmtDate(getCreatedAt(it));
    return { name, email, gender, role, verified, phone, event, organization, admin, createdAt };
  });
}

function exportXLS(fileLabel, rows) {
  const head = [
    "Name",
    "Email",
    "Gender",
    "Role",
    "Verified",
    "Phone",        // label is Phone; value is country (data.country preferred)
    "Event",
    "Organization",
    "Admin",
    "Created at",
  ];
  const body = rows.map((r) => [
    r.name,
    r.email,
    r.gender,
    r.role,
    r.verified,
    r.phone,
    r.event,
    r.organization,
    r.admin,
    r.createdAt,
  ]);
  const html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /></head>
    <body>${tableSection(`Member requests — ${fileLabel}`, head, body)}</body>
  </html>`;
  downloadBlob(new Blob([html], { type: "application/vnd.ms-excel" }), `member_requests_${fileLabel}.xls`);
}

/* ================================ Modal ================================== */
function Modal({ open, onClose, children, title = "Details" }) {
  if (!open) return null;
  return (
    <div className="req-modal-backdrop" onClick={onClose}>
      <div
        className="req-modal card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="req-modal-head">
          <div className="req-modal-title">{title}</div>
          <button className="btn tiny" onClick={onClose}>Close</button>
        </div>
        <div className="req-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ================================ Page =================================== */
export default function AdminMemberRequests() {
  const navigate = useNavigate();

  // Tabs / filters
  const [type, setType] = React.useState(""); // "", "pending", "yes", "no"
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [eventFilter, setEventFilter] = React.useState("");

  // Selection + modal
  const [selectedId, setSelectedId] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // VIEW query args (server handles 20/5 rule for UI)
  const queryArgs = React.useMemo(() => {
    const q = {};
    if (type) q.adminVerify = type;
    if (eventFilter) q.eventId = eventFilter;
    if (search.trim()) q.search = search.trim();
    return q;
  }, [type, eventFilter, search]);

  const { data: buckets, isLoading, isFetching, refetch } =
    useGetAdminRegisterRequestQuery(queryArgs);

  // EXPORT query (override server paging with big limit)
  const [triggerExport, { isFetching: isFetchingExport }] =
    useLazyGetAdminRegisterRequestQuery();

  const [updateReq, { isLoading: mutating }] =
    useUpdateAdminRegisterRequestMutation();

  // Buckets (expected: { pending:[], yes:[], no:[] } somewhere under response root)
  const pending = pick(buckets, ["pending", "data.pending"]) || [];
  const accepted = pick(buckets, ["yes", "data.yes"]) || [];
  const rejected = pick(buckets, ["no", "data.no"]) || [];

  const allItems = React.useMemo(
    () => [...pending, ...accepted, ...rejected],
    [pending, accepted, rejected]
  );

  // Event options & map (from whatever shape we have)
  const eventOptions = React.useMemo(() => {
    const map = new Map();
    for (const it of allItems) {
      const id = getEventId(it);
      if (!isFilled(id)) continue;
      const title = getEventTitle(it) || id;
      if (!map.has(id)) map.set(id, title);
    }
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  }, [allItems]);

  const eventTitleMap = React.useMemo(() => {
    const m = new Map();
    for (const it of allItems) {
      const id = getEventId(it);
      if (!isFilled(id)) continue;
      const title = getEventTitle(it) || id;
      if (!m.has(id)) m.set(id, title);
    }
    return m;
  }, [allItems]);

  // DISPLAY filters (event + search)
  const applyEvent = (arr) =>
    !eventFilter ? arr : arr.filter((it) => getEventId(it) === String(eventFilter));

  const searchMatch = (it) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const name = getName(it);
    const email = getEmail(it);
    return (
      String(name).toLowerCase().includes(q) ||
      String(email).toLowerCase().includes(q)
    );
  };

  const filteredForDisplay = {
    pending: applyEvent(pending).filter(searchMatch),
    yes: applyEvent(accepted).filter(searchMatch),
    no: applyEvent(rejected).filter(searchMatch),
  };

  // Default selection
  React.useEffect(() => {
    if (selectedId) return;
    const first =
      (filteredForDisplay.pending[0] && getId(filteredForDisplay.pending[0])) ||
      (filteredForDisplay.yes[0] && getId(filteredForDisplay.yes[0])) ||
      (filteredForDisplay.no[0] && getId(filteredForDisplay.no[0])) ||
      null;
    if (first) setSelectedId(first);
  }, [filteredForDisplay, selectedId]);

  const selected = React.useMemo(() => {
    const id = selectedId;
    return (
      filteredForDisplay.pending.find((x) => getId(x) === id) ||
      filteredForDisplay.yes.find((x) => getId(x) === id) ||
      filteredForDisplay.no.find((x) => getId(x) === id) ||
      null
    );
  }, [selectedId, filteredForDisplay]);

  // Actions
  const accept = async () => {
    if (!selected) return;
    await updateReq({ id: pick(selected, ["_id", "id", "data._id", "data.id"]), adminVerified: "yes" });
    await refetch();
  };
  const reject = async () => {
    if (!selected) return;
    await updateReq({ id: pick(selected, ["_id", "id", "data._id", "data.id"]), adminVerified: "no" });
    await refetch();
  };
  const openProfile = (item) => {
    const id = getId(item);
    const r = getRole(item);
    navigate(`/admin/members/${r}s?id=${id}`);
  };

  // UI events
  const onTypeChange = (next) => {
    setType(next);
    if (!search.trim()) setLimit((v) => v || 20);
  };
  const showMore = (bucket) => {
    setType(bucket);
    setSearch("");
    setLimit((v) => Math.min(200, (Number(v) || 20) + 20));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const onSelectCard = (id) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  /* --------------------------- Export (Excel) --------------------------- */
  const [exporting, setExporting] = React.useState(""); // "", "pending"|"yes"|"no"
  const doExport = async (bucketKey) => {
    try {
      setExporting(bucketKey);
      const params = {
        adminVerify: bucketKey, // "pending" | "yes" | "no"
        limit: 50000,           // BIG limit for export (server will cap if needed)
      };
      if (eventFilter) params.eventId = eventFilter;
      // DO NOT pass search -> export ALL from that bucket
      const res = await triggerExport(params).unwrap();
      const dataNode =
        res?.data && typeof res.data === "object" ? res.data : res; // handle {data:{...}} or {...}
      const arr =
        (bucketKey === "yes" && (dataNode.yes || [])) ||
        (bucketKey === "no" && (dataNode.no || [])) ||
        (dataNode.pending || []);
      const rows = buildRows(arr, eventTitleMap);
      const label = bucketKey === "yes" ? "accepted" : bucketKey === "no" ? "rejected" : "pending";
      exportXLS(label, rows);
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed. Check console.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="req-page">
      {/* Top bar */}
      <div className="req-topbar card p-10">
        <div className="req-tabs">
          {[
            ["", "All"],
            ["pending", "Pending"],
            ["yes", "Accepted"],
            ["no", "Rejected"],
          ].map(([val, label]) => (
            <button
              key={val || "all"}
              className={`req-tab ${type === val ? "is-active" : ""}`}
              onClick={() => onTypeChange(val)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="req-controls">
          <div className="req-ctrl">
            <label className="req-lbl">Event</label>
            <select
              className="input"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              title="Filter by event"
            >
              <option value="">All events</option>
              {eventOptions.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>

          <div className="req-ctrl">
            <label className="req-lbl">Search {type ? `(${type})` : ""}</label>
            <input
              className="input"
              placeholder="Email or Full name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="req-ctrl">
            <label className="req-lbl">Results per page</label>
            <select
              className="input"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 20)}
              disabled={!!search.trim() || !type}
              title={type ? "Increase page size" : "Pick a tab first"}
            >
              {[10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <button className="btn" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ===== Lists ===== */}
      <div className="req-lists">
        {/* Pending */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <div className="req-col-title-wrap">
              <h3 className="req-col-title">Pending</h3>
              <span className="req-count">{filteredForDisplay.pending.length}</span>
            </div>
            <div className="req-export">
              <button
                className="btn tiny"
                onClick={() => doExport("pending")}
                disabled={exporting === "pending" || isFetchingExport}
              >
                {exporting === "pending" ? "Exporting…" : "Export Excel"}
              </button>
            </div>
          </div>

          <div className="req-list">
            {isLoading && !buckets ? (
              skeletonList()
            ) : filteredForDisplay.pending.length ? (
              filteredForDisplay.pending.map((it, idx) =>
                type === "pending" && !search.trim() && idx >= limit ? null : (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => onSelectCard(getId(it))}
                    eventTitleMap={eventTitleMap}
                  />
                )
              )
            ) : (
              <div className="muted">No pending requests.</div>
            )}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("pending")}>Show more</button>
          </div>
        </section>

        {/* Accepted */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <div className="req-col-title-wrap">
              <h3 className="req-col-title">Accepted</h3>
              <span className="req-count yes">{filteredForDisplay.yes.length}</span>
            </div>
            <div className="req-export">
              <button
                className="btn tiny"
                onClick={() => doExport("yes")}
                disabled={exporting === "yes" || isFetchingExport}
              >
                {exporting === "yes" ? "Exporting…" : "Export Excel"}
              </button>
            </div>
          </div>

          <div className="req-list">
            {isLoading && !buckets ? (
              skeletonList()
            ) : filteredForDisplay.yes.length ? (
              filteredForDisplay.yes.map((it, idx) =>
                type === "yes" && !search.trim() && idx >= limit ? null : (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => onSelectCard(getId(it))}
                    eventTitleMap={eventTitleMap}
                  />
                )
              )
            ) : (
              <div className="muted">No accepted requests.</div>
            )}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("yes")}>Show more</button>
          </div>
        </section>

        {/* Rejected */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <div className="req-col-title-wrap">
              <h3 className="req-col-title">Rejected</h3>
              <span className="req-count no">{filteredForDisplay.no.length}</span>
            </div>
            <div className="req-export">
              <button
                className="btn tiny"
                onClick={() => doExport("no")}
                disabled={exporting === "no" || isFetchingExport}
              >
                {exporting === "no" ? "Exporting…" : "Export Excel"}
              </button>
            </div>
          </div>

          <div className="req-list">
            {isLoading && !buckets ? (
              skeletonList()
            ) : filteredForDisplay.no.length ? (
              filteredForDisplay.no.map((it, idx) =>
                type === "no" && !search.trim() && idx >= limit ? null : (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => onSelectCard(getId(it))}
                    eventTitleMap={eventTitleMap}
                  />
                )
              )
            ) : (
              <div className="muted">No rejected requests.</div>
            )}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("no")}>Show more</button>
          </div>
        </section>
      </div>

      {/* ===== Modal details ===== */}
      <Modal open={modalOpen && !!selected} onClose={() => setModalOpen(false)} title="Request details">
        {!selected ? (
          <div className="muted">No selection.</div>
        ) : (
          <>
            <HeaderBlock item={selected} onOpen={() => openProfile(selected)} eventTitleMap={eventTitleMap} />
            <BasicDetails item={selected} eventTitleMap={eventTitleMap} />
            <div className="req-actions">
              <button className="btn" onClick={() => openProfile(selected)}>Open full profile</button>
              <div className="grow" />
              {getAdminStatus(selected) !== "yes" && (
                <button className="btn brand" onClick={accept} disabled={mutating}>Accept</button>
              )}
              {getAdminStatus(selected) !== "no" && (
                <button className="btn danger" onClick={reject} disabled={mutating}>Reject</button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ============================ Cards / Blocks ============================= */
function RequestCard({ item, onSelect, active, eventTitleMap }) {
  const t = getRole(item);
  const name = getName(item);
  const email = getEmail(item);
  const countryCode = getCountryCode(item);
  const verified = getEmailVerified(item);
  const img = getAvatar(item);

  const evId = getEventId(item);
  const evTitle = eventTitleMap?.get(evId) || getEventTitle(item) || evId || "";

  return (
    <button className={`req-card ${active ? "is-active" : ""}`} onClick={onSelect} title="Show details">
      <div className="req-avatar">
        {img ? (
          <img className="req-avatar-img" src={imageLink(img)} alt={name} />
        ) : (
          <span className="req-avatar-fallback">{(name || email || "?").slice(0, 1).toUpperCase()}</span>
        )}
      </div>

      <div className="req-meta">
        <div className="req-name line-1">{name}</div>
        <div className="req-sub line-1">{email}</div>
        <div className="req-sub tiny country-flag">
          {countryCode ? (
            <ReactCountryFlag svg countryCode={countryCode} style={{ fontSize: "1.1em", marginRight: 6 }} />
          ) : "—"}
        </div>
        {evTitle && <div className="req-ev tiny">{evTitle}</div>}
      </div>

      <div className="req-tags">
        <span className={`pill-type ${t}`}>{t}</span>
        <span className={`pill-verify ${verified ? "ok" : "no"}`}>{verified ? "Email verified" : "Unverified"}</span>
      </div>
    </button>
  );
}

function HeaderBlock({ item, onOpen, eventTitleMap }) {
  const t = getRole(item);
  const name = getName(item);
  const email = getEmail(item);
  const countryCode = getCountryCode(item);
  const verified = getEmailVerified(item);
  const img = getAvatar(item);

  const evId = getEventId(item);
  const evTitle = eventTitleMap?.get(evId) || getEventTitle(item) || evId || "—";

  return (
    <div className="req-head">
      <button className="req-head-avatar" onClick={onOpen} title="Open full profile">
        {img ? <img className="req-head-img" src={imageLink(img)} alt={name} /> : (
          <span className="req-avatar-fallback">{(name || email || "?").slice(0, 1).toUpperCase()}</span>
        )}
      </button>

      <div className="req-head-meta">
        <div className="req-head-top">
          <button className="req-head-name linklike" title={name} onClick={onOpen}>{name}</button>
          <div className="req-badges">
            <span className={`pill-type big ${t}`}>{t}</span>
            <span className={`pill-verify big ${verified ? "ok" : "no"}`}>{verified ? "Email verified" : "Unverified"}</span>
          </div>
        </div>
        <div className="req-head-sub">
          <span className="muted">{email}</span>
          <span className="dot">•</span>
          <span className="muted country-flag">
            {countryCode ? <ReactCountryFlag svg countryCode={countryCode} style={{ fontSize: "1.1em", marginRight: 6 }} /> : "—"}
          </span>
          <span className="muted">{evTitle}</span>
        </div>
      </div>
    </div>
  );
}

function BasicDetails({ item, eventTitleMap }) {
  const evId = getEventId(item);
  const evTitle = eventTitleMap?.get(evId) || getEventTitle(item) || evId || "—";
  return (
    <div className="req-sections">
      <Section title="Request">
        <KV k="Role" v={getRole(item)} />
        <KV k="Admin status" v={getAdminStatus(item)} />
        <KV k="Event" v={evTitle} />
        <KV k="Created at" v={fmtDate(getCreatedAt(item))} />
      </Section>
      <Section title="Contact">
        <KV k="Name" v={getName(item)} />
        <KV k="Email" v={getEmail(item)} />
        {/* label Phone, value from country fields as requested */}
        <KV k="Phone" v={getCountryText(item) || "—"} />
        <KV k="Gender" v={getGender(item) || "—"} />
        <KV k="Organization" v={getOrg(item) || "—"} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="req-sec">
      <div className="req-sec-title">{title}</div>
      <div className="req-sec-grid">{children}</div>
    </div>
  );
}
function KV({ k, v }) {
  return (
    <div className="req-kv">
      <div className="req-k">{k}</div>
      <div className="req-v">{isFilled(v) ? v : "—"}</div>
    </div>
  );
}
function skeletonList() {
  return Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="req-card sk">
      <div className="sk-avatar" />
      <div className="sk-lines">
        <div className="sk-line" />
        <div className="sk-line short" />
      </div>
    </div>
  ));
}
