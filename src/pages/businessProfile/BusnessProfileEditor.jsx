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

function MultiSelect({ values = [], onChange, options }) {
  function toggle(v) {
    const has = values.includes(v);
    if (has) onChange(values.filter((x) => x !== v));
    else onChange([...values, v]);
  }
  return (
    <div className="bpe-chipset">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            className={`bp-chip ${active ? "is-active" : ""}`}
            onClick={() => toggle(opt)}
          >
            {opt}
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
    setCountries(Array.isArray(profile.countries) ? profile.countries : []);
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
<section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-3">
  <h2 className="text-lg font-semibold text-gray-800 mb-6">Identity</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Name */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Name
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Company / Brand name"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    {/* Team Size */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Team size
      </label>
      <select
        value={size}
        onChange={(e) => setSize(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select team size</option>
        {["1-10", "11-50", "51-200", "201-500", "500+"].map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>

    {/* Tagline */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tagline
      </label>
      <input
        type="text"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        placeholder="Short one-liner"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    {/* About */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        About
      </label>
      <textarea
        rows={6}
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        placeholder="Tell visitors what you do, who you help, and why you're different."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      ></textarea>
    </div>

    {/* Languages */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Languages
      </label>
      <MultiSelect
        values={languages}
        onChange={setLanguages}
        options={languageOptions}
      />
    </div>

    {/* Offering */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Offering (what you sell/do)
      </label>
      <ArrayInput values={offering} onChange={setOffering} />
    </div>

    {/* Seeking */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Seeking (what you want)
      </label>
      <ArrayInput values={seeking} onChange={setSeeking} />
    </div>

    {/* Innovation */}
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Innovation / Keywords
      </label>
      <ArrayInput values={innovation} onChange={setInnovation} />
    </div>
  </div>

  {/* Save Button */}
  <div className="flex justify-end mt-8">
    <button
      className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      onClick={saveBasics}
      disabled={busy}
    >
      Save Identity
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
<section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 mb-3">
  <h2 className="text-lg font-semibold text-gray-800 mb-6">
    Contacts & Socials
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Contacts */}
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
        Contacts
      </h3>

      {contacts.length === 0 && (
        <p className="text-sm text-gray-400">No contacts yet.</p>
      )}

      {contacts.map((c, idx) => (
        <div
          key={idx}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
        >
          <select
            className="w-full sm:w-1/4 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={c.kind || "email"}
            onChange={(e) => updateContact(idx, { kind: e.target.value })}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <input
            className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Value"
            value={c.value || ""}
            onChange={(e) => updateContact(idx, { value: e.target.value })}
          />

          <input
            className="w-full sm:w-1/4 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Label (e.g., Sales)"
            value={c.label || ""}
            onChange={(e) => updateContact(idx, { label: e.target.value })}
          />

          <button
            type="button"
            className="text-red-600 text-sm font-medium hover:underline sm:ml-2"
            onClick={() => removeContact(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        onClick={addContact}
      >
        + Add contact
      </button>
    </div>

    {/* Socials */}
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
        Socials
      </h3>

      {socials.length === 0 && (
        <p className="text-sm text-gray-400">No socials yet.</p>
      )}

      {socials.map((s, idx) => (
        <div
          key={idx}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
        >
          <select
            className="w-full sm:w-1/4 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={s.kind || "website"}
            onChange={(e) => updateSocial(idx, { kind: e.target.value })}
          >
            <option value="website">Website</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x">X (Twitter)</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>

          <input
            className="w-full sm:flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://..."
            value={s.url || ""}
            onChange={(e) => updateSocial(idx, { url: e.target.value })}
          />

          <button
            type="button"
            className="text-red-600 text-sm font-medium hover:underline sm:ml-2"
            onClick={() => removeSocial(idx)}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        onClick={addSocial}
      >
        + Add social
      </button>
    </div>
  </div>

  {/* Save Button */}
  <div className="flex justify-end mt-8">
    <button
      className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      onClick={saveContacts}
      disabled={savingContacts}
    >
      Save Contacts/Socials
    </button>
  </div>
</section>

<section className="bg-white shadow-md rounded-2xl p-6 border border-gray-100 space-y-6">
  <div className="text-xl font-semibold text-gray-800 border-b pb-2">
    Team
  </div>

  {/* Current team list */}
  {team.length === 0 ? (
    <div className="text-gray-400 italic">No team members yet.</div>
  ) : (
    <div className="space-y-3">
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
            className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-xl border hover:shadow-sm transition"
          >
            {/* Avatar */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col">
                <div className="font-medium text-gray-900">{name}</div>
                {meta && <div className="text-sm text-gray-500">{meta}</div>}
              </div>
            </div>

            <div>
              <button
                className="px-3 py-1 border rounded-lg text-red-600 hover:bg-red-50 transition disabled:opacity-50"
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

  <div className="pt-4">
    <button
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      onClick={() => setTeamModalOpen(true)}
    >
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
<section className="bg-white shadow-md rounded-2xl p-6 space-y-6 border border-gray-100">
  <div className="text-xl font-semibold text-gray-800 border-b pb-2">
    Items (Products / Services)
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    {/* Left: List of items */}
    <div className="space-y-4">
      <button
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
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

      <div className="space-y-3">
        {(items || []).map((it) => {
          const thumbSrc =
            (it.thumbnailUpload ? imageLink(it.thumbnailUpload) : "") ||
            (Array.isArray(it.images) && it.images.length
              ? imageLink(it.images[0])
              : "");

          return (
            <article
              key={it._id}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border hover:shadow-sm transition"
            >
              {thumbSrc ? (
                <img
                  src={thumbSrc}
                  alt=""
                  className="w-16 h-16 rounded-md object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-md bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                  No Img
                </div>
              )}

              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {it.title || "Untitled"}
                </div>
                {it.sector || it.subsectorName ? (
                  <div className="text-sm text-gray-500">
                    {it.sector || ""}
                    {it.sector && it.subsectorName ? " • " : ""}
                    {it.subsectorName || ""}
                  </div>
                ) : null}
                {it.pricingNote && (
                  <div className="text-sm text-gray-600 mt-1">
                    {it.pricingNote}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  className="px-3 py-1 border rounded-lg text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    const descr = it.details || it.summary || "";
                    const price = it.pricingNote || "";
                    const tags = Array.isArray(it.tags) ? it.tags : [];
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
                </button>
                <button
                  className="px-3 py-1 border rounded-lg text-red-600 hover:bg-red-50"
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

    {/* Right: Item Editor */}
    <div>
      {!editingItem ? (
        <div className="text-gray-400 italic">
          Select or create an item to edit.
        </div>
      ) : (
        <div className="space-y-5">
          {itemErr && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {itemErr}
            </div>
          )}

          <Field label="Title">
            <TextInput
              value={editingItem.title || ""}
              onChange={(v) => setEditingItem((s) => ({ ...s, title: v }))}
            />
          </Field>

          <Field label="Sector">
            <select
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
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
              onChange={(v) => setEditingItem((s) => ({ ...s, kind: v }))}
              options={["product", "service"]}
            />
          </Field>

          <Field label="Description">
            <TextArea
              rows={6}
              value={editingItem.descr || ""}
              onChange={(v) => setEditingItem((s) => ({ ...s, descr: v }))}
            />
          </Field>

          <Field label="Price">
            <TextInput
              value={editingItem.price || ""}
              onChange={(v) => setEditingItem((s) => ({ ...s, price: v }))}
              placeholder="e.g., $499"
            />
          </Field>

          <Field label="Tags">
            <ArrayInput
              values={
                Array.isArray(editingItem.tags) ? editingItem.tags : []
              }
              onChange={(v) => setEditingItem((s) => ({ ...s, tags: v }))}
            />
          </Field>

          {/* Images */}
          <div>
            <div className="font-medium text-gray-700 mb-2">Images</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(editingItem.images || []).map((img, idx) => {
                const src = imageLink(img?.url || img);
                const idOrUpload =
                  img?.imageId || img?.uploadId || img?.id || img;
                return (
                  <div
                    key={`${String(idOrUpload)}-${idx}`}
                    className="relative group"
                  >
                    <img
                      src={src}
                      alt="Item"
                      className="rounded-lg object-cover w-full h-24 border"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition">
                      <button
                        className="text-white text-xs border px-2 py-1 rounded"
                        onClick={() => onRemoveItemImage(idOrUpload)}
                      >
                        Remove
                      </button>
                      <button
                        className="text-white text-xs border px-2 py-1 rounded"
                        onClick={() => onSetItemThumb(idOrUpload)}
                      >
                        Set thumbnail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {editingItem._id ? (
              <label
                className="mt-3 inline-block px-4 py-2 border rounded-lg text-gray-700 cursor-pointer hover:bg-gray-50"
                title={
                  editingItem._id ? "Upload images" : "Save item first"
                }
              >
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
              <div className="text-sm text-gray-400">
                Save the item first to upload images.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              onClick={onSaveItem}
            >
              Save item
            </button>
            <button
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
