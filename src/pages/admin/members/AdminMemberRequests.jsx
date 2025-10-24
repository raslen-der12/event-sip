// src/pages/admin/members/AdminMemberRequests.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./admin.member-requests.css";

import {
  useGetAdminRegisterRequestQuery,
  useUpdateAdminRegisterRequestMutation,
} from "../../../features/Actor/adminApiSlice";

import imageLink from "../../../utils/imageLink";

/* ----------------------------- Modal ----------------------------- */
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
          <button className="btn tiny" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="req-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Page ----------------------------- */
export default function AdminMemberRequests() {
  const navigate = useNavigate();

  // Tabs / filters
  const [type, setType] = React.useState("");        // "", "pending", "yes", "no"
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const [eventFilter, setEventFilter] = React.useState("");

  // Selection + modal
  const [selectedId, setSelectedId] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  // Build query args for API; always pass eventId if chosen
  const queryArgs = React.useMemo(() => {
    const q = {};
    if (type) q.adminVerify = type;
    if (eventFilter) q.eventId = eventFilter;
    if (search.trim()) q.search = search.trim();
    if (type && !search.trim()) q.limit = Number(limit) || 20;
    return q;
  }, [type, eventFilter, search, limit]);

  const { data: buckets, isLoading, isFetching, refetch } =
    useGetAdminRegisterRequestQuery(queryArgs);

  const [updateReq, { isLoading: mutating }] =
    useUpdateAdminRegisterRequestMutation();

  // Buckets from API (server returns { no:[], yes:[], pending:[] } or similar)
  const pending = buckets?.pending ?? [];
  const accepted = buckets?.yes ?? [];
  const rejected = buckets?.no ?? [];

  // Collect all items currently visible from server
  const allItems = React.useMemo(
    () => [...pending, ...accepted, ...rejected],
    [pending, accepted, rejected]
  );

  // Extract Event ID and Title robustly from an item
  const getEventId = (it) =>
    String(it?.event?._id || it?.eventId || it?.id_event || it?.idEvent || "");
  const getEventTitle = (it) =>
    String(
      it?.event?.title ||
        it?.eventTitle ||
        it?.event_name ||
        it?.eventName ||
        ""
    );

  // Build event options from *all items* (id+title). If some items only have id,
  // we’ll still show “<id>” as a fallback label so the select is never empty.
  const eventOptions = React.useMemo(() => {
    const map = new Map();
    for (const it of allItems) {
      const id = getEventId(it);
      if (!id) continue;
      const title = getEventTitle(it) || id;
      if (!map.has(id)) map.set(id, title);
    }
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allItems]);

  // Make a quick lookup of eventId -> title, to use in the modal/details.
  const eventTitleMap = React.useMemo(() => {
    const m = new Map();
    for (const it of allItems) {
      const id = getEventId(it);
      if (!id) continue;
      const title = getEventTitle(it) || id;
      if (!m.has(id)) m.set(id, title);
    }
    return m;
  }, [allItems]);

  // Client-side event filter (in case backend ignores eventId)
  const byEvent = (arr) =>
    !eventFilter
      ? arr
      : arr.filter((it) => getEventId(it) === String(eventFilter));

  const filtered = {
    pending: byEvent(pending),
    yes: byEvent(accepted),
    no: byEvent(rejected),
  };

  // Find by id in filtered sets
  const findById = React.useCallback(
    (id) => {
      if (!id) return null;
      return (
        filtered.pending.find((x) => getId(x) === id) ||
        filtered.yes.find((x) => getId(x) === id) ||
        filtered.no.find((x) => getId(x) === id) ||
        null
      );
    },
    [filtered.pending, filtered.yes, filtered.no]
  );

  // Default selection
  React.useEffect(() => {
    if (selectedId) return;
    const first =
      (filtered.pending[0] && getId(filtered.pending[0])) ||
      (filtered.yes[0] && getId(filtered.yes[0])) ||
      (filtered.no[0] && getId(filtered.no[0])) ||
      null;
    if (first) setSelectedId(first);
  }, [filtered, selectedId]);

  // Selected
  const selected = React.useMemo(
    () => findById(selectedId),
    [selectedId, findById]
  );

  // Actions
  const accept = async () => {
    if (!selected) return;
    await updateReq({ id: selected._id || selected.id, adminVerified: "yes" });
    await refetch();
  };
  const reject = async () => {
    if (!selected) return;
    await updateReq({ id: selected._id || selected.id, adminVerified: "no" });
    await refetch();
  };
  const openProfile = (item) => navigate(getActorPath(item));

  // UI events
  const onTypeChange = (next) => {
    setType(next);
    // keep existing event filter usable in any tab
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
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
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
                <option key={n} value={n}>
                  {n}
                </option>
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
            <h3 className="req-col-title">Pending</h3>
            <span className="req-count">{filtered.pending.length}</span>
          </div>
          <div className="req-list">
            {isLoading && !buckets
              ? skeletonList()
              : filtered.pending.length
              ? filtered.pending.map((it) => (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => onSelectCard(getId(it))}
                    eventTitleMap={eventTitleMap}
                  />
                ))
              : <div className="muted">No pending requests.</div>}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("pending")}>
              Show more
            </button>
          </div>
        </section>

        {/* Accepted */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <h3 className="req-col-title">Accepted</h3>
            <span className="req-count yes">{filtered.yes.length}</span>
          </div>
          <div className="req-list">
            {isLoading && !buckets
              ? skeletonList()
              : filtered.yes.length
              ? filtered.yes.map((it) => (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => onSelectCard(getId(it))}
                    eventTitleMap={eventTitleMap}
                  />
                ))
              : <div className="muted">No accepted requests.</div>}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("yes")}>
              Show more
            </button>
          </div>
        </section>

        {/* Rejected */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <h3 className="req-col-title">Rejected</h3>
            <span className="req-count no">{filtered.no.length}</span>
          </div>
          <div className="req-list">
            {isLoading && !buckets
              ? skeletonList()
              : filtered.no.length
              ? filtered.no.map((it) => (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => onSelectCard(getId(it))}
                    eventTitleMap={eventTitleMap}
                  />
                ))
              : <div className="muted">No rejected requests.</div>}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("no")}>
              Show more
            </button>
          </div>
        </section>
      </div>

      {/* ===== Modal details ===== */}
      <Modal
        open={modalOpen && !!selected}
        onClose={() => setModalOpen(false)}
        title="Request details"
      >
        {!selected ? (
          <div className="muted">No selection.</div>
        ) : (
          <>
            <HeaderBlock
              item={selected}
              onOpen={() => openProfile(selected)}
              eventTitleMap={eventTitleMap}
            />
            <BasicDetails item={selected} eventTitleMap={eventTitleMap} />
            <div className="req-actions">
              <button className="btn" onClick={() => openProfile(selected)}>
                Open full profile
              </button>
              <div className="grow" />
              {selected.adminVerified !== "yes" && (
                <button className="btn brand" onClick={accept} disabled={mutating}>
                  Accept
                </button>
              )}
              {selected.adminVerified !== "no" && (
                <button className="btn danger" onClick={reject} disabled={mutating}>
                  Reject
                </button>
              )}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
  
function RequestCard({ item, onSelect, active, eventTitleMap }) {
  const t = (item.role || "").toLowerCase() || "member";
  const name = item.name || "—";
  const email = item.email || "—";
  const countryCode = getCountryCode(item);
  const verified = !!item.verifiedEmail;
  const img = getAvatar(item);

  const evId = getEventId(item);
  const evTitle =
    eventTitleMap?.get(evId) ||
    item.event?.title ||
    item.eventTitle ||
    (evId || "");

  return (
    <button
      className={`req-card ${active ? "is-active" : ""}`}
      onClick={onSelect}
      title="Show details"
    >
      <div className="req-avatar">
        {img ? (
          <img className="req-avatar-img" src={imageLink(img)} alt={name} />
        ) : (
          <span className="req-avatar-fallback">
            {(name || email || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="req-meta">
        <div className="req-name line-1">{name}</div>
        <div className="req-sub line-1">{email}</div>
        <div className="req-sub tiny country-flag">
          {countryCode ? (
            <>
              <ReactCountryFlag
                svg
                countryCode={countryCode}
                style={{ fontSize: "1.1em", marginRight: 6 }}
              />
            </>
          ) : (
            "—"
          )}
        </div>
        {evTitle && <div className="req-ev tiny">{evTitle}</div>}
      </div>

      <div className="req-tags">
        <span className={`pill-type ${t}`}>{t}</span>
        <span className={`pill-verify ${verified ? "ok" : "no"}`}>
          {verified ? "Email verified" : "Unverified"}
        </span>
      </div>
    </button>
  );
}

function HeaderBlock({ item, onOpen, eventTitleMap }) {
  const t = (item.role || "").toLowerCase() || "member";
  const name = item.name || "—";
  const email = item.email || "—";
  const countryCode = getCountryCode(item);
  const verified = !!item.verifiedEmail;
  const img = getAvatar(item);

  const evId = getEventId(item);
  const evTitle =
    eventTitleMap?.get(evId) ||
    item.event?.title ||
    item.eventTitle ||
    (evId || "—");

  return (
    <div className="req-head">
      <button className="req-head-avatar" onClick={onOpen} title="Open full profile">
        {img ? (
          <img className="req-head-img" src={imageLink(img)} alt={name} />
        ) : (
          <span className="req-avatar-fallback">
            {(name || email || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </button>

      <div className="req-head-meta">
        <div className="req-head-top">
          <button className="req-head-name linklike" title={name} onClick={onOpen}>
            {name}
          </button>
          <div className="req-badges">
            <span className={`pill-type big ${t}`}>{t}</span>
            <span className={`pill-verify big ${verified ? "ok" : "no"}`}>
              {verified ? "Email verified" : "Unverified"}
            </span>
          </div>
        </div>
        <div className="req-head-sub">
          <span className="muted">{email}</span>
          <span className="dot">•</span>
          <span className="muted country-flag">
            {countryCode ? (
              <>
                <ReactCountryFlag
                  svg
                  countryCode={countryCode}
                  style={{ fontSize: "1.1em", marginRight: 6 }}
                />
              </>
            ) : (
              "—"
            )}
          </span>
          <span className="muted">{evTitle}</span>
        </div>
      </div>
    </div>
  );
}

function BasicDetails({ item, eventTitleMap }) {
  const evId = getEventId(item);
  const evTitle =
    eventTitleMap?.get(evId) ||
    item.event?.title ||
    item.eventTitle ||
    (evId || "—");

  const cc = getCountryCode(item);
  console.log("item",item);
  return (
    <div className="req-sections">
      <Section title="Request">
        <KV k="Role" v={item.role} />
        <KV k="Admin status" v={item.adminVerified} />
        <KV k="Event" v={evTitle} />
        <KV k="Created at" v={fmtDate(item.createdAt)} />
      </Section>
      <Section title="Contact">
        <KV k="Name" v={item.name} />
        <KV k="Email" v={item.email} />
        <div className="req-kv">
          <div className="req-k">Phone Number</div>
          <div className="req-v ">
            {cc ? item.country : (
              "—"
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ----------------------------- Helpers ----------------------------- */

function getId(x) {
  return x?._id || x?.id || String(x?.email || "") + String(x?.createdAt || "");
}
function fmtDate(d) {
  if (!d) return "—";
  const t = new Date(d);
  return isNaN(+t) ? "—" : t.toLocaleString();
}
function getActorPath(item) {
  const id = getId(item);
  const r = (item.role || "member").toLowerCase();
  return `/admin/members/${r}s?id=${id}`;
}
function getAvatar(item) {
  const r = (item.role || "").toLowerCase();
  if (r === "exhibitor") return item.logo || "";
  if (r === "attendee") return item.profilePic || "";
  return "";
}
function getCountryCode(item) {
  // handle both upper and lower keys; prefer already-normalized 2-letter ISO
  const raw =
    item?.country ||
    item?.personal?.country ||
    item?.address?.country ||
    "";
  const code = String(raw || "").trim();
  if (!code) return "";
  return code.length === 2 ? code.toUpperCase() : code.toUpperCase();
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
      <div className="req-v">{v == null || v === "" ? "—" : v}</div>
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

}

/* ----------------------------- Cards ----------------------------- */
