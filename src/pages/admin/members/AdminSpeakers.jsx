// src/pages/admin/members/AdminSpeakers.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../../features/auth/authSlice";
import ReactCountryFlag from "react-country-flag";
import "./admin.attendees.css"; // reuse same styles
import SessionPicker from "../../../components/admin/SessionPicker";

import {
  useGetActorsListAdminQuery,
  useGetAdminActorQuery,
  useCreateActorMutation,
  useUploadActorPhotoMutation, // <-- new hook (add to your adminApiSlice)
} from "../../../features/Actor/adminApiSlice";

import {
  useGetEventsQuery,
  useGetEventQuery, // resolve event name by id
} from "../../../features/events/eventsApiSlice";

import { useGetEventSessionsQuery } from "../../../features/events/scheduleApiSlice";
import imageLink from "../../../utils/imageLink";

/* ───────────────────────── i18n-iso-countries setup ───────────────────────── */
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register locale once (module top-level)
countries.registerLocale(enLocale);


const ALL_COUNTRIES = Object.entries(
  countries.getNames("en", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ───────────────────────── Helpers / constants ───────────────────────── */

const ROLE = "speaker";

function normalizeToAlpha2(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (!s) return "";
  if (s.length === 2) return s.toUpperCase();
  const mapped = countries.getAlpha2Code(s, "en");
  return mapped ? mapped.toUpperCase() : "";
}

function EventName({ id, fallback = "—" }) {
  const { data } = useGetEventQuery(id, { skip: !id });
  const title = data?.title || data?.name || fallback;
  return <>{title}</>;
}

function flagChip(codeOrName) {
  if (!codeOrName) return "—";
  const alpha2 =
    normalizeToAlpha2(codeOrName) ||
    String(codeOrName).trim().slice(0, 2).toUpperCase();
  if (!alpha2 || alpha2.length !== 2) {
    return (
      <span className="flag-chip" title={String(codeOrName)}>
        {String(codeOrName)}
      </span>
    );
  }
  return (
    <span className="flag-chip" title={alpha2}>
      <ReactCountryFlag svg countryCode={alpha2} style={{ fontSize: "1em" }} />
    </span>
  );
}

function isDefaultPhoto(src) {
  if (!src) return false;
  try {
    return (
      String(src).includes("/uploads/default/photodef.png") ||
      String(src).endsWith(": /default/photodef.png") ||
      String(src).endsWith("/default/photodef.png")
    );
  } catch {
    return false;
  }
}
function fmtUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
function getId(x) {
  return (
    x?.data?._id ||
    x?._id ||
    x?.id ||
    x?.personal?._id ||
    String(x?.email || "") + String(x?.createdAt || "")
  );
}
function bool(v) {
  return v == null ? "—" : v ? "Yes" : "No";
}
function timeHM(d) {
  try {
    return new Date(d).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
function dateYMD(d) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

/* ───────────────────────── Page ───────────────────────── */

export default function AdminSpeakers() {
  const navigate = useNavigate();

  // Filters: search | limit | eventId
  const [search, setSearch] = React.useState("");
  const [limit, setLimit] = React.useState(20);
  const [eventFilterId, setEventFilterId] = React.useState("");
  const { data: events = [] } = useGetEventsQuery();

  // Normalize events payload (defensive)
  const eventsArr = React.useMemo(() => {
    if (Array.isArray(events)) return events;
    if (Array.isArray(events?.data)) return events.data;
    if (Array.isArray(events?.data?.data)) return events.data.data;
    return [];
  }, [events]);

  // Prepare list query args
  const listArgs = React.useMemo(() => {
    const base = { role: typeof ROLE !== "undefined" ? ROLE : "speaker" };
    if (eventFilterId) base.eventId = eventFilterId;
    if (search.trim()) return { ...base, search: search.trim() };
    return { ...base, limit: Number(limit) || 20 };
  }, [search, limit, eventFilterId]);

  const {
    data: list = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetActorsListAdminQuery(listArgs);

  const items = React.useMemo(() => {
    if (Array.isArray(list)) return list;
    if (Array.isArray(list?.data)) return list.data;
    if (Array.isArray(list?.data?.data)) return list.data.data;
    return [];
  }, [list]);

  /* ── Modal (full actor) */
  const [activeId, setActiveId] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const qid = searchParams.get("id");
    if (qid && qid !== activeId) {
      setActiveId(qid);
      setModalOpen(true);
    }
    // intentionally depends on searchParams and activeId
  }, [searchParams, activeId]);

  const {
    data: actor,
    isFetching: fetchingActor,
    refetch: refetchActor,
  } = useGetAdminActorQuery(activeId ? activeId : null, { skip: !activeId });

  const openModal = (id) => {
    setActiveId(id);
    setModalOpen(true);
    const sp = new URLSearchParams(searchParams);
    sp.set("id", id);
    setSearchParams(sp, { replace: false });
  };
  const closeModal = () => {
    setModalOpen(false);
    const sp = new URLSearchParams(searchParams);
    sp.delete("id");
    setSearchParams(sp, { replace: true });
  };

  // Helper to get a reliable API base for fetch calls (die-safe on deploy)
  const getApiBase = React.useCallback(() => {
    try {
      const env = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");
      if (env) return env;
      if (typeof window !== "undefined" && window.__API_BASE__) {
        return String(window.__API_BASE__).replace(/\/+$/, "");
      }
      if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, "");
      }
    } catch (e) {
      // ignore
    }
    return "";
  }, []);

  // keep this shape in sync with your initial createDraft state
  const emptyDraft = {
    fullName: "",
    email: "",
    firstEmail: "",
    country: "",
    eventId: "",
    jobTitle: "",
    sessionIds: [],
    photoFile: null,
    photoPreview: null,
    phone: "",
    city: "",
    orgName: "",
    businessRole: "",
    website: "",
    linkedin: "",
    bio: "",
  };

  const resetCreateDraftToEmpty = () => {
    setCreateDraft({ ...emptyDraft });
    setEditingId(null);
    setIsEditing(false);
  };

  /* ── Create speaker (expanded form + sessions assignment) */
  const [creating, setCreating] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState({ ...emptyDraft });
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [roleKind, setRoleKind] = React.useState("");
  const token = useSelector(selectCurrentToken);

  // Edit helpers
  const handleEditClick = async (actorRowOrId) => {
    try {
      let actor = actorRowOrId;
      let maybeId =
        typeof actorRowOrId === "string"
          ? actorRowOrId
          : actorRowOrId?._id || actorRowOrId?.id;

      const hasEnough = !!(
        actorRowOrId &&
        (actorRowOrId.personal || actorRowOrId.organization || actorRowOrId.talk)
      );
      if (!hasEnough && maybeId) {
        const base = getApiBase();
        const fallback = base || "";
        const safeId = encodeURIComponent(String(maybeId));
        const url = `${fallback}/actors/${safeId}`.replace(/\/+actors/, "/actors");

        const pickTokenFromCookie = (name = "jwt") => {
          try {
            const m = document.cookie.match(
              new RegExp(
                "(?:^|; )" +
                  name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") +
                  "=([^;]*)"
              )
            );
            return m ? decodeURIComponent(m[1]) : null;
          } catch (e) {
            return null;
          }
        };
        const finalToken = token || pickTokenFromCookie("jwt");

        if (!finalToken) {
          alert("You are not authenticated. Please login and try again.");
          return;
        }

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${finalToken}`,
        };
        const res = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => `HTTP ${res.status}`);
          console.warn("Failed to fetch actor for edit:", res.status, txt);
          alert("Unable to load actor for editing (server error).");
          return;
        }
        const parsed = await res.json();
        actor = parsed?.data?.actor || parsed?.data || parsed;
      }

      const personal = actor.personal || actor.identity || {};
      const org = actor.organization || actor.business || actor.identity || {};
      const sessions = Array.isArray(actor.sessionIds)
        ? actor.sessionIds
        : Array.isArray(actor.sessions)
        ? actor.sessions
        : [];

      setCreateDraft((d) => ({
        ...d,
        fullName: (personal.fullName || personal.exhibitorName || d.fullName || "").trim(),
        email: ((personal.email || "") + "").toLowerCase().trim(),
        firstEmail: ((personal.firstEmail || personal.email || "") + "")
          .toLowerCase()
          .trim(),
        country: (personal.country || d.country || "").trim(),
        phone: (personal.phone || d.phone || "").trim(),
        city: (personal.city || d.city || "").trim(),
        jobTitle: (org.jobTitle || d.jobTitle || "").trim(),
        orgName: (org.orgName || org.name || d.orgName || "").trim(),
        businessRole: (org.businessRole || d.businessRole || "").trim(),
        sessionIds: sessions || [],
        eventId: actor.id_event || actor.eventId || d.eventId || "",
        bio: personal.bio || d.bio || "",
        website: (actor.links && actor.links.website) || d.website || "",
        linkedin: (actor.links && actor.links.linkedin) || d.linkedin || "",
      }));

      setEditingId(actor._id || actor.id || maybeId);
      setIsEditing(true);
      setCreating(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("handleEditClick error:", err);
      alert("Failed to open editor — see console.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setCreateDraft({ ...emptyDraft });
    if (typeof setRoleKind === "function") setRoleKind("");
  };

  // upload hook
  const [uploadActorPhoto, { isLoading: uploadingPhoto }] =
    useUploadActorPhotoMutation();

  // Load sessions for selected event (exclude “Formation” track)
  const { data: sessionsPack, isFetching: fetchingSessions } =
    useGetEventSessionsQuery(
      createDraft.eventId
        ? { eventId: createDraft.eventId, track: "", includeCounts: 1 }
        : undefined,
      { skip: !createDraft.eventId }
    );

  const cleanSessions = React.useMemo(() => {
    const raw = sessionsPack?.data || sessionsPack?.sessions || sessionsPack || [];
    return (Array.isArray(raw) ? raw : []).filter(
      (s) => String(s?.track || "").trim().toLowerCase() !== "formation"
    );
  }, [sessionsPack]);

  const pickerSessions = React.useMemo(() => {
    return (cleanSessions || []).map((s) => {
      const start = s.startAt || s.startTime || s.start || s.startsAt || null;
      const end = s.endAt || s.endTime || s.end || s.endsAt || null;
      return {
        _id: s._id || s.id,
        title: s.title || s.sessionTitle || "Session",
        track: s.track || "Session",
        startAt: start ? new Date(start).toISOString() : null,
        endAt: end ? new Date(end).toISOString() : null,
        room: {
          name: s?.room?.name || s?.roomName || "",
          capacity: Number(s?.room?.capacity || 0),
        },
        seatsTaken: Number(s?.seatsTaken || 0),
      };
    });
  }, [cleanSessions]);

  const toggleSess = (id) => {
    setCreateDraft((prev) => {
      const has = prev.sessionIds.map(String).includes(String(id));
      return {
        ...prev,
        sessionIds: has
          ? prev.sessionIds.filter((x) => String(x) !== String(id))
          : [...prev.sessionIds, id],
      };
    });
  };

  const canCreate =
    (createDraft.fullName || "").trim() &&
    (createDraft.email || "").trim() &&
    (createDraft.country || "").trim() &&
    createDraft.eventId &&
    Array.isArray(createDraft.sessionIds) &&
    createDraft.sessionIds.length > 0;

  const [createActor, { isLoading: creatingReq }] = useCreateActorMutation();

  // cleanup previews when photoPreview changes or component unmounts
  React.useEffect(() => {
    const preview = createDraft.photoPreview;
    return () => {
      if (preview) {
        try {
          URL.revokeObjectURL(preview);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [createDraft.photoPreview]);

  const generateTempPwd = () => Math.random().toString(36).slice(-10) + "A1!";

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    const payload = {
      personal: {
        fullName: (createDraft.fullName || "").trim(),
        email: (createDraft.email || "").trim(),
        firstEmail: (createDraft.firstEmail || createDraft.email || "").trim(),
        country: (createDraft.country || "").trim().toUpperCase(),
        phone: (createDraft.phone || "").trim(),
        city: (createDraft.city || "").trim(),
        bio: (createDraft.bio || "").trim().slice(0, 300),
      },
      organization: {
        orgName: (createDraft.orgName || "").trim(),
        jobTitle: (createDraft.jobTitle || "").trim(),
        businessRole: (createDraft.businessRole || "").trim(),
      },
      links: {
        website: createDraft.website || "",
        linkedin: createDraft.linkedin || "",
      },
      sessionIds: createDraft.sessionIds || [],
      eventId: createDraft.eventId || undefined,
    };

    try {
      const base = getApiBase() || "";

      if (isEditing && editingId) {
        const url = `${base}/actors/update/${encodeURIComponent(editingId)}`;
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(url, {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Update failed: " + res.status);
        await res.json();
        alert("Speaker updated");
      } else {
        await createActor({ ...payload, role: "speaker" }).unwrap();
        alert("Speaker created");
      }

      setIsEditing(false);
      setEditingId(null);
      setCreateDraft({ ...emptyDraft });
      refetch();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Submit failed — see console.");
    }
  };

  /* Top-bar actions */
  const seeMore = () => {
    if (search.trim()) return;
    setLimit((n) => (Number(n) || 20) + 5);
  };
  const clearSearch = () => setSearch("");
  const onCustomLimit = (n) => {
    if (search.trim()) return;
    setLimit(Math.max(5, Number(n) || 20));
  };

  return (
    <div className="att-page">
      {/* Top bar */}
      <div className="att-top card p-10">
        <div className="att-controls">
          {/* Search */}
          <div className="att-ctrl">
            <label className="att-lbl">Search (email or name)</label>
            <div className="att-search-row">
              <input
                className="input"
                placeholder="e.g. alice@company.com"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button className="btn tiny" onClick={clearSearch}>
                  Clear
                </button>
              ) : null}
            </div>
            <div className="att-hint muted">
              When searching, “Results per page” is disabled.
            </div>
          </div>

          {/* Results per page */}
          <div className="att-ctrl">
            <label className="att-lbl">Results per page</label>
            <div className="att-limit-row">
              <input
                className="input"
                type="number"
                min="5"
                step="5"
                value={limit}
                onChange={(e) => onCustomLimit(e.target.value)}
                disabled={!!search.trim()}
                title={search ? "Disabled while searching" : "Custom limit"}
              />
              <button
                className="btn tiny text-change"
                onClick={seeMore}
                disabled={!!search.trim()}
              >
                See more (+5)
              </button>
            </div>
          </div>

          {/* Event filter */}
          <div className="att-ctrl">
            <label className="att-lbl">Filter by event</label>
            <select
              className="input"
              value={eventFilterId}
              onChange={(e) => setEventFilterId(e.target.value)}
              title="Filter speakers by event"
            >
              <option value="">All events</option>
              {eventsArr.map((ev) => {
                const id = ev?._id || ev?.id;
                const name = ev?.title || ev?.name || "Untitled event";
                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
            <div className="att-hint muted">
              Shows only speakers linked to the selected event.
            </div>
          </div>

          {/* Actions */}
          <div className="att-actions">
            <button
              className="btn"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Loading…" : "Refresh"}
            </button>

            <button
              className="btn brand ml-4"
              onClick={() => {
                resetCreateDraftToEmpty();
                setCreating((c) => !c);
              }}
            >
              {creating ? "Close form" : "Create speaker"}
            </button>
          </div>
        </div>

        {/* Create form (expanded) */}
        {creating && (
          <form className="att-create card soft p-10" onSubmit={onCreateSubmit}>
            <div className="att-create-grid att-create-grid--wide">
              {/* Left column: base info */}
              <div className="att-col">
                <label className="att-field">
                  <div className="att-lbl">Full name *</div>
                  <input
                    className="input"
                    value={createDraft.fullName}
                    onChange={(e) =>
                      setCreateDraft({ ...createDraft, fullName: e.target.value })
                    }
                  />
                </label>

                <label className="att-field">
                  <div className="att-lbl">Email *</div>
                  <input
                    className="input"
                    type="email"
                    value={createDraft.email}
                    onChange={(e) =>
                      setCreateDraft({ ...createDraft, email: e.target.value })
                    }
                  />
                </label>

                <label className="att-field">
                  <div className="att-lbl">Country (ISO) *</div>
                  <div className="flag-select">
                    <select
                      className="input"
                      value={createDraft.country}
                      onChange={(e) =>
                        setCreateDraft({ ...createDraft, country: e.target.value })
                      }
                    >
                      <option value="">— Select —</option>
                      {(typeof ALL_COUNTRIES !== "undefined" ? ALL_COUNTRIES : []).map(
                        (c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </option>
                        )
                      )}
                    </select>
                    <div className="flag-preview">
                      {typeof flagChip === "function" ? flagChip(createDraft.country) : null}
                    </div>
                  </div>
                </label>

                <label className="att-field">
                  <div className="att-lbl">Role-like (optional)</div>
                  <select
                    className="input"
                    value={roleKind}
                    onChange={(e) => setRoleKind(e.target.value)}
                    title="Assign a role-like tag (optional)"
                  >
                    <option value="">— None —</option>
                    <option>Business Owner</option>
                    <option>Investor</option>
                    <option>Consultant</option>
                    <option>Expert</option>
                    <option>Employee</option>
                    <option>Student</option>
                  </select>
                </label>

                <label className="att-field">
                  <div className="att-lbl">Job Title</div>
                  <input
                    className="input"
                    type="text"
                    value={createDraft.jobTitle || ""}
                    onChange={(e) =>
                      setCreateDraft((d) => ({ ...d, jobTitle: e.target.value }))
                    }
                    placeholder="Ex: Product Manager, Développeur Front, Designer"
                  />
                </label>

                <label className="att-field">
                  <div className="att-lbl">Bio</div>
                  <textarea
                    className="input"
                    value={createDraft.bio || ""}
                    onChange={(e) =>
                      setCreateDraft((d) => ({ ...d, bio: e.target.value }))
                    }
                    placeholder="Short bio — e.g. Senior Frontend Engineer, 10+ years, loves accessibility"
                    rows={4}
                    maxLength={300}
                  />
                </label>

                <label className="att-field">
                  <div className="att-lbl">Event *</div>
                  <select
                    className="input"
                    value={createDraft.eventId}
                    onChange={(e) =>
                      setCreateDraft({
                        ...createDraft,
                        eventId: e.target.value,
                        sessionIds: [],
                      })
                    }
                  >
                    <option value="">— Select event —</option>
                    {eventsArr.map((ev) => {
                      const id = ev?._id || ev?.id;
                      const name = ev?.title || ev?.name || "Untitled event";
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                  <div className="att-hint muted">
                    Sessions list will load after selecting the event. “Formation” track is excluded.
                  </div>
                </label>
              </div>

              {/* Right column: sessions assignment */}
              <div className="att-col">
                <div className="att-lbl">Assign sessions * (at least 1)</div>
                {!createDraft.eventId ? (
                  <div className="muted">Select an event to load sessions.</div>
                ) : fetchingSessions ? (
                  <div className="muted">Loading sessions…</div>
                ) : !pickerSessions.length ? (
                  <div className="muted">No sessions for this event.</div>
                ) : (
                  <SessionPicker
                    sessions={pickerSessions}
                    selectedIds={createDraft.sessionIds.map(String)}
                    onToggle={(s) => {
                      const id = String(s._id || s.id);
                      setCreateDraft((prev) => {
                        const has = prev.sessionIds.map(String).includes(id);
                        return {
                          ...prev,
                          sessionIds: has
                            ? prev.sessionIds.filter((x) => String(x) !== id)
                            : [...prev.sessionIds, id],
                        };
                      });
                    }}
                  />
                )}
              </div>
            </div>

            <div className="att-create-actions">
              <button
                type="submit"
                className="btn brand"
                disabled={!canCreate || creatingReq || uploadingPhoto}
              >
                {creatingReq
                  ? isEditing
                    ? "Saving…"
                    : "Creating…"
                  : uploadingPhoto
                  ? isEditing
                    ? "Uploading photo…"
                    : "Uploading photo…"
                  : isEditing
                  ? "Save changes"
                  : "Create speaker"}
              </button>

              {isEditing ? (
                <button
                  type="button"
                  className="btn ml-4"
                  onClick={() => {
                    resetCreateDraftToEmpty();
                    setCreating(false);
                  }}
                >
                  Cancel
                </button>
              ) : null}

              <span className="att-hint muted ml-8">
                {isEditing
                  ? "You are editing an existing speaker. Click Save changes to apply."
                  : "The speaker will be created and linked to the selected event sessions."}
              </span>
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <section className="att-list card p-10">
        <div className="att-list-head">
          <h3 className="att-title">Speakers</h3>
          <div className="muted">
            {search ? "Search results" : `Showing up to ${limit}`}
            {eventFilterId ? " • filtered by event" : ""}
          </div>
        </div>

        <div className="att-grid">
          {isLoading && !items.length ? (
            skeletons(12)
          ) : items.length ? (
            items.map((it) => (
              <SpeakerRow
                key={getId ? getId(it) : it._id || it.id}
                item={it}
                onOpen={() => openModal(getId ? getId(it) : it._id || it.id)}
                onEdit={() => handleEditClick(it)}
              />
            ))
          ) : (
            <div className="muted">No speakers.</div>
          )}
        </div>
      </section>

      {/* Actor Modal */}
      {modalOpen && (
        <Modal onClose={closeModal}>
          {!actor || fetchingActor ? (
            <div className="muted">Loading speaker…</div>
          ) : (
            <ActorDetails actor={actor} refetchActor={refetchActor} />
          )}
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────── Small components ───────────────────────── */

function SpeakerRow({ item, onOpen, onEdit }) {
  const name = item?.personal?.fullName || item?.name || "—";
  const email = item?.personal?.email || item?.email || "—";
  const countryKey =
    (item?.personal && item.personal.country) || item?.country || "";
  const pic = item?.personal?.profilePic || item?.profilePic;
  const verified = !!(item?.verified ?? item?.verifiedEmail);
  const eventId = item?.id_event || item?.eventId || item?.event?._id;

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (typeof onOpen === "function") onOpen();
    }
  };

  return (
    <div
      className="att-row"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKey}
      title="Open"
      style={{ display: "flex", alignItems: "center" }}
    >
      <div className="att-avatar">
        {pic && !isDefaultPhoto(pic) ? (
          <img className="att-img" src={imageLink(pic)} alt={name} />
        ) : (
          <span className="att-fallback">
            {(name || email || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="att-meta" style={{ flex: 1 }}>
        <div className="att-name line-1">{name}</div>
        <div className="att-sub line-1">{email}</div>
        <div className="att-sub tiny">
          {flagChip(countryKey)}
          {eventId ? (
            <span className="ml-6">
              Event: <EventName id={eventId} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="att-right">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn tiny"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onEdit === "function") onEdit(item);
            }}
            title="Edit"
          >
            Edit
          </button>

          <span className={`pill-verify ${verified ? "ok" : "no"}`}>
            {verified ? "Email verified" : "Unverified"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="att-modal" onClick={onClose}>
      <div className="att-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="att-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function ActorDetails({ actor, refetchActor }) {
  const navigate = useNavigate();
  const id = actor?.data?._id || actor?._id || getId(actor);

  const base = actor?.data || {};
  const A = base.personal || {};
  const B = base.organization || {};
  const T = base.talk || {};
  const I = base.b2bIntent || {};
  const photo = A.profilePic;
  const hasRealPhoto = photo && !isDefaultPhoto(photo);
  const sess = Array.isArray(actor?.sessions) ? actor.sessions : [];
  const eid = base?.id_event || actor?.event?._id || null;

  const goProfile = () => navigate(`/admin/members/speaker/${id}`);
  const goMessage = () => navigate(`/admin/messages?actor=${id}&role=speaker`);

  // Local upload state for modal
  const [localFile, setLocalFile] = React.useState(null);
  const [localPreview, setLocalPreview] = React.useState(null);
  const [uploadErr, setUploadErr] = React.useState(null);
  const [uploadInProgress, setUploadInProgress] = React.useState(false);

  const [uploadActorPhoto] = useUploadActorPhotoMutation();

  React.useEffect(() => {
    return () => {
      if (localPreview) {
        try {
          URL.revokeObjectURL(localPreview);
        } catch {}
      }
    };
  }, [localPreview]);

  const onChooseFile = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) {
      alert("Please select an image (max 5MB).");
      e.target.value = "";
      return;
    }
    setLocalFile(f);
    setLocalPreview(URL.createObjectURL(f));
    setUploadErr(null);
  };

  const onUpload = async () => {
    if (!localFile) return;
    setUploadErr(null);
    setUploadInProgress(true);
    try {
      const realId = id;
      await uploadActorPhoto({ id: realId, file: localFile }).unwrap();
      setLocalFile(null);
      setLocalPreview(null);
      if (typeof refetchActor === "function") refetchActor();
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadErr("Upload failed — check logs");
    } finally {
      setUploadInProgress(false);
    }
  };

  return (
    <div className="att-detail att-detail--with-scroll">
      <div className="att-d-head att-d-head--split">
        <div className="att-d-left">
          <button
            className="att-d-avatar"
            onClick={goProfile}
            title="Open full profile"
            aria-label="Open profile"
          >
            {hasRealPhoto ? (
              <img className="att-d-img" src={imageLink(photo)} alt={A.fullName} />
            ) : (
              <span className="att-fallback">
                {(A.fullName || A.email || "?").slice(0, 1).toUpperCase()}
              </span>
            )}
          </button>

          <div className="att-upload-panel">
            <div className="att-upload-row">
              <label
                className="btn small att-upload-btn"
                htmlFor={`actor-photo-input-${id}`}
              >
                Choose file
              </label>
              <input
                id={`actor-photo-input-${id}`}
                type="file"
                accept="image/*"
                onChange={onChooseFile}
                className="att-upload-input visually-hidden"
              />
            </div>

            {localPreview ? (
              <div className="att-upload-preview">
                <img src={localPreview} alt="preview" />
                <div className="att-upload-actions">
                  <button
                    className="btn"
                    onClick={onUpload}
                    disabled={uploadInProgress}
                  >
                    {uploadInProgress ? "Uploading…" : "Upload"}
                  </button>
                  <button
                    type="button"
                    className="btn ml-4"
                    onClick={() => {
                      setLocalFile(null);
                      setLocalPreview(null);
                      setUploadErr(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {uploadErr && <div className="muted att-upload-error">{uploadErr}</div>}
              </div>
            ) : (
              <div className="att-upload-hint muted">PNG / JPG • max 5MB</div>
            )}
          </div>
        </div>

        <div className="att-d-meta">
          <div className="att-d-top">
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button className="att-d-name linklike" onClick={goProfile} title={A.fullName}>
                {A.fullName || "—"}
              </button>

              <span className={`pill-verify big ${base.verified ? "ok" : "no"}`}>
                {base.verified ? "Email verified" : "Unverified"}
              </span>

              <span className={`pill-status big ${base.adminVerified || "pending"}`}>
                {base.adminVerified || "pending"}
              </span>
            </div>
          </div>

          <div className="att-d-sub att-d-sub--wrap">
            <div className="muted att-d-email">{A.email || "—"}</div>
            <div className="muted att-d-country">
              {flagChip(A.country)} {A.city ? `, ${A.city}` : ""}
            </div>
          </div>

          <div className="att-d-sub">
            <span className="muted">
              Event: <EventName id={eid} fallback="—" />
            </span>
            {actor?.roleKind ? (
              <span className="muted ml-10">
                Role-like: <strong style={{ whiteSpace: "normal" }}>{actor.roleKind}</strong>
              </span>
            ) : null}
          </div>

          <div className="att-d-sub">
            <span className="muted">Created: {dateYMD(base.createdAt)}</span>
          </div>

          <div className="att-d-links">
            {fmtUrl(base?.links?.website) ? (
              <a
                className="linklike mr-8"
                href={fmtUrl(base.links.website)}
                target="_blank"
                rel="noreferrer"
              >
                Website
              </a>
            ) : null}
            {fmtUrl(base?.links?.linkedin) ? (
              <a className="linklike" href={fmtUrl(base.links.linkedin)} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            ) : null}
          </div>

          {!!(A.preferredLanguages || []).length && (
            <div className="att-lang-row">
              {(A.preferredLanguages || []).map((l) => (
                <span key={l} className="pill tiny">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="att-sections att-sections--compact">
        <AttSection title="Talk">
          <KV k="Title" v={T.title} />
          <KV k="Language" v={T.language} />
          <KV k="Category" v={T.topicCategory} />
          <KV k="Abstract" v={T.abstract} />
        </AttSection>

        <AttSection title="Organization & Role">
          <KV k="Organization" v={B.orgName} />
          <KV k="Job Title" v={B.jobTitle} />
        </AttSection>

        <AttSection title="B2B Intent">
          <KV k="Business sector" v={I.businessSector} />
          <KV k="Offering" v={I.offering} />
          <KV k="Looking for" v={I.lookingFor} />
          <KV k="Open to meetings" v={bool(I.openMeetings)} />
          <KV
            k="Regions"
            v={
              Array.isArray(I.regionsInterest)
                ? I.regionsInterest.join(", ")
                : I.regionsInterest
            }
          />
        </AttSection>

        <AttSection title="Sessions">
          {!sess.length ? (
            <div className="muted">No sessions assigned.</div>
          ) : (
            <div className="att-sessions">
              {sess.map((s) => (
                <div key={s._id || s.id} className="sess-row">
                  <div className="sess-title line-1">{s.title || "Untitled"}</div>
                  <div className="sess-sub tiny">
                    <span className="tag">{s.track || "Session"}</span>
                    <span className="sep">•</span>
                    <span>
                      {dateYMD(s.startAt)} {timeHM(s.startAt)}–{timeHM(s.endAt)}
                    </span>
                    {s?.room?.name ? (
                      <>
                        <span className="sep">•</span>
                        <span>{s.room.name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AttSection>
      </div>

      <div className="att-d-actions">
        <button className="btn" onClick={goMessage}>
          Message
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Shared UI ───────────────────────── */

function AttSection({ title, children }) {
  return (
    <div className="att-sec">
      <div className="att-sec-title">{title}</div>
      <div className="att-kv-grid">{children}</div>
    </div>
  );
}
function KV({ k, v }) {
  return (
    <div className="att-kv">
      <div className="att-k">{k}</div>
      <div className="att-v">{v == null || v === "" ? "—" : v}</div>
    </div>
  );
}
function skeletons(n = 8) {
  return Array.from({ length: n }).map((_, i) => (
    <div key={i} className="att-row sk">
      <div className="sk-avatar" />
      <div className="sk-lines">
        <div className="sk-line" />
        <div className="sk-line short" />
      </div>
      <div className="sk-tag" />
    </div>
  ));
}
