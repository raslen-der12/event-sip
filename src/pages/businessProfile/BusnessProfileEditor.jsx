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
const CURRENCIES = ['TND','USD','EUR','GBP','AED','SAR','INR','CNY','JPY'];
const UNITS = [
  { value:'', label:'(no unit)' },
  { value:'per piece', label:'per piece' },
  { value:'per package', label:'per package' },
  { value:'per kg', label:'per kg' },
  { value:'per liter', label:'per liter' },
  { value:'per hour', label:'per hour' },
  { value:'per day', label:'per day' },
  { value:'per month', label:'per month' },
  { value:'per km', label:'per km' },
];
const MAX_IMG_BYTES = 3 * 1024 * 1024; // 3 MB
const tooBig = (f) => !!f && typeof f.size === 'number' && f.size > MAX_IMG_BYTES;
const MB = (n) => (n / (1024 * 1024)).toFixed(1);
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
  sub = "PNG/JPG under 3MB",
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
                  <button className="btn " onClick={async () => onPick(r)}>
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
   () => taxonomy.map((t) => ({ value: toKey(t.sector), label: t.sector })),
   [taxonomy]
 );
  const sectorByKey = useMemo(() => {
   const m = new Map();
   taxonomy.forEach((t) => m.set(toKey(t.sector), t));
   return m;
 }, [taxonomy])

  const [sector, setSector] = useState(""); // lowercased key
  const [subsectors, setSubsectors] = useState([]); // display names for Identity only
  const subsectorOptions = useMemo(() => {
   const row = sectorByKey.get(sector);
   return row ? row.subsectors.map((s) => s.name) : [];
 }, [sector, sectorByKey]);


  const [countries, setCountries] = useState([]);
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

    const indKeys = (Array.isArray(profile.industries) ? profile.industries : []).map(toKey);

// Pick sector key that actually exists in taxonomy
const secKey = indKeys.find((k) => sectorByKey.has(k)) || "";
setSector(secKey);

// Keep subsectors as keys too (Identity only shows titleized labels)
const ssKeys = (() => {
  const row = sectorByKey.get(secKey);
  if (!row) return [];
  const allowed = new Set(row.subsectors.map((s) => toKey(s.name)));
  return indKeys.filter((k) => k !== secKey && allowed.has(k));
})();
setSubsectors(ssKeys);
setCountries(Array.isArray(profile.countries) ? profile.countries.map(toKey) : []);    setLanguages(Array.isArray(profile.languages) ? profile.languages : []);
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
    if (tooBig(file)) {
      alert(`Logo is too large (${MB(file.size)} MB). Max allowed is 3 MB.`);
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    const up = await uploadFile(fd).unwrap();
    const path = up?.path || up?.url || up?.data?.path;
    if (!path) throw new Error("Upload failed");
    await setLogo({ path }).unwrap();
    await refetchBP();
  }

  async function onBanner(file) {
    if (tooBig(file)) {
      alert(`Banner is too large (${MB(file.size)} MB). Max allowed is 3 MB.`);
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    const up = await uploadFile(fd).unwrap();
    const path = up?.path || up?.url || up?.data?.path;
    if (!path) throw new Error("Upload failed");
    await setBanner({ path }).unwrap();
    await refetchBP();
  }

  async function onAddGallery(files) {
    const overs = (files || []).filter(tooBig);
    if (overs.length) {
      alert(`${overs.length} image(s) exceed 3 MB and were skipped.`);
    }
    const ok = (files || []).filter((f) => !tooBig(f));
    if (!ok.length) return;
    const { uploadIds, uploadPaths } = await uploadFilesCollectIdsAndPaths(uploadFile, ok);
    if (uploadIds.length || uploadPaths.length) {
      await addToGallery({ uploadIds, uploadPaths }).unwrap();
      await refetchBP();
    }
  }

async function onRemoveGalleryImage(image) {
  try {
    // Extract uploadPath safely
    const uploadPath = 
      typeof image === "string" ? image :  // if it's already a path string
      image?.path || 
      image?.url || 
      image?.uploadPath || 
      image?.imagePath || 
      image?.filePath;

    if (!uploadPath || typeof uploadPath !== "string") {
      console.warn("No valid uploadPath found:", image);
      alert("Cannot remove: missing image path.");
      return;
    }

    // Send uploadPath, NOT imageId
    await removeFromGallery({ uploadPath }).unwrap();

    // Refetch to update UI
    await refetchBP();
  } catch (err) {
    console.error("Failed to remove gallery image:", err);
    alert(err?.data?.message || "Error removing image. Please try again.");
  }
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
    const isect = (editingItem?.sector || "").trim()
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
      priceValue: Number(editingItem?.priceValue) || 0,
      priceCurrency: (editingItem?.priceCurrency || "").toUpperCase(),
      priceUnit: (editingItem?.priceUnit || "").toLowerCase(),
    };
    // NEW: respect the API slice shapes
    if (editingItem?._id) {
      await updateItem({ itemId: editingItem._id, ...payload }).unwrap();
      await refetchItems();
      setEditingItem(null);
    } else {
      const created = await createItem(payload).unwrap();
      

      await refetchItems();

      setEditingItem(null);
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

    const overs = (files || []).filter(tooBig);
    if (overs.length) {
      setItemErr(`${overs.length} image(s) exceed 3 MB and were skipped.`);
    }
    const ok = (files || []).filter((f) => !tooBig(f));
    if (!ok.length) return;
    const { uploadIds, uploadPaths } = await uploadFilesCollectIdsAndPaths(uploadFile, ok);
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
      {/* Topbar */}
      <header className="bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Left section — Logo & Info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              {profile?.logo && (
                <img
                  src={profile.logo}
                  alt="Company Logo"
                  className="h-12 w-12 rounded-lg object-contain border border-slate-100"
                />
              )}

              <div>
                <h1 className="text-lg font-semibold text-slate-800">Business Profile</h1>
                <p className="text-sm text-slate-500">Edit your public profile</p>
              </div>
            </div>

            {/* Right section — Actions */}
            <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">

              {profile?.published ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  Published
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                  Draft
                </span>
              )}

              {profile?._id && (
                <a
                  href="/BusinessProfile"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                >
                  👁️ View
                </a>
              )}

              {profile?._id && (
                <button
                  type="button"
                  onClick={copyShareUrl}
                  className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition ${
                    copied
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  🔗 {copied ? "Copied!" : "Share"}
                </button>
              )}

              <button
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: "#3379BD" }}
                onClick={saveBasics}
                disabled={busy}
              >
                Save
              </button>

              <button
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border transition ${
                  profile?.published
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
                onClick={() => togglePublish(!profile?.published)}
                disabled={busy}
              >
                {profile?.published ? "Unpublish" : "Publish"}
              </button>

              {busy && <span className="text-xs text-slate-500 ml-2">Saving…</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero banner preview */}




        {/* Main grid */}
        <main className="bpe-main container">
          {/* Identity */}
        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="md:flex md:items-center">

                {/* Banner */}
                <div className="relative md:w-1/3 w-full h-48 md:h-56 bg-slate-100">
                  {bannerUrl ? (
                    <div
                      className="absolute inset-0 bg-center bg-cover"
                      style={{ backgroundImage: `url(${bannerUrl})` }}
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      No banner
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 md:pl-10 px-4 py-8">
                  {/* Logo + Name + Tagline + Description */}
                  <div className="flex items-start gap-4 flex-wrap">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="h-40 w-40 rounded-md object-contain border border-slate-100 bg-white p-1"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-slate-100 flex items-center justify-center text-xs text-slate-400 bg-white">
                        No logo
                      </div>
                    )}

                    <div className="flex-1 min-w-[200px]">
                      <h2 className="text-2xl font-semibold text-slate-800">
                        {name || "Your company name"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {tagline || "Your company tagline or short description"}
                      </p>
                      {about && (
                        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                          {about.length > 400 ? about.slice(0, 400) + "..." : about}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: "#F97316" }}
                      href={profile?._id ? `/BusinessProfile/${profile._id}` : "#"}
                    >
                      View public page
                    </a>

                    <button
                      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                      onClick={copyShareUrl}
                      disabled={!profile?._id}
                    >
                      Copy share link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Identity editor*/}
        <section className="bg-white rounded-2xl shadow-md p-6 mb-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
  <div className="flex items-start gap-3">
    {/* Subtle Icon */}
    <div className="flex-shrink-0 mt-0.5">
      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>

    <div className="flex-1">
      <h3 className="text-base font-medium text-orange-900">Complete Your Identity</h3>
      <p className="text-sm text-orange-700 mt-1">
        Fill out your company details — visible on your public profile.
      </p>
      <p className="text-xs text-orange-600 mt-2 italic">
        Don’t forget to save your business identity.
      </p>
    </div>
  </div>

  {/* Clean Save Button */}
  <button
    className={`w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-medium transition-all ${
      busy
        ? "bg-orange-100 text-orange-400 cursor-not-allowed"
        : "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow"
    }`}
    onClick={saveBasics}
    disabled={busy}
  >
    {busy ? "Saving..." : "Save Identity"}
  </button>
</div>

              </div>
            </div>

            {/* === BASIC INFO === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                {TextInput ? (
                  <TextInput value={name} onChange={setName} placeholder="Company / Brand name" />
                ) : (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-100"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Company / Brand name"
                  />
                )}
              </div>

              {/* Team size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Team size</label>
                {Select ? (
                  <Select
                    value={size}
                    onChange={setSize}
                    options={["1-10", "11-50", "51-200", "201-500", "500+"]}
                  />
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-100"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                )}
              </div>

              {/* Tagline */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                {TextInput ? (
                  <TextInput value={tagline} onChange={setTagline} placeholder="Short one-liner" />
                ) : (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-100"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Short one-liner"
                  />
                )}
              </div>

              {/* About */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">About</label>
                {TextArea ? (
                  <TextArea
                    rows={6}
                    value={about}
                    onChange={setAbout}
                    placeholder="Tell visitors what you do, who you help, and why you're different."
                  />
                ) : (
                  <textarea
                    rows={6}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-100"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Tell visitors what you do, who you help, and why you're different."
                  />
                )}
              </div>
            </div>

            {/* === SECTOR & SUBSECTOR === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sector</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-100"
                  disabled={taxFetching}
                  value={sector}
                  onChange={(e) => {
                    setSector(e.target.value);
                    setSubsectors([]);
                  }}
                >
                  <option value="">{taxFetching ? "Loading…" : "Select a sector"}</option>
                  {sectorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {typeof titleize === "function" ? titleize(opt.label) : opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subsectors */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subsectors</label>
                {MultiSelect ? (
                  <MultiSelect values={subsectors} onChange={setSubsectors} options={subsectorOptions} />
                ) : (
                  <select
                    multiple
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-100"
                    value={subsectors || []}
                    onChange={(e) =>
                      setSubsectors(Array.from(e.target.selectedOptions).map((o) => o.value))
                    }
                  >
                    {subsectorOptions.map((opt) => (
                      <option key={opt._id || opt.value} value={opt._id || opt.value}>
                        {opt.name || opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {subsectors?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subsectors.map((s) => {
                      const found = subsectorOptions.find((o) => (o._id || o.value) === s);
                      return (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-medium"
                        >
                          {found ? found.name || found.label : s}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* === COUNTRIES & LANGUAGES === */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Countries */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Countries</label>
                <div className="w-full rounded-lg border border-slate-200 px-3 py-3 bg-slate-50 min-h-[48px] flex flex-wrap gap-2">
                  {countries && countries.length > 0 ? (
                    [...countries]
                      .sort((a, b) => a.localeCompare(b))
                      .map((c) => {
                        const country = countryOptions.find((opt) => opt.value === c);
                        const name =
                          country && country.label
                            ? country.label.charAt(0).toUpperCase() + country.label.slice(1)
                            : c.charAt(0).toUpperCase() + c.slice(1);
                        return (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium border border-indigo-200"
                          >
                            🌍 {name}
                          </span>
                        );
                      })
                  ) : (
                    <span className="text-slate-400 text-sm">No countries selected</span>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Languages</label>
                {MultiSelect ? (
                  <MultiSelect values={languages} onChange={setLanguages} options={languageOptions} />
                ) : (
                  <select
                    multiple
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-100"
                    value={languages || []}
                    onChange={(e) => setLanguages(Array.from(e.target.selectedOptions).map((o) => o.value))}
                  >
                    {languageOptions.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Emoji display of selected languages */}
                {languages?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {languages.map((lang) => {
                      const option = languageOptions.find((l) => l.value === lang);
                      const emoji =
                        option?.emoji ||
                        (lang === "en"
                          ? "🇬🇧"
                          : lang === "fr"
                          ? "🇫🇷"
                          : lang === "es"
                          ? "🇪🇸"
                          : lang === "ar"
                          ? "🇸🇦"
                          : "🗣️");
                      return (
                        <span
                          key={lang}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-200"
                        >
                          {emoji} {option?.label || lang.toUpperCase()}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* === OFFERING / SEEKING / INNOVATION === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Offering */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Offering</label>
                {ArrayInput ? (
                  <ArrayInput values={offering} onChange={setOffering} />
                ) : (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-100"
                    value={(offering || []).join(", ")}
                    onChange={(e) =>
                      setOffering(
                        String(e.target.value)
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="comma separated offerings"
                  />
                )}
              </div>

              {/* Seeking */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Seeking</label>
                {ArrayInput ? (
                  <ArrayInput values={seeking} onChange={setSeeking} />
                ) : (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-100"
                    value={(seeking || []).join(", ")}
                    onChange={(e) =>
                      setSeeking(
                        String(e.target.value)
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="comma separated seeking"
                  />
                )}
              </div>

              {/* Innovation */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Innovation / Keywords</label>
                {ArrayInput ? (
                  <ArrayInput values={innovation} onChange={setInnovation} />
                ) : (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder-slate-400 focus:ring-2 focus:ring-indigo-100"
                    value={(innovation || []).join(", ")}
                    onChange={(e) =>
                      setInnovation(
                        String(e.target.value)
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="comma separated keywords"
                  />
                )}
              </div>
            </div>

            {/* Save button */}
            <div className="mt-6 flex justify-end">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  busy
                    ? "bg-orange-100 text-orange-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow"
                }`}
                onClick={saveBasics}
                disabled={busy}
              >
                Save identity
              </button>
            </div>
          </section>

          {/* Media */}
          <section className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Media</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Logo */}
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Logo</div>

                {logoUrl ? (
                  <div className="w-full max-w-xs h-28 rounded-md overflow-hidden bg-slate-50 border border-slate-100 mb-3">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                  </div>
                ) : (
                  <div className="w-full max-w-xs h-28 rounded-md flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 mb-3 text-sm text-slate-500">
                    No logo
                  </div>
                )}

                {/* FileDrop component (kept as-is) */}
                {typeof FileDrop !== "undefined" ? (
                  <div className="max-w-xs">
                    <FileDrop label="Upload logo" onPick={onLogo} />
                  </div>
                ) : (
                  <label className="inline-block px-3 py-2 border rounded-md cursor-pointer text-sm bg-white">
                    Upload logo
                    <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onLogo(f); e.target.value = ""; }} />
                  </label>
                )}
              </div>

              {/* Banner */}
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Banner</div>

                {bannerUrl ? (
                  <div className="w-full h-28 rounded-md overflow-hidden bg-slate-50 border border-slate-100 mb-3">
                    <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-md flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 mb-3 text-sm text-slate-500">
                    No banner
                  </div>
                )}

                {typeof FileDrop !== "undefined" ? (
                  <div>
                    <FileDrop label="Upload banner" onPick={onBanner} />
                  </div>
                ) : (
                  <label className="inline-block px-3 py-2 border rounded-md cursor-pointer text-sm bg-white">
                    Upload banner
                    <input hidden type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onBanner(f); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery heading 
            <div className="text-sm font-medium text-slate-700 mt-5 mb-3">Gallery</div>

            {gallery?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gallery.map((g, i) => (
                  <figure key={`${String(g)}-${i}`} className="relative rounded-md overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={imageLink(g)} alt={`Gallery ${i + 1}`} className="w-full h-28 object-cover" />
                    <figcaption className="absolute left-2 right-2 bottom-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 bg-white/90 border rounded-md hover:bg-white"
                      onClick={() => onRemoveGalleryImage(g)}
                    >
                      Remove
                    </button>

                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No gallery images</div>
            )}

            <div className="mt-4">
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm cursor-pointer hover:bg-indigo-700">
                <span className="text-lg leading-none">+</span>
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
            */}
          </section>


          {/* Contacts & Socials */}

          {/* Contacts & Socials */}
<section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
  <h3 className="text-lg font-semibold text-slate-800 mb-5">Contacts & Socials</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Contacts */}
    <div>
      {contacts.length === 0 && (
        <div className="text-sm text-slate-500 mb-3">No contacts yet.</div>
      )}

      <div className="space-y-3 mb-3 max-h-[48vh] overflow-y-auto pr-2">
        {contacts.map((c, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-lg border border-slate-100"
          >
            <select
              className="w-full sm:w-32 rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
              value={c.kind || "email"}
              onChange={(e) => updateContact(idx, { kind: e.target.value })}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </select>

            <input
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Contact (e.g., info@yourcompany.com)"
              value={c.value || ""}
              onChange={(e) => updateContact(idx, { value: e.target.value })}
            />

            <button
              type="button"
              className="mt-2 sm:mt-0 inline-flex items-center px-2 py-2 border rounded-md text-sm bg-white hover:bg-slate-50"
              onClick={() => removeContact(idx)}
              title="Remove"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-2 bg-[#3379BD] text-white rounded-md text-sm hover:bg-[#2a6da9]"
        onClick={addContact}
      >
        <span className="text-lg leading-none">+</span> Add contact
      </button>
    </div>

    {/* Socials */}
    <div>
      {socials.length === 0 && (
        <div className="text-sm text-slate-500 mb-3">No socials yet.</div>
      )}

      <div className="space-y-3 mb-3 max-h-[48vh] overflow-y-auto pr-2">
        {socials.map((s, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-lg border border-slate-100"
          >
            <div className="relative flex items-center w-full sm:w-32">
              {s.kind === "linkedin" && <i className="fa-brands fa-linkedin text-[#0A66C2] mr-2"></i>}
              {s.kind === "facebook" && <i className="fa-brands fa-facebook text-[#1877F2] mr-2"></i>}
              {s.kind === "instagram" && <i className="fa-brands fa-instagram text-[#E4405F] mr-2"></i>}
              {s.kind === "x" && <i className="fa-brands fa-x-twitter text-black mr-2"></i>}
              {s.kind === "youtube" && <i className="fa-brands fa-youtube text-[#FF0000] mr-2"></i>}
              {s.kind === "website" && <i className="fa-solid fa-globe text-slate-600 mr-2"></i>}

              <select
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                value={s.kind || "website"}
                onChange={(e) => updateSocial(idx, { kind: e.target.value })}
              >
                <option value="website">Website</option>
                <option value="linkedin">LinkedIn</option>
                <option value="x">X</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>

            <input
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="https://..."
              value={s.url || ""}
              onChange={(e) => updateSocial(idx, { url: e.target.value })}
            />

            <button
              type="button"
              className="mt-2 sm:mt-0 inline-flex items-center px-2 py-2 border rounded-md text-sm bg-white hover:bg-slate-50"
              onClick={() => removeSocial(idx)}
              title="Remove"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-2 bg-[#3379BD] text-white rounded-md text-sm hover:bg-[#2a6da9]"
        onClick={addSocial}
      >
        <span className="text-lg leading-none">+</span> Add social
      </button>
    </div>
  </div>

  <div className="mt-4 flex justify-end">
    <button
      className={`px-4 py-2 rounded-md ${
        savingContacts
          ? "bg-orange-100 text-orange-400 cursor-not-allowed"
          : "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow"
      }`}
      onClick={saveContacts}
      disabled={savingContacts}
    >
      Save Contacts/Socials
    </button>
  </div>
</section>

          <section className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Team</h3>
            </div>

            {/* Current team list */}
            {team.length === 0 ? (
              <div className="text-sm text-slate-500">No team members yet.</div>
            ) : (
              <div className="overflow-y-auto max-h-[56vh] md:max-h-[66vh] space-y-3 pr-2">
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
                    <article
                      key={`${m.entityType}-${m.entityId}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:shadow-sm"
                    >
                      <div className="w-12 h-12 flex-none rounded-full overflow-hidden bg-slate-50">
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-slate-800 truncate">{name}</div>
                        </div>

                        {meta ? <div className="text-xs text-slate-500 mt-1 truncate">{meta}</div> : null}
                      </div>

                      <div className="flex-none">
                        <button
                          className="px-3 py-1.5 bg-white border border-rose-200 rounded-md text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-60"
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

            <div className="mt-4">
              <button
                className="inline-flex bg-[#F97316] text-white hover:bg-[#2a6da9] items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onClick={() => setTeamModalOpen(true)}
              >
                <span className="text-xl leading-none">+</span> Add team member
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
          <section className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-slate-800">Items (Products / Services)</div>
              <button
                className="inline-flex bg-[#F97316] text-white hover:bg-[#2a6da9] items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onClick={() =>
                  setEditingItem({
                    title: "",
                    descr: "",
                    price: "",
                    priceValue: 0,
                    priceCurrency: "TND",
                    priceUnit: "",
                    tags: [],
                    images: [],
                    sector: "",
                    subsectorId: "",
                    kind: "product",
                  })
                }
              >
                <span className="text-xl leading-none ">+</span> New Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: items list */}
              <div>
                <div className="overflow-y-auto max-h-[56vh] md:max-h-[66vh] pr-2 space-y-3">
                  {(items || []).length === 0 && (
                    <div className="text-sm text-slate-500">No items yet. Create one with "New Item".</div>
                  )}

                  {(items || []).map((it) => {
                    const thumbSrc =
                      (it.thumbnailUpload ? imageLink(it.thumbnailUpload) : "") ||
                      (Array.isArray(it.images) && it.images.length ? imageLink(it.images[0]) : "");
                    const priceValue = typeof it.priceValue === "number" ? it.priceValue : 0;

                    return (
                      <article
                        key={it._id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:shadow-sm"
                      >
                        {thumbSrc ? (
                          <div className="w-16 h-16 flex-none rounded-md overflow-hidden bg-slate-50">
                            <img src={thumbSrc} alt={it.title || "item"} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 flex-none rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M3 7h18M3 12h18M3 17h18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-slate-800 truncate">{it.title || "Untitled"}</div>
                            <div className="text-sm text-slate-500">{it.kind === "service" ? "Service" : "Product"}</div>
                          </div>

                          {(it.sector || it.subsectorName) && (
                            <div className="text-xs text-slate-500 mt-1">
                              {it.sector || ""}
                              {it.sector && it.subsectorName ? " • " : ""}
                              {it.subsectorName || ""}
                            </div>
                          )}

                          {it.pricingNote && <div className="mt-2 text-sm text-slate-600">{it.pricingNote}</div>}

                          {priceValue > 0 && (
                            <div className="mt-2 text-sm font-semibold text-slate-700">
                              {`${it.priceCurrency || ""} ${priceValue}${it.priceUnit ? " " + it.priceUnit : ""}`}
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <button
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm hover:bg-slate-50"
                              onClick={() => {
                                const descr = it.details || it.summary || "";
                                const price = it.pricingNote || "";
                                const priceValueLocal = typeof it.priceValue === "number" ? it.priceValue : 0;
                                const priceCurrency = it.priceCurrency || "TND";
                                const priceUnit = it.priceUnit || "";
                                const tags = Array.isArray(it.tags) ? it.tags : [];

                                let nextSubId = it.subsectorId || "";
                                if (!nextSubId && it.sector && it.subsectorName) {
                                  const row = sectorByKey.get(String(it.sector).toLowerCase());
                                  const found = row?.subsectors?.find(
                                    (s) => String(s.name).toLowerCase() === String(it.subsectorName).toLowerCase()
                                  );
                                  if (found?._id) nextSubId = String(found._id);
                                }

                                setEditingItem({
                                  ...it,
                                  sector: String(it.sector || "").toLowerCase(),
                                  subsectorId: nextSubId,
                                  descr,
                                  price,
                                  priceValue: priceValueLocal,
                                  priceCurrency,
                                  priceUnit,
                                  tags,
                                });
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="px-3 py-1.5 bg-white border border-rose-200 rounded-md text-sm text-rose-600 hover:bg-rose-50"
                              onClick={() => onDeleteItem(it._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* Right: editor */}
              <div>
                {!editingItem ? (
                  <div className="p-6 rounded-md bg-slate-50 text-slate-600">Select or create an item to edit.</div>
                ) : (
                  <div className="space-y-4">
                    {itemErr && <div className="p-2 rounded-md bg-rose-50 text-rose-700">{itemErr}</div>}

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      {TextInput ? (
                        <TextInput value={editingItem.title || ""} onChange={(v) => setEditingItem((s) => ({ ...s, title: v }))} />
                      ) : (
                        <input
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                          value={editingItem.title || ""}
                          onChange={(e) => setEditingItem((s) => ({ ...s, title: e.target.value }))}
                          placeholder="Item title"
                        />
                      )}
                    </div>

                    {/* Sector */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Sector</label>
                      <select
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
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
                        {itemSectorOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {titleize ? titleize(opt.label) : opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subsector */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Subsector</label>
                      <select
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                        value={editingItem.subsectorId || ""}
                        onChange={(e) =>
                          setEditingItem((s) => ({
                            ...s,
                            subsectorId: e.target.value,
                          }))
                        }
                        disabled={!editingItem.sector}
                      >
                        <option value="">{editingItem.sector ? "Select a subsector" : "Pick a sector first"}</option>
                        {itemSubsectorOptions.map((ss) => (
                          <option key={ss._id} value={ss._id}>
                            {ss.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kind */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Kind</label>
                      {Select ? (
                        <Select
                          value={editingItem.kind || "product"}
                          onChange={(v) => setEditingItem((s) => ({ ...s, kind: v }))}
                          options={["product", "service"]}
                          placeholder="Select kind"
                        />
                      ) : (
                        <div className="flex gap-3 items-center">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="kind"
                              value="product"
                              checked={(editingItem.kind || "product") === "product"}
                              onChange={() => setEditingItem((s) => ({ ...s, kind: "product" }))}
                            />
                            Product
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name="kind"
                              value="service"
                              checked={(editingItem.kind || "product") === "service"}
                              onChange={() => setEditingItem((s) => ({ ...s, kind: "service" }))}
                            />
                            Service
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      {TextArea ? (
                        <TextArea rows={6} value={editingItem.descr || ""} onChange={(v) => setEditingItem((s) => ({ ...s, descr: v }))} />
                      ) : (
                        <textarea
                          rows={5}
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                          value={editingItem.descr || ""}
                          onChange={(e) => setEditingItem((s) => ({ ...s, descr: e.target.value }))}
                        />
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      {TextInput ? (
                        <TextInput value={editingItem.price || ""} onChange={(v) => setEditingItem((s) => ({ ...s, price: v }))} placeholder="Optional note (e.g., negotiable)" />
                      ) : (
                        <input
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                          value={editingItem.price || ""}
                          onChange={(e) => setEditingItem((s) => ({ ...s, price: e.target.value }))}
                          placeholder="Optional note (e.g., negotiable)"
                        />
                      )}

                      <div className="mt-3 grid grid-cols-[140px_130px_1fr] gap-2">
                        <input
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingItem.priceValue ?? 0}
                          onChange={(e) => setEditingItem((s) => ({ ...s, priceValue: Number(e.target.value) }))}
                          placeholder="0"
                          title="0 = do not show price"
                        />
                        <select
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                          value={editingItem.priceCurrency || "TND"}
                          onChange={(e) => setEditingItem((s) => ({ ...s, priceCurrency: e.target.value }))}
                          disabled={!(editingItem.priceValue > 0)}
                          title="Currency"
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <select
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                          value={editingItem.priceUnit || ""}
                          onChange={(e) => setEditingItem((s) => ({ ...s, priceUnit: e.target.value }))}
                          disabled={!(editingItem.priceValue > 0)}
                          title="Unit"
                        >
                          {UNITS.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Set price to <b>0</b> to hide structured price.</div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      {ArrayInput ? (
                        <ArrayInput values={Array.isArray(editingItem.tags) ? editingItem.tags : []} onChange={(v) => setEditingItem((s) => ({ ...s, tags: v }))} />
                      ) : (
                        <input
                          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                          value={(editingItem.tags || []).join(", ")}
                          onChange={(e) => setEditingItem((s) => ({ ...s, tags: String(e.target.value).split(",").map((t) => t.trim()).filter(Boolean) }))}
                          placeholder="comma, separated, tags"
                        />
                      )}
                    </div>

                    {/* Images */}
                    <div>
                      <div className="text-sm font-medium mb-2">Images</div>
                      <div className="flex flex-wrap gap-3">
                        {(editingItem.images || []).map((img, idx) => {
                          const src = imageLink(img?.url || img);
                          const idOrUpload = img?.imageId || img?.uploadId || img?.id || img;
                          return (
                            <figure key={`${String(idOrUpload)}-${idx}`} className="w-24">
                              <img src={src} alt="Item" className="w-24 h-24 object-cover rounded-md" />
                              <figcaption className="mt-2 flex gap-1">
                                <button type="button" className="text-xs px-2 py-1 border rounded-md" onClick={() => onRemoveItemImage(idOrUpload)}>
                                  Remove
                                </button>
                                <button type="button" className="text-xs px-2 py-1 border rounded-md" onClick={() => onSetItemThumb(idOrUpload)}>
                                  Set thumbnail
                                </button>
                              </figcaption>
                            </figure>
                          );
                        })}
                      </div>

                      {editingItem._id ? (
                        <label className="inline-block mt-3 text-sm px-3 py-2 border rounded-md cursor-pointer">
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
                        <div className="text-xs text-slate-500 mt-2">Save the item first to upload images.</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md" onClick={onSaveItem}>
                        Save item
                      </button>
                      <button className="px-4 py-2 border rounded-md" onClick={() => setEditingItem(null)}>
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
