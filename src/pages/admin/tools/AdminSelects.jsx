import React from "react";
import { FiPlus, FiTrash2, FiX, FiLoader, FiRefreshCw } from "react-icons/fi";
import "./admin.selects.css";

// RTK hooks (as you named them)
import {
  useGetSelectsQuery,
  useAddSelectMutation,
  useChangeSelectMutation,
  useDeleteSelectMutation,
} from "../../../features/tools/selectsApiSlice";

/**
 * Data shape (from your spec):
 * data = [
 *   {
 *     id: "a1b2c3",
 *     page: "register attendees",
 *     selectName: "sectors",
 *     options: [{ key: "ai technologies", value: "AITech" }, ...]
 *   }, ...
 * ]
 */

export default function AdminSelects() {
  const {
    data: selects = [],
    isFetching,
    isLoading,
    isError,
    refetch,
  } = useGetSelectsQuery();

  const [addSelect,   { isLoading: adding }]   = useAddSelectMutation();
  const [changeSel,   { isLoading: changing }] = useChangeSelectMutation();
  const [deleteSel,   { isLoading: deleting }] = useDeleteSelectMutation();

  // ───────────────────────────── New Page Wizard ─────────────────────────────
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [pageName, setPageName] = React.useState("");
  const [firstSelectName, setFirstSelectName] = React.useState("");

  const canCreatePage = pageName.trim() && firstSelectName.trim();

  const submitNewPage = async (e) => {
    e.preventDefault();
    if (!canCreatePage) return;
    try {
      // Creating a "page" means: create the first select on that page.
      await addSelect({
        page: pageName.trim(),
        selectName: firstSelectName.trim(),
      }).unwrap();
      setWizardOpen(false);
      setPageName("");
      setFirstSelectName("");
      refetch();
    } catch (err) {
      console.error("Add first select (create page) failed", err);
    }
  };

  // ────────────────────────────── Local helpers ──────────────────────────────
  const grouped = React.useMemo(() => {
    // group by page
    const g = new Map();
    (Array.isArray(selects) ? selects : []).forEach((s) => {
      const p = (s?.page || "Unassigned").trim();
      if (!g.has(p)) g.set(p, []);
      g.get(p).push(s);
    });
    // sort pages A→Z, and selects inside by selectName
    const entries = Array.from(g.entries())
      .map(([p, arr]) => [p, arr.slice().sort((a, b) => cmp(a?.selectName, b?.selectName))]);
    entries.sort((a, b) => cmp(a[0], b[0]));
    return entries;
  }, [selects]);

  function cmp(a, b) {
    const s1 = (a || "").toLowerCase();
    const s2 = (b || "").toLowerCase();
    return s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
  }

  // ─────────────────────────────── UI state maps ─────────────────────────────
  // Add-Select inline row per page:
  const [addingForPage, setAddingForPage] = React.useState(null);
  const [newSelectName, setNewSelectName] = React.useState("");

  // Option input drafts per select id: { [id]: { key:"", value:"" } }
  const [optDrafts, setOptDrafts] = React.useState({});

  const onOpenAddSelect = (page) => {
    setAddingForPage(page);
    setNewSelectName("");
  };
  const onCancelAddSelect = () => {
    setAddingForPage(null);
    setNewSelectName("");
  };
  const confirmAddSelect = async (page) => {
    const name = newSelectName.trim();
    if (!page || !name) return;
    try {
      await addSelect({ page, selectName: name }).unwrap();
      onCancelAddSelect();
      refetch();
    } catch (err) {
      console.error("Add select failed", err);
    }
  };

  const onDraftChange = (id, field, val) => {
    setOptDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: val } }));
  };

  // ▼▼▼ corrected to match updateSelect contract ▼▼▼
  const onAddOption = async (selectId) => {
    const draft = optDrafts[selectId] || {};
    const k = (draft.key || "").trim();
    const v = (draft.value || "").trim();
    if (!selectId || !k || !v) return;
    try {
      // Backend updateSelect: PATCH /selects/:id with { optionsAdd:[{key,value}] }
      await changeSel({ id: selectId, data : {optionsAdd: [{ key: k, value: v }]} }).unwrap();
      setOptDrafts((d) => ({ ...d, [selectId]: { key: "", value: "" } }));
      refetch();
    } catch (err) {
      console.error("Add option failed", err);
    }
  };

  // ▼▼▼ corrected to match updateSelect contract ▼▼▼
  const onDeleteOption = async (selectId, optionKey) => {
    if (!selectId || !optionKey) return;
    try {
      // Backend updateSelect: PATCH /selects/:id with { optionsRemove:[key] }
      await changeSel({ id: selectId, data : {optionsRemove: [optionKey]} }).unwrap();
      refetch();
    } catch (err) {
      console.error("Delete option failed", err);
    }
  };

  const onDeleteSelect = async (selectId) => {
    if (!selectId) return;
    if (!window.confirm("Delete this select? This cannot be undone.")) return;
    try {
      // Keep your existing delete hook for full select deletion
      await deleteSel({ id: selectId }).unwrap();
      refetch();
    } catch (err) {
      console.error("Delete select failed", err);
    }
  };

  // ────────────────────────────────── Render ─────────────────────────────────
  return (
    <div className="sel-page">
      <div className="sel-top card p-10">
        <div className="sel-head">
          <h2 className="sel-title">Selects contents</h2>
          <div className="grow" />
          <button className="btn tiny" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <FiLoader className="spin" /> : <FiRefreshCw />} Refresh
          </button>
          <button className="btn brand ml-8" onClick={() => setWizardOpen((v) => !v)}>
            <FiPlus /> {wizardOpen ? "Close" : "Add page"}
          </button>
        </div>
        {wizardOpen && (
          <form className="sel-wizard" onSubmit={submitNewPage}>
            <div className="sel-wiz-row">
              <label className="sel-lbl">Page name *</label>
              <input
                className="input"
                placeholder="e.g. register attendees"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
              />
            </div>
            <div className="sel-wiz-row">
              <label className="sel-lbl">First select name *</label>
              <input
                className="input"
                placeholder="e.g. sectors"
                value={firstSelectName}
                onChange={(e) => setFirstSelectName(e.target.value)}
              />
            </div>
            <div className="sel-wiz-actions">
              <button className="btn" type="button" onClick={() => setWizardOpen(false)}>
                <FiX /> Cancel
              </button>
              <button className="btn brand" disabled={!canCreatePage || adding}>
                {adding ? <FiLoader className="spin" /> : <FiPlus />} Create page
              </button>
            </div>
            <div className="muted tiny">
              Creating a page confirms after its first select is created (uses <b>useAddSelectMutation</b>).
            </div>
          </form>
        )}
      </div>

      <div className="sel-body">
        {isLoading ? (
          <div className="card p-10 muted">Loading selects…</div>
        ) : isError ? (
          <div className="card p-10 error">Failed to load selects.</div>
        ) : !grouped.length ? (
          <div className="card p-10">
            <div className="muted">No selects yet. Create a page to get started.</div>
          </div>
        ) : (
          grouped.map(([page, arr]) => (
            <section key={page} className="sel-page-group card p-10">
              <div className="sel-page-head">
                <h3 className="sel-page-title">{page}</h3>
                <div className="muted tiny">{arr.length} select{arr.length !== 1 ? "s" : ""}</div>
                <div className="grow" />
                {addingForPage === page ? (
                  <div className="sel-add-select">
                    <input
                      className="input"
                      placeholder="New select name (e.g. sectors)"
                      value={newSelectName}
                      onChange={(e) => setNewSelectName(e.target.value)}
                    />
                    <button
                      className="btn tiny"
                      onClick={() => confirmAddSelect(page)}
                      disabled={!newSelectName.trim() || adding}
                    >
                      {adding ? <FiLoader className="spin" /> : <FiPlus />} Add
                    </button>
                    <button className="btn tiny ghost" onClick={onCancelAddSelect}>
                      <FiX /> Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn tiny" onClick={() => onOpenAddSelect(page)}>
                    <FiPlus /> Add select
                  </button>
                )}
              </div>

              <div className="sel-selects">
                {arr.map((s) => (
                  <SelectCard
                    key={s.id || s._id}
                    item={s}
                    optDraft={optDrafts[s.id || s._id] || { key: "", value: "" }}
                    onDraftChange={(field, val) => onDraftChange(s.id || s._id, field, val)}
                    onAddOption={() => onAddOption(s.id || s._id)}
                    onDeleteOption={(k) => onDeleteOption(s.id || s._id, k)}
                    onDeleteSelect={() => onDeleteSelect(s.id || s._id)}
                    busy={changing || deleting}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Components ─────────────────────────────── */

function SelectCard({
  item,
  optDraft,
  onDraftChange,
  onAddOption,
  onDeleteOption,
  onDeleteSelect,
  busy,
}) {
  const id = item?.id || item?._id || "";
  const name = item?.selectName || item?.name || "—"; // accept either field
  const options = Array.isArray(item?.options) ? item.options : [];

  return (
    <div className="sel-card">
      <div className="sel-card-head">
        <div className="sel-card-title">{name}</div>
        <div className="grow" />
        <button className="btn tiny danger" onClick={onDeleteSelect} disabled={busy}>
          <FiTrash2 /> Delete select
        </button>
      </div>

      <div className="sel-options">
        {options.length ? (
          options.map((op) => (
            <div key={op?.key || Math.random()} className="sel-opt">
              <div className="sel-opt-kv">
                <span className="sel-opt-key">{String(op?.key ?? "—")}</span>
                <span className="sel-opt-arrow">→</span>
                <span className="sel-opt-val">{String(op?.value ?? "—")}</span>
              </div>
              <button
                className="btn tiny danger"
                onClick={() => onDeleteOption(op?.key)}
                title="Delete option"
                disabled={busy}
              >
                <FiTrash2 />
              </button>
            </div>
          ))
        ) : (
          <div className="muted tiny">No options yet.</div>
        )}
      </div>

      <div className="sel-add-opt">
        <input
          className="input"
          placeholder="Key (e.g. AI Technologies)"
          value={optDraft.key || ""}
          onChange={(e) => onDraftChange("key", e.target.value)}
        />
        <input
          className="input"
          placeholder="Value (e.g. AITech)"
          value={optDraft.value || ""}
          onChange={(e) => onDraftChange("value", e.target.value)}
        />
        <button
          className="btn tiny"
          onClick={onAddOption}
          disabled={!optDraft.key?.trim() || !optDraft.value?.trim() || busy}
        >
          <FiPlus /> Add option
        </button>
      </div>

      <div className="sel-id muted tiny">ID: {id}</div>
    </div>
  );
}
