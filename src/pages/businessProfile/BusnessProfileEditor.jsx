// src/pages/businessProfile/BusnessProfileEditor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  // Profile (mine)
  useGetMyBPQuery,
  useCreateOrGetBPMutation,
  useSetBPLogoMutation,
  useSetBPBannerMutation,
  useAddToGalleryMutation,
  useRemoveFromGalleryMutation,
  usePatchBPContactsMutation,
  useSetBPLegalDocMutation,
  // Items (mine)
  useListMyBPItemsQuery,
  useCreateBPItemMutation,
  useUpdateBPItemMutation,
  useDeleteBPItemMutation,
  useAddBPItemImagesMutation,
  useRemoveBPItemImageMutation,
  useSetBPItemThumbnailMutation,
  useGetBPTaxonomyQuery,
  // Utils
  useUploadFileMutation,
  useGetFacetsSelectsQuery,
  // Optional admin publish toggle (guarded)
  useAdminSetProfilePublishedMutation,
  useGetMyTeamQuery,
  useLazySearchPeopleQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
} from "../../features/bp/BPApiSlice";

import "./business-profile-editor.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";
import imageLink from "../../utils/imageLink";

/* ---------- Fallback banner (SVG mesh) ---------- */
const STANDARD_BANNER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="420" viewBox="0 0 1600 420">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stop-color="#1C3664"/>
        <stop offset="100%" stop-color="#EB5434"/>
      </linearGradient>
      <radialGradient id="blob1" cx="0.2" cy="0.2" r="0.5">
        <stop offset="0%" stop-color="#6da7ff" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#6da7ff" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="blob2" cx="0.85" cy="0.15" r="0.5">
        <stop offset="0%" stop-color="#ffc8b5" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#ffc8b5" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="blob3" cx="0.7" cy="0.9" r="0.6">
        <stop offset="0%" stop-color="#ffd36e" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#ffd36e" stop-opacity="0"/>
      </radialGradient>
      <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" result="noise"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.04"/></feComponentTransfer>
      </filter>
      <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="60%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.35)"/>
      </radialGradient>
    </defs>
    <rect width="1600" height="420" fill="url(#bg)"/>
    <rect width="1600" height="420" fill="url(#blob1)"/>
    <rect width="1600" height="420" fill="url(#blob2)"/>
    <rect width="1600" height="420" fill="url(#blob3)"/>
    <rect width="1600" height="420" filter="url(#grain)"/>
    <rect width="1600" height="420" fill="url(#vignette)"/>
  </svg>`);

const initialsLogo = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?fontFamily=Montserrat&seed=${encodeURIComponent(
    (name || "BP").slice(0, 24)
  )}`;

const titleize = (s = "") => s.replace(/(^|\s|-)\w/g, (m) => m.toUpperCase());
const initialsAvatar = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?fontFamily=Montserrat&seed=${encodeURIComponent(
    (name || "TM").slice(0, 24)
  )}`;
function Field({ label, children, hint }) {
  return (
    <div className="bpe-field">
      <label className="bpe-label">{label}</label>
      <div className="bpe-control">{children}</div>
      {hint ? <div className="bpe-hint">{hint}</div> : null}
    </div>
  );
}
//add start
const toKey = (v) =>
  String(typeof v === "string" ? v : v?.value ?? v?.code ?? v?.key ?? v?.id ?? v?.name ?? v?.label ?? "")
    .trim()
    .toLowerCase();

const normalizeOpt = (opt) => {
  if (typeof opt === "string") {
    const key = toKey(opt);
    return { value: key, label: titleize(opt) };
  }
  // object option; prefer label/name for display, but use a stable key for value
  const rawKey = opt.value ?? opt.code ?? opt.key ?? opt.id ?? opt.name ?? opt.label ?? "";
  return {
    value: toKey(rawKey),
    label: opt.label || opt.name || titleize(rawKey),
  };
};
async function uploadFilesCollectIdsAndPaths(uploadFile, files) {
  const uploadIds = [];
  const uploadPaths = [];

  for (const f of files) {
    const fd = new FormData();
    fd.append("file", f);
    // shape can vary; we check common keys
    const up = await uploadFile(fd).unwrap();
    const id =
      up?.uploadId || up?.id || up?._id || up?.data?.uploadId || up?.data?.id;
    const path = up?.path || up?.url || up?.data?.path || up?.data?.url;

    if (id) uploadIds.push(String(id));
    else if (path) uploadPaths.push(String(path));
  }

  return { uploadIds, uploadPaths };
}
//add end

function TextInput({ value, onChange, placeholder = "", ...rest }) {
  return (
    <input
      className="bpe-input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  );
}

function TextArea({ value, onChange, rows = 4, placeholder = "", ...rest }) {
  return (
    <textarea
      className="bpe-textarea"
      rows={rows}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select…" }) {
  const norm = (opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt;

  return (
    <select
      className="bpe-select"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => {
        const o = norm(opt);
        return (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        );
      })}
    </select>
  );
}

function MultiSelect({ values = [], onChange, options = [] }) {
  const list = options.map(normalizeOpt);
  const selected = new Set((values || []).map(toKey));

  function toggle(v) {
    const k = toKey(v);
    const next = new Set(selected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    // we store canonical lowercase keys (stable + matches comparisons)
    onChange(Array.from(next));
  }

  return (
    <div className="bpe-chipset">
      {list.map((o) => {
        const active = selected.has(o.value);
        return (
          <button
            type="button"
            key={o.value}
            className={`bp-chip ${active ? "is-active" : ""}`}
            onClick={() => toggle(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ArrayInput({
  values = [],
  onChange,
  placeholder = "Type & press Enter",
}) {
  const [draft, setDraft] = useState("");
  function onKey(e) {
    if (e.key === "Enter" && draft.trim()) {
      onChange([...(values || []), draft.trim()]);
      setDraft("");
    }
  }
  function remove(idx) {
    const next = (values || []).slice();
    next.splice(idx, 1);
    onChange(next);
  }
  return (
    <>
      <div className="bpe-chiplist">
        {(values || []).map((v, i) => (
          <span key={`${String(v)}-${i}`} className="bpe-chipline">
            {String(v)}
            <button
              type="button"
              className="bpe-chipx"
              onClick={() => remove(i)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="bpe-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
      />
    </>
  );
}

function FileDrop({
  onPick,
  accept = "image/*",
  label = "Upload",
  sub = "PNG/JPG under 5MB",
}) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      className={`bp-drop ${over ? "is-over" : ""}`}
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onPick(f);
      }}
    >
      <div className="bpe-drop-ico">⬆</div>
      <div className="bpe-drop-title">{label}</div>
      <div className="bpe-drop-sub">{sub}</div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
function TeamSelectModal({
  query,
  setQuery,
  draftRole,
  setDraftRole,
  results = [],
  searching = false,
  onPick,
  onClose,
}) {
  return (
    <div className="bpe-modal">
      <div className="bpe-modal-backdrop" onClick={onClose} />
      <div
        className="bpe-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Add team member"
      >
        <header className="bpe-modal-head">
          <h3 className="bpe-modal-title">Add team member</h3>
          <button className="bpe-modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="bpe-modal-bar">
          <input
            className="bpe-input"
            placeholder="Search exhibitors, speakers, attendees…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="bpe-results">
          {searching && <div className="bpe-muted">Searching…</div>}
          {!searching && results.length === 0 && query ? (
            <div className="bpe-muted">No matches.</div>
          ) : null}

          {results.map((r) => {
            const name =
              r?.name ||
              r?.displayName ||
              [r?.firstName, r?.lastName].filter(Boolean).join(" ") ||
              "—";

            const avatar =
              imageLink(r?.avatarUpload) ||
              imageLink(r?.photoUpload) ||
              imageLink(r?.logoUpload) ||
              imageLink((Array.isArray(r?.images) && r.images[0]) || "") ||
              initialsAvatar(name);

            const subtitle = [
              r?.entityType,
              r?.title || r?.position || r?.jobTitle,
            ]
              .filter(Boolean)
              .join(" • ");

            return (
              <article
                key={`${r.entityType}-${r.entityId}`}
                className="bpe-person"
              >
                <div className="bpe-person-pic">
                  <img src={avatar} alt={name} />
                </div>
                <div className="bpe-person-main">
                  <div className="bpe-person-name">{name}</div>
                  {subtitle ? (
                    <div className="bpe-person-sub">{subtitle}</div>
                  ) : null}
                </div>
                <div className="bpe-person-actions">
                  <button className="btn" onClick={async () => onPick(r)}>
                    Add
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="bpe-modal-foot">
          <button className="btn btn-line" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}


function PersonCard({ person, onAdd, adding }) {
  const name =
    person?.name ||
    [person?.firstName, person?.lastName].filter(Boolean).join(" ") ||
    "—";

  const title =
    person?.title || person?.position || person?.role || person?.jobTitle || "";

  const type = person?.entityType; // exhibitor | speaker | attendee

  const avatarRaw =
    person?.avatarUpload ||
    person?.photoUpload ||
    person?.logoUpload ||
    person?.avatarUrl ||
    person?.photoUrl ||
    person?.imageUrl ||
    person?.logoUrl ||
    (Array.isArray(person?.images) && person.images[0]) ||
    "";

  const avatar = avatarRaw
    ? imageLink(avatarRaw)
    : `https://api.dicebear.com/7.x/initials/svg?fontFamily=Montserrat&seed=${encodeURIComponent(
        name.slice(0, 24)
      )}`;

  return (
    <article className="bpe-modal-card">
      <div className="bpe-pic">
        <img src={avatar} alt={name} />
      </div>
      <div className="bpe-info">
        <div className="bpe-line">
          <span className="bpe-name">{name}</span>
          {type ? <span className={`bpe-type ${type}`}>{type}</span> : null}
        </div>
        {title ? <div className="bpe-sub">{title}</div> : null}
      </div>
      <button
        className="btn"
        disabled={adding}
        onClick={onAdd}
        title="Add to team"
      >
        {adding ? "Adding…" : "Add"}
      </button>
    </article>
  );
}

/* =================== Business Profile Editor =================== */
export default function BusnessProfileEditor() {
    const navigate = useNavigate();
  const { data: facets } = useGetFacetsSelectsQuery();
  const countryOptions = Array.isArray(facets?.countries)
    ? facets.countries
    : [];
  const languageOptions = Array.isArray(facets?.languages)
    ? facets.languages
    : [];
  /* ----------- Load / ensure profile ----------- */
  const {
    data: bpResp,
    isFetching: bpFetching,
    refetch: refetchBP,
  } = useGetMyBPQuery();
  const { data: taxResp, isFetching: taxFetching } = useGetBPTaxonomyQuery();
  const [ensureBP, { isLoading: savingBP }] = useCreateOrGetBPMutation();
  /* ----------- Media ----------- */
  const [setLogo, { isLoading: uploadingLogo }] = useSetBPLogoMutation();
  const [setBanner, { isLoading: uploadingBanner }] = useSetBPBannerMutation();
  const [addToGallery] = useAddToGalleryMutation();
  const [removeFromGallery] = useRemoveFromGalleryMutation();
  const [setLegalDoc, { isLoading: uploadingDoc }] = useSetBPLegalDocMutation();

  /* ----------- Items ----------- */
  const {
    data: itemsResp,
    isFetching: itemsFetching,
    refetch: refetchItems,
  } = useListMyBPItemsQuery();
  async function refreshEditingItemLocal(itemId) {
    const refreshed = await refetchItems()
      .unwrap()
      .catch(() => null);
    const freshList = Array.isArray(refreshed?.data)
      ? refreshed.data
      : Array.isArray(refreshed)
      ? refreshed
      : [];
    const fresh = freshList.find((x) => String(x._id) === String(itemId));
    if (fresh) {
      setEditingItem((prev) =>
        prev && String(prev._id) === String(itemId)
          ? { ...prev, ...fresh, subsectorId: fresh.subsectorId || "" }
          : prev
      );
    }
  }
  const [createItem] = useCreateBPItemMutation();
  const [updateItem] = useUpdateBPItemMutation();
  const [deleteItem] = useDeleteBPItemMutation();
  const [addItemImages] = useAddBPItemImagesMutation();
  const [removeItemImage] = useRemoveBPItemImageMutation();
  const [setItemThumb] = useSetBPItemThumbnailMutation();

  /* ----------- Contacts/socials ----------- */
  const [patchContacts, { isLoading: savingContacts }] =
    usePatchBPContactsMutation();

  /* ----------- Upload helpers ----------- */
  const [uploadFile] = useUploadFileMutation();

  const [setPublished, { isLoading: publishing }] =
    useAdminSetProfilePublishedMutation();
  /* ----------- Team (search  add/remove) ----------- */

  const { data: myTeamResp, refetch: refetchTeam } = useGetMyTeamQuery();
  const team = Array.isArray(myTeamResp?.data) ? myTeamResp.data : [];
  const [triggerSearch, { data: peopleResp, isFetching: searching }] =
    useLazySearchPeopleQuery();
  const searchResults = Array.isArray(peopleResp?.data) ? peopleResp.data : [];
  const [addTeamMember, { isLoading: addingMember }] =
    useAddTeamMemberMutation();
  const [removeTeamMember, { isLoading: removingMember }] =
    useRemoveTeamMemberMutation();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draftRole, setDraftRole] = useState("");

  // simple debounce-ish search
  useEffect(() => {
    const t = setTimeout(() => triggerSearch({ q: query, limit: 12 }), 220);
    return () => clearTimeout(t);
  }, [query, triggerSearch]);

  async function onPickPerson(pick) {
    console.log("pick",pick);
    try {
      await addTeamMember({
        entityId: pick.entityId,
        role: pick.entityType,
      }).unwrap();
    } catch (e) {
      const msg = String(e?.data?.error || e?.error || "");
      if (msg.includes("BP_NOT_FOUND")) {
        // No profile -> send to create form
        navigate("/businessprofile/form");
        return;
      } else {
        throw e;
      }
    }

    setDraftRole("");
    setQuery("");
    await Promise.all([refetchTeam(), refetchBP()]);
    setTeamModalOpen(false);
  }

  async function onRemovePerson(m) {
    await removeTeamMember({
      entityType: m.entityType,
      entityId: m.entityId,
    }).unwrap();
    await refetchTeam();
  }

  /* ----------- Resolve profile shape safely ----------- */
  const profile = useMemo(
    () => bpResp?.profile || bpResp?.data || bpResp || null,
    [bpResp]
  );
  useEffect(() => {
    if (!bpFetching && !profile) {
      navigate("/businessprofile/form", { replace: true });
    }
  }, [bpFetching, profile, navigate]);

  /* ----------- Form state (Basics) ----------- */
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [size, setSize] = useState("1-10");
  const taxonomy = useMemo(() => taxResp?.data || taxResp || [], [taxResp]);
  const sectorOptions = useMemo(
    () => taxonomy.map((t) => t.sector),
    [taxonomy]
  );
  const sectorByKey = useMemo(() => {
    const m = new Map();
    taxonomy.forEach((t) => m.set(t.sector, t));
    return m;
  }, [taxonomy]);

  const [sector, setSector] = useState(""); // lowercased key
  const [subsectors, setSubsectors] = useState([]); // display names for Identity only
  const subsectorOptions = useMemo(() => {
    const row = sectorByKey.get(sector);
    return row ? row.subsectors.map((s) => s.name) : [];
  }, [sector, sectorByKey]);

  const [countries, setCountries] = useState([]);
  console.log("countries",countries);
  const [languages, setLanguages] = useState([]);
  const [offering, setOffering] = useState([]);
  const [seeking, setSeeking] = useState([]);
  const [innovation, setInnovation] = useState([]);

  /* ----------- Media preview ----------- */
  const logoUrlRaw = imageLink(profile?.logoUpload);
  const bannerUrlRaw = imageLink(profile?.bannerUpload);
  const bannerUrl = bannerUrlRaw || STANDARD_BANNER;
  const logoUrl = logoUrlRaw || initialsLogo(name);
  const gallery = Array.isArray(profile?.gallery) ? profile.gallery : [];

  /* ----------- Contacts & socials ----------- */
  const [contacts, setContacts] = useState([]);
  const [socials, setSocials] = useState([]);

  /* ----------- Items editor ----------- */
  const items = itemsResp?.data || itemsResp || [];
  const [editingItem, setEditingItem] = useState(null);
  const [itemErr, setItemErr] = useState("");
  const [copied, setCopied] = useState(false);
  async function copyShareUrl() {
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${base}/BusinessProfile/${profile?._id || ""}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // fallback
      const url = `/BusinessProfile/${profile?._id || ""}`;
      window.prompt("Copy this link:", url);
    }
  }
  /* ----------- Initialize form from profile ----------- */
  useEffect(() => {
    if (!profile) return;

    setName(profile.name || "");
    setTagline(profile.tagline || "");
    setAbout(profile.about || "");
    setSize(profile.size || "1-10");

    const ind = Array.isArray(profile.industries) ? profile.industries : [];
    // sectors are stored lowercased; match against backend sectors
    const foundSector =
      ind.find((x) => sectorOptions.includes(String(x).toLowerCase())) || "";
    const secKey = String(foundSector).toLowerCase();
    setSector(secKey);
    // keep subsectors as display names (Identity only)
    const ss = (() => {
      const row = sectorByKey.get(secKey);
      if (!row) return [];
      const allowed = new Set(row.subsectors.map((s) => s.name));
      return ind.filter((x) => x !== secKey && allowed.has(String(x)));
    })();
    setSubsectors(ss);
    setCountries(Array.isArray(profile.countries) ? profile.countries.map(toKey) : []);
        setLanguages(Array.isArray(profile.languages) ? profile.languages : []);
    setOffering(Array.isArray(profile.offering) ? profile.offering : []);
    setSeeking(Array.isArray(profile.seeking) ? profile.seeking : []);
    setInnovation(Array.isArray(profile.innovation) ? profile.innovation : []);
    setContacts(Array.isArray(profile.contacts) ? profile.contacts : []);
    setSocials(Array.isArray(profile.socials) ? profile.socials : []);
  }, [profile, sectorOptions, sectorByKey]);

  /* ----------- Save (create or update) ----------- */
  async function saveBasics() {
    const industries = [
      ...(sector ? [String(sector).toLowerCase()] : []),
      ...subsectors.filter(Boolean), // names
    ];
    if (!profile?._id) {
      navigate("/businessprofile/form");
      return;
    }
    // 2) generic PATCH to update basics
    await patchContacts({
      name,
      tagline,
      about,
      size,
      industries,
      countries,
      languages,
      offering,
      seeking,
      innovation,
    }).unwrap();
    await refetchBP();
  }

  /* ----------- Media handlers ----------- */
  async function onLogo(file) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await uploadFile(fd).unwrap();
    const path = up?.path || up?.url || up?.data?.path;
    if (!path) throw new Error("Upload failed");
    await setLogo({ path }).unwrap();
    await refetchBP();
  }

  async function onBanner(file) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await uploadFile(fd).unwrap();
    const path = up?.path || up?.url || up?.data?.path;
    if (!path) throw new Error("Upload failed");
    await setBanner({ path }).unwrap();
    await refetchBP();
  }

  async function onAddGallery(files) {
    const { uploadIds, uploadPaths } = await uploadFilesCollectIdsAndPaths(
      uploadFile,
      files
    );
    if (uploadIds.length || uploadPaths.length) {
      await addToGallery({ uploadIds, uploadPaths }).unwrap();
      await refetchBP();
    }
  }

  async function onRemoveGalleryImage(imageId) {
    await removeFromGallery({ imageId }).unwrap();
    await refetchBP();
  }

  /* ----------- Contacts / Socials ----------- */
  function addContact() {
    setContacts((prev) => [...prev, { kind: "email", value: "", label: "" }]);
  }
  function addSocial() {
    setSocials((prev) => [...prev, { kind: "website", url: "" }]);
  }
  function updateContact(idx, patch) {
    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...patch } : c))
    );
  }
  function removeContact(idx) {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateSocial(idx, patch) {
    setSocials((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }
  function removeSocial(idx) {
    setSocials((prev) => prev.filter((_, i) => i !== idx));
  }
  async function saveContacts() {
    await patchContacts({ contacts, socials }).unwrap();
    await refetchBP();
  }

  /* ----------- Items CRUD ----------- */
  async function upsertItem(payload) {
    if (payload?._id) {
      const { _id, ...body } = payload;
      return updateItem({ itemId: _id, ...body }).unwrap();
    }
    return createItem(payload).unwrap();
  }

  async function onSaveItem() {
    setItemErr("");
    const title = (editingItem?.title || "").trim();
    const isect = (editingItem?.sector || "").trim().toLowerCase();
    const isub = (editingItem?.subsectorId || "").trim();
    const kind = (editingItem?.kind || "").trim();
    if (!title) return setItemErr("Title is required.");
    if (!isect) return setItemErr("Please select a sector.");
    if (!isub) return setItemErr("Please select a subsector.");
    if (!["product", "service"].includes(kind)) {
      setItemErr("Please choose kind: product or service.");
      return;
    }
    const payload = {
      title,
      kind,
      sector: isect,
      subsectorId: isub,
      summary: editingItem?.descr || "",
      details: editingItem?.details || "", // keep if you add a long editor later
      tags: Array.isArray(editingItem?.tags) ? editingItem.tags : [],
      pricingNote: editingItem?.price || "",
    };
    // NEW: respect the API slice shapes
    if (editingItem?._id) {
      await updateItem({ itemId: editingItem._id, ...payload }).unwrap();
      await refetchItems();
      setEditingItem(null);
    } else {
      const created = await createItem(payload).unwrap();
      const newId =
        created?.id ||
        created?._id ||
        created?.data?.id ||
        created?.data?._id ||
        null;

      await refetchItems();

      if (newId) {
        // open it for immediate image uploads
        await refreshEditingItemLocal(newId);
      } else {
        // fallback: clear editor if API didn’t return an id
        setEditingItem(null);
      }
    }
  }

  async function onDeleteItem(id) {
    if (!window.confirm("Delete this item?")) return;
    await deleteItem(id).unwrap();
    if (editingItem?._id === id) setEditingItem(null);
    await refetchItems();
  }

  async function onAddItemImages(files) {
    if (!editingItem?._id) return;

    const { uploadIds, uploadPaths } = await uploadFilesCollectIdsAndPaths(
      uploadFile,
      files
    );
    if (uploadIds.length === 0 && uploadPaths.length === 0) return;

    const resp = await addItemImages({
      itemId: editingItem._id,
      uploadIds,
      uploadPaths,
    }).unwrap();

    const serverImages = Array.isArray(resp?.images) ? resp.images : [];

    setEditingItem((prev) => {
      const prevImgs = Array.isArray(prev?.images)
        ? prev.images.map(String)
        : [];
      const merged = Array.from(
        new Set([
          ...prevImgs,
          ...uploadIds.map(String),
          ...uploadPaths.map(String),
        ])
      );
      const finalImgs = serverImages.length ? serverImages : merged;
      return { ...prev, images: finalImgs };
    });

    await refetchItems();
  }
  async function onRemoveItemImage(uploadId) {
    if (!editingItem?._id) return;
    await removeItemImage({ itemId: editingItem._id, uploadId }).unwrap();
    setEditingItem((prev) => {
      const nextImgs = (prev?.images || []).filter(
        (x) => String(x) !== String(uploadId)
      );
      return { ...prev, images: nextImgs };
    });
    await refetchItems();
  }

  async function onSetItemThumb(uploadIdOrPath) {
    if (!editingItem?._id) return;
    await setItemThumb({
      itemId: editingItem._id,
      uploadId: uploadIdOrPath,
      uploadPath: uploadIdOrPath,
    }).unwrap();
    await refreshEditingItemLocal(editingItem._id);
  }

  /* ----------- Publish (guard) ----------- */
  async function togglePublish(next) {
    if (!profile?._id) return;
    try {
      await setPublished({
        id: profile._id,
        body: { published: !!next },
      }).unwrap();
      await refetchBP();
    } catch {
      alert(
        "Publish action is restricted. Your profile will remain a draft until approved."
      );
    }
  }

  /* ----------- UI helpers ----------- */
  const busy =
    bpFetching ||
    savingBP ||
    uploadingLogo ||
    uploadingBanner ||
    uploadingDoc ||
    itemsFetching ||
    savingContacts ||
    publishing;

  const itemSectorOptions = sectorOptions; // lowercased keys
  const itemSubsectorOptions = useMemo(() => {
    const sec = String(editingItem?.sector || "");
    const row = sectorByKey.get(sec);
    return row ? row.subsectors : [];
  }, [editingItem?.sector, sectorByKey]);
  if (!bpFetching && !profile) return null;
  /* =================== Render =================== */
  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <div className="bpe-editor">
        {/* Sticky top bar */}
        <header className="bpe-topbar">
          <div className="container">
            <div className="bpe-topbar-left">
              <div className="bpe-top-title">Business Profile</div>
              <div className="bpe-top-sub">
                {profile?.published ? (
                  <span className="bpe-badge -ok">Published</span>
                ) : (
                  <span className="bpe-badge -warn">Draft</span>
                )}
                {profile?._id ? (
                  <a
                    className="bpe-pill"
                    href="/BusinessProfile"
                    target="_blank"
                    rel="noreferrer"
                    title="Open owner view"
                  >
                    <span className="bpe-pill-ico" aria-hidden>
                      👁️
                    </span>
                    View public page
                  </a>
                ) : null}
                {profile?._id ? (
                  <button
                    type="button"
                    className={`bpe-pill ${copied ? "is-copied" : ""}`}
                    onClick={copyShareUrl}
                    title="Copy public link"
                  >
                    <span className="bpe-pill-ico" aria-hidden>
                      🔗
                    </span>
                    {copied ? "Copied!" : "Copy share link"}
                  </button>
                ) : null}
                {busy ? <span className="bpe-dot">Saving…</span> : null}
              </div>
            </div>

            <div className="bpe-topbar-actions">
              <button className="btn mx" disabled={busy} onClick={saveBasics}>
                Save
              </button>
              <button
                className={`btn ${profile?.published ? "btn-line" : ""}`}
                disabled={busy}
                onClick={() => togglePublish(!profile?.published)}
                title={profile?.published ? "Unpublish" : "Request publish"}
              >
                {profile?.published ? "Unpublish" : "Publish"}
              </button>
            </div>
          </div>
        </header>

        {/* Hero banner preview */}
        <section className="bpe-hero">
          <div className="bpe-hero-inner">
            <div className="bpe-hero-media">
              <div className="bpe-banner-prev">
                <img src={bannerUrl} alt="Banner" />
              </div>
              <div className="bpe-logo-prev">
                <img src={logoUrl} alt="Logo" />
              </div>
            </div>
            <div className="bpe-hero-meta">
              <div className="bpe-hero-name">{name || "Your company name"}</div>
              <div className="bpe-hero-tag">{tagline || "placeholder"}</div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <main className="bpe-main container">
          {/* Identity */}
          <section className="bpe-card">
            <div className="bpe-card-title">Identity</div>
            <div className="bpe-grid">
              <Field label="Name">
                <TextInput
                  value={name}
                  onChange={setName}
                  placeholder="Company / Brand name"
                />
              </Field>
              <Field label="Team size">
                <Select
                  value={size}
                  onChange={setSize}
                  options={["1-10", "11-50", "51-200", "201-500", "500+"]}
                />
              </Field>
              <Field label="Tagline">
                <TextInput
                  value={tagline}
                  onChange={setTagline}
                  placeholder="Short one-liner"
                />
              </Field>
              <Field label="About">
                <TextArea
                  rows={6}
                  value={about}
                  onChange={setAbout}
                  placeholder="Tell visitors what you do, who you help, and why you're different."
                />
              </Field>
              <Field label="Sector">
                <select
                  className="bpe-select"
                  disabled={taxFetching}
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value);
                    setSubsectors([]);
                  }}
                >
                  <option value="">
                    {taxFetching ? "Loading…" : "Select a sector"}
                  </option>
                  {sectorOptions.map((sec) => (
                    <option key={sec} value={sec}>
                      {titleize(sec)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subsectors">
                <MultiSelect
                  values={subsectors}
                  onChange={setSubsectors}
                  options={subsectorOptions}
                />
              </Field>
              <Field label="Countries">
                <MultiSelect
                  values={countries}
                  onChange={setCountries}
                  options={countryOptions}
                />
              </Field>
              <Field label="Languages">
                <MultiSelect
                  values={languages}
                  onChange={setLanguages}
                  options={languageOptions}
                />
              </Field>
              <Field label="Offering (what you sell/do)">
                <ArrayInput values={offering} onChange={setOffering} />
              </Field>
              <Field label="Seeking (what you want)">
                <ArrayInput values={seeking} onChange={setSeeking} />
              </Field>
              <Field label="Innovation / Keywords">
                <ArrayInput values={innovation} onChange={setInnovation} />
              </Field>
            </div>
            <div className="bpe-card-actions">
              <button className="btn" onClick={saveBasics} disabled={busy}>
                Save identity
              </button>
            </div>
          </section>

          {/* Media */}
          <section className="bpe-card">
            <div className="bpe-card-title">Media</div>
            <div className="bpe-media-grid">
              <div>
                <div className="bpe-media-label">Logo</div>
                {logoUrl ? (
                  <div className="bpe-media-prev">
                    <img src={logoUrl} alt="Logo" />
                  </div>
                ) : (
                  <div className="bpe-media-empty">No logo</div>
                )}
                <FileDrop label="Upload logo" onPick={onLogo} />
              </div>
              <div>
                <div className="bpe-media-label">Banner</div>
                {bannerUrl ? (
                  <div className="bpe-media-prev -wide">
                    <img src={bannerUrl} alt="Banner" />
                  </div>
                ) : (
                  <div className="bpe-media-empty">No banner</div>
                )}
                <FileDrop label="Upload banner" onPick={onBanner} />
              </div>
            </div>

            <div className="bpe-media-label" style={{ marginTop: 10 }}>
              Gallery
            </div>
            {gallery?.length ? (
              <div className="bpe-gallery">
                {gallery.map((g, i) => (
                  <figure key={`${String(g)}-${i}`} className="bpe-gimg">
                    <img src={imageLink(g)} alt={`Gallery ${i + 1}`} />
                    <figcaption>
                      <button
                        type="button"
                        className="btn btn-line"
                        onClick={() => onRemoveGalleryImage(g)}
                      >
                        Remove
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="bpe-media-empty">No gallery images</div>
            )}
            <div className="bpe-gallery-actions">
              <label className="btn">
                Add images
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) onAddGallery(files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </section>

          {/* Contacts & Socials */}
          <section className="bpe-card">
            <div className="bpe-card-title">Contacts & Socials</div>
            <div className="bpe-two">
              <div>
                <div className="bpe-subtitle">Contacts</div>
                {contacts.length === 0 && (
                  <div className="bpe-muted">No contacts yet.</div>
                )}
                {contacts.map((c, idx) => (
                  <div key={idx} className="bpe-row">
                    <select
                      className="bpe-select"
                      value={c.kind || "email"}
                      onChange={(e) =>
                        updateContact(idx, { kind: e.target.value })
                      }
                    >
                      <option value="email">email</option>
                      <option value="phone">phone</option>
                      <option value="whatsapp">whatsapp</option>
                    </select>
                    <input
                      className="bpe-input"
                      placeholder="value"
                      value={c.value || ""}
                      onChange={(e) =>
                        updateContact(idx, { value: e.target.value })
                      }
                    />
                    <input
                      className="bpe-input"
                      placeholder="label (e.g., Sales)"
                      value={c.label || ""}
                      onChange={(e) =>
                        updateContact(idx, { label: e.target.value })
                      }
                    />
                    <button
                      className="btn btn-line"
                      onClick={() => removeContact(idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button className="btn" onClick={addContact}>
                  + Add contact
                </button>
              </div>

              <div>
                <div className="bpe-subtitle">Socials</div>
                {socials.length === 0 && (
                  <div className="bpe-muted">No socials yet.</div>
                )}
                {socials.map((s, idx) => (
                  <div key={idx} className="bpe-row">
                    <select
                      className="bpe-select"
                      value={s.kind || "website"}
                      onChange={(e) =>
                        updateSocial(idx, { kind: e.target.value })
                      }
                    >
                      <option value="website">website</option>
                      <option value="linkedin">linkedin</option>
                      <option value="x">x</option>
                      <option value="facebook">facebook</option>
                      <option value="instagram">instagram</option>
                      <option value="youtube">youtube</option>
                    </select>
                    <input
                      className="bpe-input"
                      placeholder="https://..."
                      value={s.url || ""}
                      onChange={(e) =>
                        updateSocial(idx, { url: e.target.value })
                      }
                    />
                    <button
                      className="btn btn-line"
                      onClick={() => removeSocial(idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button className="btn" onClick={addSocial}>
                  + Add social
                </button>
              </div>
            </div>

            <div className="bpe-card-actions">
              <button
                className="btn"
                onClick={saveContacts}
                disabled={savingContacts}
              >
                Save Contacts/Socials
              </button>
            </div>
          </section>
          <section className="bpe-card">
            <div className="bpe-card-title">Team</div>

            {/* Current team list */}
            {team.length === 0 ? (
  <div className="bpe-muted">No team members yet.</div>
) : (
  <div className="bpe-list">
    {team.map((m) => {
      const name =
        m?.name ||
        m?.displayName ||
        [m?.firstName, m?.lastName].filter(Boolean).join(" ") ||
        "—";

      const avatar =
        imageLink(m?.avatarUpload) ||
        imageLink(m?.photoUpload) ||
        imageLink(m?.logoUpload) ||
        imageLink((Array.isArray(m?.images) && m.images[0]) || "") ||
        initialsAvatar(name);

      const meta = [m?.entityType, m?.title || m?.position || m?.jobTitle, m?.role]
        .filter(Boolean)
        .join(" • ");

      return (
        <article key={`${m.entityType}-${m.entityId}`} className="bpe-item">
          <div className="bpe-gimg -round">
            <img src={avatar} alt={name} />
          </div>
          <div className="bpe-item-main">
            <div className="bpe-item-title">{name}</div>
            {meta ? <div className="bpe-item-tax">{meta}</div> : null}
          </div>
          <div className="bpe-item-actions">
            <button
              className="btn btn-line"
              disabled={removingMember}
              onClick={() => onRemovePerson(m)}
            >
              Remove
            </button>
          </div>
        </article>
      );
    })}
  </div>
)}

            <div className="bpe-card-actions">
              <button className="btn" onClick={() => setTeamModalOpen(true)}>
                + Add team member
              </button>
            </div>

            {/* Modal */}
            {teamModalOpen && (
              <TeamSelectModal
                query={query}
                setQuery={setQuery}
                draftRole={draftRole}
                setDraftRole={setDraftRole}
                results={searchResults}
                searching={searching}
                onPick={async (p) => {
                  await onPickPerson(p);
                }}
                onClose={() => {
                  setTeamModalOpen(false);
                  setQuery("");
                  setDraftRole("");
                }}
              />
            )}
          </section>
          {/* Items */}
          <section className="bpe-card">
            <div className="bpe-card-title">Items (Products / Services)</div>

            <div className="bpe-two">
              <div>
                <button
                  className="btn"
                  onClick={() =>
                    setEditingItem({
                      title: "",
                      descr: "",
                      price: "",
                      tags: [],
                      images: [],
                      sector: "",
                      subsectorId: "",
                      kind: "product",
                    })
                  }
                >
                  + New Item
                </button>

                <div className="bpe-list">
                  {(items || []).map((it) => {
                    // Prefer explicit thumbnailUpload; else first image if present
                    const thumbSrc =
                      (it.thumbnailUpload
                        ? imageLink(it.thumbnailUpload)
                        : "") ||
                      (Array.isArray(it.images) && it.images.length
                        ? imageLink(it.images[0])
                        : "");
                    return (
                      <article key={it._id} className="bpe-item">
                        {thumbSrc ? (
                          <div className="bpe-gimg">
                            <img src={thumbSrc} alt="" />
                          </div>
                        ) : (
                          <div className="bpe-item-thumb -empty" />
                        )}

                        <div className="bpe-item-main">
                          <div className="bpe-item-title">
                            {it.title || "Untitled"}
                          </div>

                          {it.sector || it.subsectorName ? (
                            <div className="bpe-item-tax">
                              {it.sector || ""}
                              {it.sector && it.subsectorName ? " • " : ""}
                              {it.subsectorName || ""}
                            </div>
                          ) : null}

                          {it.pricingNote ? (
                            <div className="bpe-item-price">
                              {it.pricingNote}
                            </div>
                          ) : null}
                        </div>

                        <div className="bpe-item-actions">
                          <button
                            className="btn btn-line"
                            onClick={() => {
                              // map backend fields to editor fields
                              const descr = it.details || it.summary || "";
                              const price = it.pricingNote || "";
                              const tags = Array.isArray(it.tags)
                                ? it.tags
                                : [];

                              // try to restore subsectorId from subsectorName if missing
                              let nextSubId = it.subsectorId || "";
                              if (!nextSubId && it.sector && it.subsectorName) {
                                const row = sectorByKey.get(
                                  String(it.sector).toLowerCase()
                                );
                                const found = row?.subsectors?.find(
                                  (s) =>
                                    String(s.name).toLowerCase() ===
                                    String(it.subsectorName).toLowerCase()
                                );
                                if (found?._id) nextSubId = String(found._id);
                              }

                              setEditingItem({
                                ...it,
                                sector: String(it.sector || "").toLowerCase(),
                                subsectorId: nextSubId,
                                descr,
                                price,
                                tags,
                              });
                            }}
                          >
                            Edit
                          </button>{" "}
                          <button
                            className="btn btn-line"
                            onClick={() => onDeleteItem(it._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div>
                {!editingItem ? (
                  <div className="bpe-muted">
                    Select or create an item to edit.
                  </div>
                ) : (
                  <div className="bpe-item-editor">
                    {itemErr ? (
                      <div className="bpe-alert">{itemErr}</div>
                    ) : null}

                    <Field label="Title">
                      <TextInput
                        value={editingItem.title || ""}
                        onChange={(v) =>
                          setEditingItem((s) => ({ ...s, title: v }))
                        }
                      />
                    </Field>

                    <Field label="Sector">
                      <select
                        className="bpe-select"
                        value={editingItem.sector || ""}
                        onChange={(e) =>
                          setEditingItem((s) => ({
                            ...s,
                            sector: e.target.value,
                            subsectorId: "",
                          }))
                        }
                      >
                        <option value="">Select a sector</option>
                        {itemSectorOptions.map((sec) => (
                          <option key={sec} value={sec}>
                            {titleize(sec)}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Subsector">
                      <select
                        className="bpe-select"
                        value={editingItem.subsectorId || ""}
                        onChange={(e) =>
                          setEditingItem((s) => ({
                            ...s,
                            subsectorId: e.target.value,
                          }))
                        }
                        disabled={!editingItem.sector}
                      >
                        <option value="">
                          {editingItem.sector
                            ? "Select a subsector"
                            : "Pick a sector first"}
                        </option>
                        {itemSubsectorOptions.map((ss) => (
                          <option key={ss._id} value={ss._id}>
                            {ss.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Kind">
                      <Select
                        value={editingItem.kind || "product"}
                        onChange={(v) =>
                          setEditingItem((s) => ({ ...s, kind: v }))
                        }
                        options={["product", "service"]}
                        placeholder="Select kind"
                      />
                    </Field>

                    <Field label="Description">
                      <TextArea
                        rows={6}
                        value={editingItem.descr || ""}
                        onChange={(v) =>
                          setEditingItem((s) => ({ ...s, descr: v }))
                        }
                      />
                    </Field>

                    <Field label="Price">
                      <TextInput
                        value={editingItem.price || ""}
                        onChange={(v) =>
                          setEditingItem((s) => ({ ...s, price: v }))
                        }
                        placeholder="e.g., $499"
                      />
                    </Field>

                    <Field label="Tags">
                      <ArrayInput
                        values={
                          Array.isArray(editingItem.tags)
                            ? editingItem.tags
                            : []
                        }
                        onChange={(v) =>
                          setEditingItem((s) => ({ ...s, tags: v }))
                        }
                      />
                    </Field>

                    {/* Item images */}
                    <div className="bpe-subtitle">Images</div>
                    <div className="bpe-gallery">
                      {(editingItem.images || []).map((img, idx) => {
                        const src = imageLink(img?.url || img);
                        const idOrUpload =
                          img?.imageId || img?.uploadId || img?.id || img;
                        return (
                          <figure
                            key={`${String(idOrUpload)}-${idx}`}
                            className="bpe-gimg"
                          >
                            <img src={src} alt="Item" />
                            <figcaption>
                              <button
                                type="button"
                                className="btn btn-line"
                                onClick={() => onRemoveItemImage(idOrUpload)}
                              >
                                Remove
                              </button>
                              <button
                                type="button"
                                className="btn btn-line"
                                onClick={() => onSetItemThumb(idOrUpload)}
                              >
                                Set thumbnail
                              </button>
                            </figcaption>
                          </figure>
                        );
                      })}
                    </div>

                    {editingItem._id ? (
                      <label
                        className={`btn btn-line ${
                          editingItem._id ? "" : "is-disabled"
                        }`}
                        title={
                          editingItem._id ? "Upload images" : "Save item first"
                        }
                      >
                        {" "}
                        Add images
                        <input
                          hidden
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length) return;
                            if (!editingItem._id) {
                              alert("Save the item first, then add images.");
                              e.target.value = "";
                              return;
                            }
                            await onAddItemImages(files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : (
                      <div className="bpe-hint">
                        Save the item first to upload images.
                      </div>
                    )}

                    <div className="bpe-actions">
                      <button className="btn" onClick={onSaveItem}>
                        Save item
                      </button>
                      <button
                        className="btn btn-line"
                        onClick={() => setEditingItem(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
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
