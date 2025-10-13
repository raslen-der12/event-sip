import React from "react";
import { useNavigate } from "react-router-dom";
import "./admin.member-requests.css";

import {
  useGetAdminRegisterRequestQuery,
  useUpdateAdminRegisterRequestMutation,
} from "../../../features/Actor/adminApiSlice";

import imageLink from "../../../utils/imageLink";

export default function AdminMemberRequests() {
  const navigate = useNavigate();

  // UI state
  const [type, setType] = React.useState("");       // "", "pending", "yes", "no"
  const [limit, setLimit] = React.useState(20);     // only when type && !search
  const [search, setSearch] = React.useState("");   // only when type && search
  const [selectedId, setSelectedId] = React.useState(null);

  // Valid combos per API
  const queryArgs = React.useMemo(() => {
    if (!type) return {};
    if (search.trim()) {
      const s = search.trim();
      return { adminVerif: type, adminVerify: type, search: s };
    }
    return { adminVerif: type, adminVerify: type, limit: Number(limit) || 20 };
  }, [type, limit, search]);

  const { data: buckets, isLoading, isFetching, refetch } =
    useGetAdminRegisterRequestQuery(queryArgs);

  const [updateReq, { isLoading: mutating }] = useUpdateAdminRegisterRequestMutation();

  // Buckets
  const pending  = buckets?.pending ?? [];
  const accepted = buckets?.yes ?? [];
  const rejected = buckets?.no ?? [];

  // Helper: find selected across ALL buckets (not just pending)
  const findById = React.useCallback(
    (id) => {
      if (!id) return null;
      return (
        pending.find(x => getId(x) === id) ||
        accepted.find(x => getId(x) === id) ||
        rejected.find(x => getId(x) === id) ||
        null
      );
    },
    [pending, accepted, rejected]
  );

  // Default selection: first available (pending > accepted > rejected)
  React.useEffect(() => {
    if (selectedId) return;
    const first =
      (pending[0] && getId(pending[0])) ||
      (accepted[0] && getId(accepted[0])) ||
      (rejected[0] && getId(rejected[0])) ||
      null;
    if (first) setSelectedId(first);
  }, [pending, accepted, rejected, selectedId]);

  // Selected item (from any bucket)
  const selected = React.useMemo(() => findById(selectedId), [selectedId, findById]);

  // Actions (allowed depend on current status)
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

  // Navigation (ONLY from details)
  const openProfile = (item) => navigate(getActorPath(item));

  // Tabs
  const onTypeChange = (next) => {
    setType(next);
    setSearch("");
    if (next && !search.trim()) setLimit(v => v || 20);
  };

  // Show more: switch to that bucket & bump limit (lists stay on top)
  const showMore = (bucket) => {
    setType(bucket);
    setSearch("");
    setLimit((v) => Math.min(200, (Number(v) || 20) + 20));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="req-page">
      {/* Top bar (unchanged design) */}
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
            <label className="req-lbl">Search {type ? `(${type})` : ""}</label>
            <input
              className="input"
              placeholder={type ? "Email or Full name" : "Pick a tab to search"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={!type}
            />
          </div>

          <div className="req-ctrl">
            <label className="req-lbl">Results per page</label>
            <select
              className="input"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value) || 20)}
              disabled={!type || !!search.trim()}
            >
              {[10,20,30,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <button className="btn" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ===== Lists (TOP) ===== */}
      <div className="req-lists">
        {/* Pending */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <h3 className="req-col-title">Pending</h3>
            <span className="req-count">{pending.length}</span>
          </div>
          <div className="req-list">
            {isLoading && !buckets ? skeletonList()
              : pending.length ? pending.map(it => (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => setSelectedId(getId(it))} // select -> details
                  />
                ))
                : <div className="muted">No pending requests.</div>}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("pending")}>Show more</button>
          </div>
        </section>

        {/* Accepted */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <h3 className="req-col-title">Accepted</h3>
            <span className="req-count yes">{accepted.length}</span>
          </div>
          <div className="req-list">
            {isLoading && !buckets ? skeletonList()
              : accepted.length ? accepted.map(it => (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => setSelectedId(getId(it))} // NOW selectable
                  />
                ))
                : <div className="muted">No accepted requests.</div>}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("yes")}>Show more</button>
          </div>
        </section>

        {/* Rejected */}
        <section className="req-col card p-10">
          <div className="req-col-head">
            <h3 className="req-col-title">Rejected</h3>
            <span className="req-count no">{rejected.length}</span>
          </div>
          <div className="req-list">
            {isLoading && !buckets ? skeletonList()
              : rejected.length ? rejected.map(it => (
                  <RequestCard
                    key={getId(it)}
                    item={it}
                    active={getId(it) === selectedId}
                    onSelect={() => setSelectedId(getId(it))} // NOW selectable
                  />
                ))
                : <div className="muted">No rejected requests.</div>}
          </div>
          <div className="req-more">
            <button className="btn tiny" onClick={() => showMore("no")}>Show more</button>
          </div>
        </section>
      </div>

      {/* ===== Details (BOTTOM, full width) ===== */}
      <aside className="req-detail card p-12">
        <h3 className="req-detail-title">Request details</h3>
        {!selected ? (
          <div className="muted">Select a request from the lists above.</div>
        ) : (
          <>
            <HeaderBlock item={selected} onOpen={() => openProfile(selected)} />
            <BasicDetails item={selected} />

            <div className="req-actions">
              <button className="btn" onClick={() => openProfile(selected)}>Open full profile</button>
              <div className="grow" />
              {/* Show actions according to status */}
              {selected.adminVerified !== "yes" && (
                <button className="btn brand" onClick={accept} disabled={mutating}>Accept</button>
              )}
              {selected.adminVerified !== "no" && (
                <button className="btn danger" onClick={reject} disabled={mutating}>Reject</button>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/* ----------------------------- Cards (unchanged visuals) ----------------------------- */

function RequestCard({ item, onSelect, active }) {
  const t = (item.role || "").toLowerCase() || "member";
  const name = item.name || "—";
  const email = item.email || "—";
  const country = item.country || "—";
  const verified = !!item.verifiedEmail;
  const img = getAvatar(item);

  return (
    <button className={`req-card ${active ? "is-active" : ""}`} onClick={onSelect} title="Show details">
      <div className="req-avatar">
        {img
          ? <img className="req-avatar-img" src={imageLink(img)} alt={name} />
          : <span className="req-avatar-fallback">{(name || email || "?").slice(0,1).toUpperCase()}</span>}
      </div>

      <div className="req-meta">
        <div className="req-name line-1">{name}</div>
        <div className="req-sub line-1">{email}</div>
        <div className="req-sub tiny">{country}</div>
      </div>

      <div className="req-tags">
        <span className={`pill-type ${t}`}>{t}</span>
        <span className={`pill-verify ${verified ? "ok" : "no"}`}>{verified ? "Email verified" : "Unverified"}</span>
      </div>
    </button>
  );
}

function HeaderBlock({ item, onOpen }) {
  const t = (item.role || "").toLowerCase() || "member";
  const name = item.name || "—";
  const email = item.email || "—";
  const country = item.country || "—";
  const verified = !!item.verifiedEmail;
  const img = getAvatar(item);

  return (
    <div className="req-head">
      <button className="req-head-avatar" onClick={onOpen} title="Open full profile">
        {img
          ? <img className="req-head-img" src={imageLink(img)} alt={name} />
          : <span className="req-avatar-fallback">{(name || email || "?").slice(0,1).toUpperCase()}</span>}
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
          <span className="muted">{country}</span>
        </div>
      </div>
    </div>
  );
}

function BasicDetails({ item }) {
  return (
    <div className="req-sections">
      <Section title="Request">
        <KV k="Role" v={item.role} />
        <KV k="Admin status" v={item.adminVerified} />
        <KV k="Created at" v={fmtDate(item.createdAt)} />
      </Section>
      <Section title="Contact">
        <KV k="Name" v={item.name} />
        <KV k="Email" v={item.email} />
        <KV k="Country" v={item.country} />
      </Section>
    </div>
  );
}

/* ----------------------------- Helpers ----------------------------- */

function getId(x) { return x?._id || x?.id || String(x?.email || "") + String(x?.createdAt || ""); }
function fmtDate(d){ if(!d) return "—"; const t=new Date(d); return isNaN(+t)?"—":t.toLocaleString(); }
function getActorPath(item){
  const id = getId(item);
  const r = (item.role || "member").toLowerCase();
  return `/admin/members/${r}s?id=${id}`;

}


function getAvatar(item){
  const r = (item.role || "").toLowerCase();
  if (r === "exhibitor") return item.logo || "";
  if (r === "attendee")  return item.profilePic || "";
  return "";
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
