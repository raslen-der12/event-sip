// src/pages/admin/bp/AdminBpQueue.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  useAdminQueueQuery,
  useAdminPublishProfileMutation,
  useAdminListItemsQuery,
  useAdminListProfilesQuery,
  useAdminGetProfileQuery,
} from "../../../features/bp/BPAdminApiSlice";
import imageLink from "../../../utils/imageLink";
import "./admin-bp.css";

/* ========== Icons ========== */
const I = {
  search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 12 5 5 11-11" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  unpub: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19 19 5M5 5l14 14" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  ),
  link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 14a5 5 0 0 1 0-7l2-2a5 5 0 0 1 7 7l-1 1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M14 10a5 5 0 0 1 0 7l-2 2a5 5 0 1 1-7-7l1-1" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  mail: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  phone: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 16.92V21a1 1 0 0 1-1.09 1A19.91 19.91 0 0 1 3 5.09 1 1 0 0 1 4 4h4.09a1 1 0 0 1 1 .75l1 3a1 1 0 0 1-.27 1L8.91 10a16 16 0 0 0 6.19 6.19l1.5-1.91a1 1 0 0 1 1-.27l3 1a1 1 0 0 1 .75 1z" fill="currentColor"/>
    </svg>
  ),
};

/* ========== Safe text helpers ========== */
const pickTextFromObj = (o = {}) => {
  const keys = ["label", "name", "value", "handle", "username", "title", "url", "city", "country"];
  for (const k of keys) if (o && o[k]) return String(o[k]);
  const pairs = Object.entries(o).filter(([, v]) => v != null && v !== "").slice(0, 2);
  return pairs.length ? pairs.map(([k, v]) => `${k}:${v}`).join(" • ") : "";
};
const toText = (v) => {
  if (v == null) return "";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? pickTextFromObj(x) : String(x))).filter(Boolean).join(" • ");
  if (typeof v === "object") return pickTextFromObj(v);
  return String(v);
};

/* ========== Chips, Info grid ========== */
function Chips({ list = [], max = 6, soft = false }) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!arr.length) return null;
  const shown = arr.slice(0, max);
  return (
    <div className="abp-tags" style={{ flexWrap: "wrap" }}>
      {shown.map((t, i) => (
        <span key={i} className={`abp-tag ${soft ? "soft" : ""}`}>{toText(t)}</span>
      ))}
      {arr.length > max ? <span className="abp-tag soft">+{arr.length - max}</span> : null}
    </div>
  );
}

function InfoPair({ label, value, mono=false }) {
  const txt = toText(value);
  if (!txt) return null;
  return (
    <div className="abp-info-row" style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:8 }}>
      <div className="abp-info-k">{label}</div>
      <div className={`abp-info-v ${mono ? "abp-mono" : ""}`}>{txt}</div>
    </div>
  );
}

function InfoGrid({ sel }) {
  const created = sel?.createdAt ? new Date(sel.createdAt).toLocaleString() : "";
  const updated = sel?.updatedAt ? new Date(sel.updatedAt).toLocaleString() : "";
  return (
    <div className="abp-card soft">
      <div className="abp-card-in" style={{ display:"grid", gap:10 }}>
        <InfoPair label="Tagline"   value={sel?.tagline} />
        <InfoPair label="Size"      value={sel?.size} />
        <InfoPair label="Countries" value={sel?.countries} />
        <InfoPair label="Languages" value={sel?.languages} />
        <InfoPair label="Offering"  value={sel?.offering} />
        <InfoPair label="Seeking"   value={sel?.seeking} />
        <InfoPair label="About"     value={sel?.about} />
        {sel?.itemsSummary ? (
          <InfoPair
            label="Items"
            value={`${Number(sel.itemsSummary.total || 0)} total • ${Number(sel.itemsSummary.products || 0)} products • ${Number(sel.itemsSummary.services || 0)} services`}
            mono
          />
        ) : null}
        {(sel?.contacts && sel.contacts.length) ? <ContactsBlock list={sel.contacts}/> : null}
        {sel?.socials ? <SocialsBlock socials={sel.socials}/> : null}
        {(created || updated) ? <InfoPair label="Timestamps" value={`${created}${updated ? ` • updated ${updated}` : ""}`} mono /> : null}
      </div>
    </div>
  );
}

/* ========== Contacts / Socials rendering ========== */
const isUrl = (s="") => /^https?:\/\//i.test(s) || /\.\w{2,}$/.test(s);
const isEmail = (s="") => /\S+@\S+\.\S+/.test(s);
const isPhone = (s="") => /^[+()0-9\-\s]{6,}$/.test(s);

function ContactPill({ t }) {
  const txt = toText(t);
  if (!txt) return null;

  const url = typeof t === "object" && t?.url ? String(t.url) : (isUrl(txt) ? (txt.startsWith("http") ? txt : `https://${txt}`) : "");
  const mail = isEmail(txt) ? `mailto:${txt}` : "";
  const tel  = isPhone(txt) ? `tel:${txt.replace(/\s+/g,"")}` : "";

  let icon = <I.link/>, href = "";
  if (url) { icon = <I.link/>; href = url; }
  else if (mail) { icon = <I.mail/>; href = mail; }
  else if (tel) { icon = <I.phone/>; href = tel; }

  return href ? (
    <a className="abp-tag" href={href} target="_blank" rel="noreferrer">
      {icon} <span style={{ marginLeft:6 }}>{txt}</span>
    </a>
  ) : (
    <span className="abp-tag">{icon} <span style={{ marginLeft:6 }}>{txt}</span></span>
  );
}

function ContactsBlock({ list = [] }) {
  const arr = Array.isArray(list) ? list : [];
  if (!arr.length) return null;
  return (
    <div>
      <div className="abp-subh" style={{ margin: "6px 0 8px" }}>Contacts</div>
      <div className="abp-tags" style={{ flexWrap: "wrap" }}>
        {arr.slice(0, 12).map((t, i) => <ContactPill key={i} t={t} />)}
        {arr.length > 12 ? <span className="abp-tag soft">+{arr.length - 12}</span> : null}
      </div>
    </div>
  );
}

function SocialsBlock({ socials }) {
  // Accepts array or object map
  const entries = Array.isArray(socials)
    ? socials.map((s) => ({ k: toText(s), v: s?.url || toText(s) }))
    : Object.entries(socials || {}).map(([k, v]) => ({ k, v }));

  const rows = entries
    .map(({ k, v }) => {
      const label = toText(k);
      const val = toText(v);
      if (!label && !val) return null;
      const href = isUrl(val) ? (val.startsWith("http") ? val : `https://${val}`) : "";
      return (
        <div key={`${label}-${val}`} className="abp-info-row" style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:8 }}>
          <div className="abp-info-k">{label}</div>
          <div className="abp-info-v">
            {href ? <a href={href} className="abp-link" target="_blank" rel="noreferrer">{val}</a> : val}
          </div>
        </div>
      );
    })
    .filter(Boolean);

  if (!rows.length) return null;
  return (
    <div>
      <div className="abp-subh" style={{ margin: "6px 0 8px" }}>Socials</div>
      <div style={{ display:"grid", gap:8 }}>{rows}</div>
    </div>
  );
}

/* ========== Items preview ========== */
function ItemsPeek({ profileId }) {
  const { data, isFetching } = useAdminListItemsQuery(
    { profileId, limit: 6, page: 1 },
    { skip: !profileId }
  );
  if (!profileId) return null;
  if (isFetching) return <div className="abp-skel" style={{ height: 56 }} />;

  const rows = data?.data || [];
  return (
    <div className="abp-items-peek" key={profileId}>
      {rows.map((r) => (
        <div key={r.id} className="abp-item">
          {r.thumbnailUpload ? (
            <span className="abp-thumb" style={{ backgroundImage: `url(${imageLink(r.thumbnailUpload)})` }} />
          ) : <span className="abp-thumb abp-thumb-ph" />}
          <div className="abp-item-txt">
            <div className="abp-strong">{toText(r.title)}</div>
            <div className="abp-sub">
              {toText(r.kind)} • {toText(r.sector)}{r.subsectorName ? ` • ${toText(r.subsectorName)}` : ""}
            </div>
          </div>
        </div>
      ))}
      {!rows.length && <div className="abp-muted">No items.</div>}
    </div>
  );
}

/* ========== Rows (pending/published) ========== */
function PendingRow({ p, onOpen, onPublish }) {
  return (
    <div className="abp-row" role="button" onClick={() => onOpen(p)} title="Open review">
      <div className="abp-row-l">
        {p.logoUpload ? (
          <img className="abp-logo" src={imageLink(p.logoUpload)} alt={toText(p.name)} />
        ) : <div className="abp-logo abp-logo-ph" />}
        <div>
          <div className="abp-strong">{toText(p.name)}</div>
          <div className="abp-sub">{p.slug || p.id}</div>
        </div>
      </div>
      <div className="abp-row-r" style={{ gap: 8 }}>
        <button
          className="abp-btn d-flex align-items-center"
          onClick={(e) => { e.stopPropagation(); onPublish(p.id, true); }}
        >
          <I.check /> Publish
        </button>
      </div>
    </div>
  );
}

function PublishedRow({ p, onOpen, onUnpublish }) {
  return (
    <div className="abp-row" role="button" onClick={() => onOpen(p)} title="Open details">
      <div className="abp-row-l">
        {p.logoUpload ? (
          <img className="abp-logo" src={imageLink(p.logoUpload)} alt={toText(p.name)} />
        ) : <div className="abp-logo abp-logo-ph" />}
        <div>
          <div className="abp-strong">{toText(p.name)}</div>
          <div className="abp-sub">{p.slug}</div>
          {/* show at most 1 industry chip in list (as requested earlier) */}
          <Chips list={Array.isArray(p.industries) ? p.industries : []} soft max={1} />
        </div>
      </div>
      <div className="abp-row-r" style={{ gap: 8 }}>
        <span className="abp-badge ok">Published</span>
        <button
          className="abp-btn abp-btn-ghost d-flex align-items-center"
          onClick={(e) => { e.stopPropagation(); onUnpublish(p.id, false); }}
          title="Unpublish profile "
        >
          <I.unpub /> Unpublish
        </button>
      </div>
    </div>
  );
}

/* ========== Modal shell ========== */
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div
      className="abp-modal"
      aria-modal="true"
      role="dialog"
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div
        className="abp-card"
        style={{ maxWidth: 900, width: "100%", maxHeight: "86vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="abp-card-head" style={{ alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="abp-btn-ghost" onClick={onClose} aria-label="Close"><I.close /></button>
        </div>
        <div className="abp-card-in">{children}</div>
      </div>
    </div>
  );
}

/* ========== Page ========== */
export default function AdminBpQueue() {
  // filters/paging for pending
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // paging for published
  const [pubPage, setPubPage] = useState(1);
  const [pubLimit, setPubLimit] = useState(12);

  // pending queue
  const { data: qData, isFetching, refetch } = useAdminQueueQuery({ q, page, limit });
  const unpublished = qData?.unpublished || {};
  const pendingList = Array.isArray(unpublished.profiles) ? unpublished.profiles : [];
  const pendingTotal = Number(unpublished.total || 0);
  const pendingMaxPage = Math.max(1, Math.ceil(pendingTotal / Math.max(1, (unpublished.limit || limit))));

  // published list (for unpublishing)
  const { data: pubListResp, isFetching: isPubLoading, refetch: refetchPub } =
    useAdminListProfilesQuery({ q, published: "yes", page: pubPage, limit: pubLimit });
  const publishedRows = pubListResp?.data || [];
  const publishedTotal = pubListResp?.total || 0;
  const publishedMaxPage = Math.max(1, Math.ceil(publishedTotal / Math.max(1, pubLimit)));

  // publish toggle
  const [publish, { isLoading: isToggling }] = useAdminPublishProfileMutation();

  // modal selection (load full profile)
  const [selId, setSelId] = useState(null);
  const onOpen = useCallback((p) => setSelId(p?.id || null), []);
  const onClose = useCallback(() => setSelId(null), []);
  const { data: selData, isFetching: isSelLoading } = useAdminGetProfileQuery(selId, { skip: !selId });
  const sel = selData?.data || null;

  const doTogglePublish = async (profileId, flag) => {
    try {
      await publish({ profileId, published: flag }).unwrap();
      await Promise.all([refetch(), refetchPub()]);
      if (selId === profileId) onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update publish flag.");
    }
  };

  const onSearch = () => {
    setPage(1);
    setPubPage(1);
    refetch();
    refetchPub();
  };

  return (
    <section className="abp">
      <header className="abp-head">
        <div>
          <h1>Approvals & Publishing</h1>
          <p>Review pending profiles and manage published ones.</p>
        </div>
        <div className="abp-actions" style={{ gap: 10 }}>
          <div className="abp-inp" style={{ display:"flex", alignItems:"center", gap:8, paddingInline:12, minWidth:260 }}>
            <I.search />
            <input
              style={{ border:"none", outline:"none", width:"100%", background:"transparent" }}
              placeholder="Search name/slug…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              onKeyDown={(e)=> e.key==="Enter" && onSearch()}
              aria-label="Search"
            />
          </div>

          <select
            className="abp-inp"
            value={String(limit)}
            onChange={(e)=>{ setLimit(Number(e.target.value)||12); setPage(1); }}
            title="Pending per page"
            aria-label="Pending per page"
            style={{ minWidth:140 }}
          >
            {[6,12,24,36,48].map(n => <option key={n} value={n}>Pending: {n}/page</option>)}
          </select>

          <select
            className="abp-inp"
            value={String(pubLimit)}
            onChange={(e)=>{ setPubLimit(Number(e.target.value)||12); setPubPage(1); }}
            title="Published per page"
            aria-label="Published per page"
            style={{ minWidth:160 }}
          >
            {[6,12,24,36,48].map(n => <option key={n} value={n}>Published: {n}/page</option>)}
          </select>

          <button className="abp-btn" onClick={onSearch}>Search</button>
        </div>
      </header>

      {(isFetching || isPubLoading) ? <div className="abp-skel-lg" /> : null}

      <div className="abp-grid">
        {/* Pending approvals */}
        <div className="abp-card">
          <div className="abp-card-head  m-3">
            <h3>Pending approvals</h3>
            <span className="abp-sub">{pendingTotal} total</span>
          </div>
          <div className="abp-list">
            {pendingList.map(p => (
              <div key={p.id} className="abp-card">
                <PendingRow p={p} onOpen={onOpen} onPublish={(id,flag)=>doTogglePublish(id,flag)} />
                <div className="abp-card-in"><ItemsPeek profileId={p.id} /></div>
              </div>
            ))}
            {!pendingList.length && !isFetching && <div className="abp-muted">No pending profiles.</div>}
          </div>
          {pendingTotal > 0 ? (
            <div className="abp-pager">
              <button type="button" className="btn-ghost" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
              <span className="abp-mono">Page {unpublished.page || page} / {pendingMaxPage}</span>
              <button type="button" className="btn" disabled={(unpublished.page || page) >= pendingMaxPage} onClick={()=>setPage(p=>Math.min(pendingMaxPage,p+1))}>Next</button>
            </div>
          ) : null}
        </div>

        {/* Published list */}
        <div className="abp-card">
          <div className="abp-card-head  m-3">
            <h3>Published</h3>
            <span className="abp-sub">{publishedTotal} total</span>
          </div>
          <div className="abp-list">
            {publishedRows.map(p => (
              <PublishedRow key={p.id} p={p} onOpen={onOpen} onUnpublish={(id,flag)=>doTogglePublish(id,flag)} />
            ))}
            {!publishedRows.length && !isPubLoading && <div className="abp-muted">No published profiles match.</div>}
          </div>
          {publishedTotal > 0 ? (
            <div className="abp-pager">
              <button type="button" className="btn-ghost" disabled={pubPage<=1} onClick={()=>setPubPage(p=>Math.max(1,p-1))}>Prev</button>
              <span className="abp-mono">Page {pubPage} / {publishedMaxPage}</span>
              <button type="button" className="btn" disabled={pubPage>=publishedMaxPage} onClick={()=>setPubPage(p=>Math.min(publishedMaxPage,p+1))}>Next</button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Modal: HEADER + INFO GRID + ITEMS + ACTIONS */}
      <Modal open={!!selId} onClose={onClose} title="Review Business Profile">
        {isSelLoading ? <div className="abp-skel" style={{ height: 120 }} /> : null}
        {sel ? (
          <>
            {/* Header */}
            <div className="abp-row" style={{ marginBottom: 10 }}>
              <div className="abp-row-l">
                {sel.logoUpload ? (
                  <img className="abp-logo" src={imageLink(sel.logoUpload)} alt={toText(sel.name)} />
                ) : <div className="abp-logo abp-logo-ph" />}
                <div>
                  <div className="abp-strong">{toText(sel.name)}</div>
                  <div className="abp-sub">{sel.slug || sel.id}</div>
                  <Chips list={sel.industries} soft max={3} />
                </div>
              </div>
              <div className="abp-row-r">
                <span className={`abp-badge ${sel.published ? "ok" : ""}`}>{sel.published ? "Published" : "Pending"}</span>
              </div>
            </div>

            {/* Details grid */}
            <InfoGrid sel={sel} />

            {/* Items */}
            <div className="abp-subh" style={{ marginTop: 12, marginBottom: 8 }}>Latest items</div>
            <ItemsPeek profileId={sel.id} />

            {/* Actions */}
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              {!sel.published ? (
                <button className="abp-btn d-flex align-items-center" disabled={isToggling} onClick={()=>doTogglePublish(sel.id, true)} title="Publish profile">
                  <I.check /> Publish
                </button>
              ) : (
                <button className="abp-btn abp-btn-ghost d-flex align-items-center" disabled={isToggling} onClick={()=>doTogglePublish(sel.id, false)} title="Unpublish profile">
                  <I.unpub /> Unpublish
                </button>
              )}
              <button className="abp-btn-ghost" onClick={onClose}>Close</button>
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
