// src/pages/eventManager/EventManagerExhibitorsPage.jsx
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiGrid,
  FiList,
  FiPlus,
  FiMapPin,
  FiMail,
  FiPhone,
  FiExternalLink,
  FiTrash2,
  FiEdit2,
  FiX,
} from "react-icons/fi";
import "./event-manager-exhibitors.css";

const INITIAL_EXHIBITORS = [
  {
    id: "ex1",
    businessId: "bp1",
    name: "Innovation Labs",
    logo: "IL",
    booth: "A24",
    category: "Technology",
    status: "confirmed",
    email: "contact@innovationlabs.com",
    phone: "+1 (555) 123-4567",
    website: "innovationlabs.com",
    products: "AI Solutions, Cloud Services",
    description: "Leading provider of enterprise AI solutions.",
  },
  {
    id: "ex2",
    businessId: "bp2",
    name: "GreenTech Manufacturing",
    logo: "GM",
    booth: "A20",
    category: "Sustainable manufacturing",
    status: "confirmed",
    email: "hello@greentech.com",
    phone: "+1 (555) 234-5678",
    website: "greentech.com",
    products: "Eco-friendly machinery, industrial IoT",
    description: "Sustainable industrial manufacturing solutions.",
  },
  {
    id: "ex3",
    businessId: "bp3",
    name: "Meditech Tunisia",
    logo: "MT",
    booth: "B09",
    category: "Healthcare",
    status: "pending",
    email: "info@meditech.tn",
    phone: "+216 71 000 000",
    website: "meditech.tn",
    products: "Medical devices, hospital equipment",
    description: "Medical technology for clinics and hospitals.",
  },
  {
    id: "ex4",
    businessId: "bp4",
    name: "PortX Logistics",
    logo: "PX",
    booth: "C06",
    category: "Logistics & port services",
    status: "confirmed",
    email: "contact@portx.com",
    phone: "+1 (555) 345-6789",
    website: "portx.com",
    products: "Port logistics, freight forwarding",
    description: "Integrated port and logistics solutions.",
  },
  {
    id: "ex5",
    businessId: "bp5",
    name: "CloudNine",
    logo: "CN",
    booth: "D18",
    category: "Cloud & DevOps",
    status: "confirmed",
    email: "team@cloudnine.com",
    phone: "+1 (555) 456-7890",
    website: "cloudnine.com",
    products: "Cloud infra, DevOps consulting",
    description: "Scalable cloud infrastructure provider.",
  },
];

const INITIAL_BUSINESS_PROFILES = [
  { id: "bp1", name: "Innovation Labs", country: "USA", sector: "Technology" },
  { id: "bp2", name: "GreenTech Manufacturing", country: "Germany", sector: "Manufacturing" },
  { id: "bp3", name: "Meditech Tunisia", country: "Tunisia", sector: "Healthcare" },
  { id: "bp4", name: "PortX Logistics", country: "Morocco", sector: "Logistics" },
  { id: "bp5", name: "CloudNine", country: "France", sector: "Cloud & DevOps" },
  { id: "bp6", name: "SecureNet Solutions", country: "UK", sector: "Cybersecurity" },
  { id: "bp7", name: "AI Dynamics", country: "UAE", sector: "AI & Data" },
];

const INITIAL_BOOTH_MAP = [
  ["A24", "A23", "A22", "A21", "A20"],
  ["A19", "A18", "A17", "A16", "A15"],
  ["B12", "B11", "B10", "B09", "B08"],
  ["B07", "B06", "B05", "B04", "B03"],
  ["C08", "C07", "C06", "C05", "C04"],
  ["D20", "D19", "D18", "D17", "D16"],
];

const STATUS_COLORS = {
  confirmed: "emex-badge-status emex-badge-status--confirmed",
  pending: "emex-badge-status emex-badge-status--pending",
  rejected: "emex-badge-status emex-badge-status--rejected",
};

const STATUS_OPTIONS = ["confirmed", "pending", "rejected"];

function normalize(str) {
  return (str || "").toString().toLowerCase();
}

const EventManagerExhibitorsPage = () => {
  const [tab, setTab] = useState("exhibitors"); // "exhibitors" | "map"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [searchTerm, setSearchTerm] = useState("");
  const [exhibitors, setExhibitors] = useState(INITIAL_EXHIBITORS);
  const [boothMap, setBoothMap] = useState(INITIAL_BOOTH_MAP);
  const [businessProfiles] = useState(INITIAL_BUSINESS_PROFILES);

  const [activeModal, setActiveModal] = useState(null);
  // activeModal = {
  //   type: "createExhibitor" | "editExhibitor" | "contactExhibitor" | "editBooth",
  //   exhibitorId?: string,
  //   boothCode?: string
  // }

  const filteredExhibitors = useMemo(() => {
    if (!searchTerm) return exhibitors;
    const q = normalize(searchTerm);
    return exhibitors.filter((e) => {
      return (
        normalize(e.name).includes(q) ||
        normalize(e.category).includes(q) ||
        normalize(e.booth).includes(q) ||
        normalize(e.website).includes(q)
      );
    });
  }, [exhibitors, searchTerm]);

  const stats = useMemo(() => {
    const total = exhibitors.length;
    const confirmed = exhibitors.filter((e) => e.status === "confirmed").length;
    const pending = exhibitors.filter((e) => e.status === "pending").length;
    const allBooths = boothMap.flat().filter(Boolean);
    const occupied = exhibitors
      .map((e) => e.booth)
      .filter((b) => !!b).length;
    const available = Math.max(allBooths.length - occupied, 0);
    return { total, confirmed, pending, available };
  }, [exhibitors, boothMap]);

  const getExhibitorById = (id) =>
    exhibitors.find((e) => e.id === id) || null;

  const getExhibitorByBooth = (boothCode) =>
    exhibitors.find((e) => e.booth === boothCode) || null;

  const getBusinessById = (id) =>
    businessProfiles.find((bp) => bp.id === id) || null;

  const handleCreateFromModal = (payload) => {
    // payload: { businessId, booth, status, category }
    const business = getBusinessById(payload.businessId);
    if (!business) return;

    const next = {
      id: `ex_${Date.now()}`,
      businessId: business.id,
      name: business.name,
      logo: business.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 3)
        .toUpperCase(),
      booth: payload.booth || "",
      category: payload.category || business.sector || "",
      status: payload.status || "pending",
      email: payload.email || "",
      phone: payload.phone || "",
      website: payload.website || "",
      products: payload.products || "",
      description: payload.description || "",
    };
    setExhibitors((prev) => [...prev, next]);
  };

  const handleUpdateExhibitor = (id, updates) => {
    setExhibitors((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const handleDeleteExhibitor = (id) => {
    setExhibitors((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAssignBooth = (boothCode, exhibitorId) => {
    setExhibitors((prev) =>
      prev.map((e) =>
        e.id === exhibitorId ? { ...e, booth: boothCode } : e
      )
    );
  };

  const handleClearBooth = (boothCode) => {
    setExhibitors((prev) =>
      prev.map((e) =>
        e.booth === boothCode ? { ...e, booth: "" } : e
      )
    );
  };

  const handleDeleteBooth = (boothCode) => {
    setBoothMap((prev) =>
      prev.map((row) =>
        row.map((cell) => (cell === boothCode ? null : cell))
      )
    );
    handleClearBooth(boothCode);
  };

  return (
    <div className="emex-root">
      <div className="emex-inner container">
        {/* Header */}
        <header className="emex-header">
          <div className="emex-header-left">
            <div className="emex-chip">Event manager · Exhibitors</div>
            <h1 className="emex-title">Exhibitors</h1>
            <p className="emex-sub">
              Manage exhibitors, their business profiles and booth assignments for this event.
            </p>
          </div>
          <div className="emex-header-right">
            <button
              type="button"
              className="emex-btn emex-btn--primary"
              onClick={() => setActiveModal({ type: "createExhibitor" })}
            >
              <FiPlus className="emex-btn-icon" />
              <span>Create exhibitor</span>
            </button>
          </div>
        </header>

        {/* Stats row */}
        <section className="emex-stats-grid">
          <article className="emex-stat-card">
            <p className="emex-stat-label">Total exhibitors</p>
            <p className="emex-stat-value">{stats.total}</p>
          </article>
          <article className="emex-stat-card">
            <p className="emex-stat-label">Confirmed</p>
            <p className="emex-stat-value emex-stat-value--green">{stats.confirmed}</p>
          </article>
          <article className="emex-stat-card">
            <p className="emex-stat-label">Pending</p>
            <p className="emex-stat-value emex-stat-value--amber">{stats.pending}</p>
          </article>
          <article className="emex-stat-card">
            <p className="emex-stat-label">Available booths</p>
            <p className="emex-stat-value">{stats.available}</p>
          </article>
        </section>

        {/* Tabs */}
        <section className="emex-tabs">
          <button
            type="button"
            className={
              "emex-tab" + (tab === "exhibitors" ? " emex-tab--active" : "")
            }
            onClick={() => setTab("exhibitors")}
          >
            Exhibitors
          </button>
          <button
            type="button"
            className={
              "emex-tab" + (tab === "map" ? " emex-tab--active" : "")
            }
            onClick={() => setTab("map")}
          >
            Booth map
          </button>
        </section>

        {/* Exhibitors tab */}
        {tab === "exhibitors" && (
          <section className="emex-card">
            {/* Toolbar */}
            <div className="emex-toolbar">
              <div className="emex-search">
                <FiSearch className="emex-search-icon" />
                <input
                  type="text"
                  className="emex-search-input"
                  placeholder="Search exhibitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="emex-view-toggle">
                <button
                  type="button"
                  className={
                    "emex-toggle-btn" +
                    (viewMode === "grid" ? " emex-toggle-btn--active" : "")
                  }
                  onClick={() => setViewMode("grid")}
                >
                  <FiGrid className="emex-toggle-icon" />
                </button>
                <button
                  type="button"
                  className={
                    "emex-toggle-btn" +
                    (viewMode === "list" ? " emex-toggle-btn--active" : "")
                  }
                  onClick={() => setViewMode("list")}
                >
                  <FiList className="emex-toggle-icon" />
                </button>
              </div>
            </div>

            {/* Exhibitor cards */}
            <div
              className={
                viewMode === "grid"
                  ? "emex-exhibitors-grid"
                  : "emex-exhibitors-list"
              }
            >
              {filteredExhibitors.map((ex) => (
                <article
                  key={ex.id}
                  className="emex-exhibitor-card"
                >
                  <div className="emex-exhibitor-head">
                    <div className="emex-exhibitor-logo">
                      <span>{ex.logo}</span>
                    </div>
                    <div className="emex-exhibitor-meta">
                      <h3 className="emex-exhibitor-name">{ex.name}</h3>
                      <div className="emex-exhibitor-tags">
                        <span
                          className={
                            STATUS_COLORS[ex.status] || STATUS_COLORS.confirmed
                          }
                        >
                          {ex.status}
                        </span>
                        {ex.booth && (
                          <span className="emex-badge-pill">
                            <FiMapPin className="emex-badge-icon" />
                            Booth {ex.booth}
                          </span>
                        )}
                        {ex.category && (
                          <span className="emex-badge-pill emex-badge-pill--outline">
                            {ex.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {ex.description && (
                    <p className="emex-exhibitor-desc">
                      {ex.description}
                    </p>
                  )}

                  <div className="emex-exhibitor-contact-row">
                    {ex.email && (
                      <button
                        type="button"
                        className="emex-link-chip"
                        onClick={() =>
                          setActiveModal({
                            type: "contactExhibitor",
                            exhibitorId: ex.id,
                          })
                        }
                      >
                        <FiMail className="emex-link-icon" />
                        <span>{ex.email}</span>
                      </button>
                    )}
                    {ex.phone && (
                      <span className="emex-link-chip">
                        <FiPhone className="emex-link-icon" />
                        <span>{ex.phone}</span>
                      </span>
                    )}
                    {ex.website && (
                      <a
                        href={
                          ex.website.startsWith("http")
                            ? ex.website
                            : `https://${ex.website}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="emex-link-chip"
                      >
                        <FiExternalLink className="emex-link-icon" />
                        <span>{ex.website}</span>
                      </a>
                    )}
                  </div>

                  <div className="emex-exhibitor-actions">
                    <button
                      type="button"
                      className="emex-btn emex-btn--outline emex-btn--block"
                      onClick={() =>
                        setActiveModal({
                          type: "editExhibitor",
                          exhibitorId: ex.id,
                        })
                      }
                    >
                      <FiEdit2 className="emex-btn-icon" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="emex-btn emex-btn--outline emex-btn--block"
                      onClick={() =>
                        setActiveModal({
                          type: "contactExhibitor",
                          exhibitorId: ex.id,
                        })
                      }
                    >
                      <FiMail className="emex-btn-icon" />
                      <span>Contact</span>
                    </button>
                  </div>
                </article>
              ))}

              {filteredExhibitors.length === 0 && (
                <div className="emex-empty">
                  <p>No exhibitors match this search.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Booth map tab */}
        {tab === "map" && (
          <section className="emex-card">
            <div className="emex-map-header">
              <div>
                <h2 className="emex-card-title">
                  Exhibition hall – booth layout
                </h2>
                <p className="emex-card-subtitle">
                  Click a booth to assign an exhibitor or update its slot information.
                </p>
              </div>
              <div className="emex-map-legend">
                <span className="emex-legend-pill">
                  <span className="emex-legend-box emex-legend-box--occupied" />
                  Occupied
                </span>
                <span className="emex-legend-pill">
                  <span className="emex-legend-box emex-legend-box--available" />
                  Available
                </span>
              </div>
            </div>

            <div className="emex-booth-grid">
              {boothMap.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="emex-booth-row"
                >
                  {row.map((boothCode) => {
                    if (!boothCode) {
                      return (
                        <div
                          key={`empty-${rowIndex}-${Math.random()}`}
                          className="emex-booth-cell emex-booth-cell--empty"
                        />
                      );
                    }
                    const ex = getExhibitorByBooth(boothCode);
                    const isOccupied = !!ex;
                    return (
                      <button
                        key={boothCode}
                        type="button"
                        className={
                          "emex-booth-cell " +
                          (isOccupied
                            ? "emex-booth-cell--occupied"
                            : "emex-booth-cell--available")
                        }
                        onClick={() =>
                          setActiveModal({
                            type: "editBooth",
                            boothCode,
                          })
                        }
                      >
                        <span className="emex-booth-code">{boothCode}</span>
                        {isOccupied && (
                          <span className="emex-booth-exhibitor">
                            {ex.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Modals */}
      {activeModal?.type === "createExhibitor" && (
        <CreateExhibitorModal
          businessProfiles={businessProfiles}
          boothMap={boothMap}
          existingExhibitors={exhibitors}
          onClose={() => setActiveModal(null)}
          onCreate={(payload) => {
            handleCreateFromModal(payload);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "editExhibitor" && (
        <EditExhibitorModal
          exhibitor={getExhibitorById(activeModal.exhibitorId)}
          boothMap={boothMap}
          onClose={() => setActiveModal(null)}
          onUpdate={(updates) => {
            handleUpdateExhibitor(activeModal.exhibitorId, updates);
            setActiveModal(null);
          }}
          onDelete={() => {
            handleDeleteExhibitor(activeModal.exhibitorId);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "contactExhibitor" && (
        <ContactExhibitorModal
          exhibitor={getExhibitorById(activeModal.exhibitorId)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal?.type === "editBooth" && (
        <EditBoothModal
          boothCode={activeModal.boothCode}
          exhibitors={exhibitors}
          currentExhibitor={getExhibitorByBooth(activeModal.boothCode)}
          onClose={() => setActiveModal(null)}
          onAssign={(exhibitorId) => {
            handleAssignBooth(activeModal.boothCode, exhibitorId);
            setActiveModal(null);
          }}
          onClear={() => {
            handleClearBooth(activeModal.boothCode);
            setActiveModal(null);
          }}
          onDeleteBooth={() => {
            handleDeleteBooth(activeModal.boothCode);
            setActiveModal(null);
          }}
        />
      )}
    </div>
  );
};

/* ───────────────────────────────── Modals ───────────────────────────────── */

const CreateExhibitorModal = ({
  businessProfiles,
  boothMap,
  existingExhibitors,
  onClose,
  onCreate,
}) => {
  const [search, setSearch] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [status, setStatus] = useState("pending");
  const [booth, setBooth] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [products, setProducts] = useState("");
  const [description, setDescription] = useState("");

  const occupiedBooths = useMemo(
    () => new Set(existingExhibitors.map((e) => e.booth).filter(Boolean)),
    [existingExhibitors]
  );
  const allBooths = useMemo(
    () => boothMap.flat().filter(Boolean),
    [boothMap]
  );
  const availableBooths = allBooths.filter((b) => !occupiedBooths.has(b));

  const filteredProfiles = useMemo(() => {
    const q = normalize(search);
    if (!q) return businessProfiles;
    return businessProfiles.filter((bp) =>
      normalize(`${bp.name} ${bp.country} ${bp.sector}`).includes(q)
    );
  }, [businessProfiles, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBusinessId) return;
    onCreate({
      businessId: selectedBusinessId,
      status,
      booth,
      category,
      email,
      phone,
      website,
      products,
      description,
    });
  };

  return (
    <div className="emex-modal-backdrop">
      <div className="emex-modal">
        <div className="emex-modal-header">
          <h2>Create exhibitor</h2>
          <button
            type="button"
            className="emex-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <form
          className="emex-modal-body emex-modal-body--2col"
          onSubmit={handleSubmit}
        >
          {/* LEFT: business profile selector */}
          <div className="emex-modal-col">
            <p className="emex-modal-section-title">
              Select business profile
            </p>
            <div className="emex-modal-search">
              <FiSearch className="emex-modal-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business profiles..."
              />
            </div>
            <div className="emex-bp-list">
              {filteredProfiles.map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  className={
                    "emex-bp-item" +
                    (selectedBusinessId === bp.id ? " emex-bp-item--active" : "")
                  }
                  onClick={() => setSelectedBusinessId(bp.id)}
                >
                  <div className="emex-bp-avatar">
                    {bp.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 3)
                      .toUpperCase()}
                  </div>
                  <div className="emex-bp-meta">
                    <div className="emex-bp-name">{bp.name}</div>
                    <div className="emex-bp-sub">
                      {bp.country} · {bp.sector}
                    </div>
                  </div>
                </button>
              ))}
              {filteredProfiles.length === 0 && (
                <div className="emex-empty">
                  <p>No business profiles match this search.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: exhibitor details */}
          <div className="emex-modal-col">
            <p className="emex-modal-section-title">Exhibitor details</p>

            <label className="emex-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="emex-field">
              <span>Booth</span>
              <select
                value={booth}
                onChange={(e) => setBooth(e.target.value)}
              >
                <option value="">No booth yet</option>
                {availableBooths.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>

            <label className="emex-field">
              <span>Category</span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Optional – e.g. AI, logistics..."
              />
            </label>

            <div className="emex-field-row">
              <label className="emex-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label className="emex-field">
                <span>Phone</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>

            <label className="emex-field">
              <span>Website</span>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="emex-field">
              <span>Products / services</span>
              <input
                type="text"
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="emex-field">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional short description..."
              />
            </label>
          </div>

          {/* footer */}
          <div className="emex-modal-footer">
            <button
              type="button"
              className="emex-btn emex-btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="emex-btn emex-btn--primary"
              disabled={!selectedBusinessId}
            >
              Create exhibitor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditExhibitorModal = ({
  exhibitor,
  boothMap,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [status, setStatus] = useState(exhibitor?.status || "pending");
  const [booth, setBooth] = useState(exhibitor?.booth || "");
  const [category, setCategory] = useState(exhibitor?.category || "");
  const [email, setEmail] = useState(exhibitor?.email || "");
  const [phone, setPhone] = useState(exhibitor?.phone || "");
  const [website, setWebsite] = useState(exhibitor?.website || "");
  const [products, setProducts] = useState(exhibitor?.products || "");
  const [description, setDescription] = useState(exhibitor?.description || "");

  const allBooths = useMemo(
    () => boothMap.flat().filter(Boolean),
    [boothMap]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      status,
      booth,
      category,
      email,
      phone,
      website,
      products,
      description,
    });
  };

  if (!exhibitor) return null;

  return (
    <div className="emex-modal-backdrop">
      <div className="emex-modal">
        <div className="emex-modal-header">
          <h2>Edit exhibitor</h2>
          <button
            type="button"
            className="emex-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <form
          className="emex-modal-body"
          onSubmit={handleSubmit}
        >
          <p className="emex-modal-section-title">{exhibitor.name}</p>

          <div className="emex-field-row">
            <label className="emex-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="emex-field">
              <span>Booth</span>
              <select
                value={booth}
                onChange={(e) => setBooth(e.target.value)}
              >
                <option value="">No booth</option>
                {allBooths.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="emex-field">
            <span>Category</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>

          <div className="emex-field-row">
            <label className="emex-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="emex-field">
              <span>Phone</span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>

          <label className="emex-field">
            <span>Website</span>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>

          <label className="emex-field">
            <span>Products / services</span>
            <input
              type="text"
              value={products}
              onChange={(e) => setProducts(e.target.value)}
            />
          </label>

          <label className="emex-field">
            <span>Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="emex-modal-footer emex-modal-footer--split">
            <button
              type="button"
              className="emex-btn emex-btn--danger"
              onClick={onDelete}
            >
              <FiTrash2 className="emex-btn-icon" />
              <span>Delete exhibitor</span>
            </button>

            <div className="emex-modal-footer-right">
              <button
                type="button"
                className="emex-btn emex-btn--ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="emex-btn emex-btn--primary"
              >
                Save changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const ContactExhibitorModal = ({ exhibitor, onClose }) => {
  if (!exhibitor) return null;

  return (
    <div className="emex-modal-backdrop">
      <div className="emex-modal emex-modal--small">
        <div className="emex-modal-header">
          <h2>Contact exhibitor</h2>
          <button
            type="button"
            className="emex-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        <div className="emex-modal-body">
          <p className="emex-modal-section-title">{exhibitor.name}</p>
          <div className="emex-contact-row">
            {exhibitor.email && (
              <a
                href={`mailto:${exhibitor.email}`}
                className="emex-link-chip emex-link-chip--block"
              >
                <FiMail className="emex-link-icon" />
                <span>{exhibitor.email}</span>
              </a>
            )}
            {exhibitor.phone && (
              <a
                href={`tel:${exhibitor.phone}`}
                className="emex-link-chip emex-link-chip--block"
              >
                <FiPhone className="emex-link-icon" />
                <span>{exhibitor.phone}</span>
              </a>
            )}
            {exhibitor.website && (
              <a
                href={
                  exhibitor.website.startsWith("http")
                    ? exhibitor.website
                    : `https://${exhibitor.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="emex-link-chip emex-link-chip--block"
              >
                <FiExternalLink className="emex-link-icon" />
                <span>{exhibitor.website}</span>
              </a>
            )}
          </div>
        </div>

        <div className="emex-modal-footer">
          <button
            type="button"
            className="emex-btn emex-btn--ghost"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const EditBoothModal = ({
  boothCode,
  exhibitors,
  currentExhibitor,
  onClose,
  onAssign,
  onClear,
  onDeleteBooth,
}) => {
  const [selectedExhibitorId, setSelectedExhibitorId] = useState(
    currentExhibitor?.id || ""
  );

  const sortedExhibitors = useMemo(
    () =>
      [...exhibitors].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [exhibitors]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedExhibitorId) return;
    onAssign(selectedExhibitorId);
  };

  return (
    <div className="emex-modal-backdrop">
      <div className="emex-modal emex-modal--small">
        <div className="emex-modal-header">
          <h2>Booth {boothCode}</h2>
          <button
            type="button"
            className="emex-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>
        <form
          className="emex-modal-body"
          onSubmit={handleSubmit}
        >
          <p className="emex-modal-section-title">
            {currentExhibitor
              ? `Assigned to ${currentExhibitor.name}`
              : "No exhibitor assigned yet"}
          </p>

          <label className="emex-field">
            <span>Select exhibitor</span>
            <select
              value={selectedExhibitorId}
              onChange={(e) => setSelectedExhibitorId(e.target.value)}
            >
              <option value="">— No exhibitor —</option>
              {sortedExhibitors.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </label>

          <div className="emex-modal-footer emex-modal-footer--split">
            <button
              type="button"
              className="emex-btn emex-btn--danger"
              onClick={onDeleteBooth}
            >
              <FiTrash2 className="emex-btn-icon" />
              <span>Delete booth</span>
            </button>
            <div className="emex-modal-footer-right">
              <button
                type="button"
                className="emex-btn emex-btn--ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="emex-btn emex-btn--outline"
                onClick={onClear}
              >
                Clear assignment
              </button>
              <button
                type="submit"
                className="emex-btn emex-btn--primary"
                disabled={!selectedExhibitorId}
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventManagerExhibitorsPage;
