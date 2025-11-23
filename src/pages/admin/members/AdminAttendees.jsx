// src/pages/admin/members/AdminAttendees.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./admin.attendees.css";
import SessionPicker from "../../../components/admin/SessionPicker";
import {
  useGetActorsListAdminQuery,
  useGetAdminActorQuery,
  useCreateActorMutation,
  useSetAttendeesVirtualMutation,
} from "../../../features/Actor/adminApiSlice";
import {
  useGetEventsQuery,
  useGetEventQuery, // used to resolve event name by id
} from "../../../features/events/eventsApiSlice";
import { useGetEventSessionsQuery } from "../../../features/events/scheduleApiSlice";
import imageLink from "../../../utils/imageLink";

/* ───────────────────────── i18n-iso-countries setup ───────────────────────── */
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// Register locale once (top-level)
countries.registerLocale(enLocale);

// Build an array of { code, name } sorted by name.
const ALL_COUNTRIES = Object.entries(
  countries.getNames("en", { select: "official" })
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ───────────────────────── Helpers / constants ───────────────────────── */

const ROLE = "attendee";

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
      <ReactCountryFlag
        svg
        countryCode={alpha2}
        style={{ fontSize: "1em" }}
      />
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

export default function AdminAttendees() {
  const navigate = useNavigate();

  // Filters: search | limit | eventId
  const [search, setSearch] = React.useState("");
  const [limit, setLimit] = React.useState(20);
  const [eventFilterId, setEventFilterId] = React.useState("");

  const { data: events = [] } = useGetEventsQuery();

  const eventsArr = React.useMemo(() => {
    if (Array.isArray(events)) return events;
    if (Array.isArray(events?.data)) return events.data;
    if (Array.isArray(events?.data?.data)) return events.data.data;
    return [];
  }, [events]);

  const listArgs = React.useMemo(() => {
    const base = { role: ROLE };
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

  const [selectedIds, setSelectedIds] = React.useState([]);
  const [setAttendeesVirtual, { isLoading: savingVirtual }] =
    useSetAttendeesVirtualMutation();

  const toggleSelected = React.useCallback((id) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = React.useCallback(() => setSelectedIds([]), []);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [search, limit, eventFilterId]);

  // IDs on current page (for "select all" behaviour)
  const allOnPageIds = Array.isArray(list)
    ? list.map((it) => getId(it)).filter(Boolean)
    : [];
  const allSelectedOnPage =
    allOnPageIds.length > 0 &&
    allOnPageIds.every((id) => selectedIds.includes(id));

  const onToggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      if (allSelectedOnPage) {
        // unselect all on this page
        return prev.filter((id) => !allOnPageIds.includes(id));
      }
      // add all on this page
      const s = new Set(prev);
      allOnPageIds.forEach((id) => s.add(id));
      return Array.from(s);
    });
  };

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
  }, [searchParams, activeId]);

  const { data: actor, isFetching: fetchingActor } = useGetAdminActorQuery(
    activeId ? activeId : null,
    { skip: !activeId }
  );

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

  /* ── Create attendee (expanded form area + sessions assignment) */
  const [creating, setCreating] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState({
    fullName: "",
    email: "",
    country: "",
    eventId: "",
    sessionIds: [],
  });
  const [roleKind, setRoleKind] = React.useState("");

  const { data: sessionsPack, isFetching: fetchingSessions } =
    useGetEventSessionsQuery(
      createDraft.eventId
        ? { eventId: createDraft.eventId, track: "", includeCounts: 1 }
        : undefined,
      { skip: !createDraft.eventId }
    );

  const cleanSessions = React.useMemo(() => {
    const raw =
      sessionsPack?.data || sessionsPack?.sessions || sessionsPack || [];
    return (Array.isArray(raw) ? raw : []).filter(
      (s) => String(s?.track || "").trim().toLowerCase() !== "formation"
    );
  }, [sessionsPack]);

  const pickerSessions = React.useMemo(() => {
    return cleanSessions.map((s) => {
      const start =
        s.startAt || s.startTime || s.start || s.startsAt || null;
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
      const has = prev.sessionIds.includes(id);
      return {
        ...prev,
        sessionIds: has
          ? prev.sessionIds.filter((x) => x !== id)
          : [...prev.sessionIds, id],
      };
    });
  };

  const canCreate =
    createDraft.fullName.trim() &&
    createDraft.email.trim() &&
    createDraft.country.trim() &&
    createDraft.eventId &&
    createDraft.sessionIds.length > 0;

  const [createActor, { isLoading: creatingReq }] = useCreateActorMutation();

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    const payload = {
      role: ROLE,
      eventId: createDraft.eventId,
      roleKind: roleKind || undefined,
      personal: {
        fullName: createDraft.fullName.trim(),
        email: createDraft.email.trim(),
        country: createDraft.country.trim().toUpperCase(),
      },
      sessionIds: createDraft.sessionIds,
    };
    try {
      await createActor(payload).unwrap();
      setCreating(false);
      setCreateDraft({
        fullName: "",
        email: "",
        country: "",
        eventId: "",
        sessionIds: [],
      });
      setRoleKind("");
      refetch();
    } catch (err) {
      console.error("Create attendee failed:", err);
      alert(err?.data?.message || "Create failed");
    }
  };

  /* Top-bar actions */
  const seeMore = () => {
    if (search.trim()) return;
    setLimit((n) => (Number(n) || 20) + 5);
  };

  const clearSearchTop = () => setSearch("");

  const onCustomLimit = (n) => {
    if (search.trim()) return;
    setLimit(Math.max(5, Number(n) || 20));
  };

  const onMakeSelectedVirtual = async () => {
    if (!selectedIds.length) return;
    try {
      const payload = {
        attendeeIds: selectedIds,
        virtual: true,
      };
      if (eventFilterId) payload.eventId = eventFilterId;
      await setAttendeesVirtual(payload).unwrap();
      clearSelection();
      refetch();
    } catch (err) {
      console.error("setAttendeesVirtual (selected) failed:", err);
      alert(
        err?.data?.message ||
          "Failed to update virtual status for selected attendees"
      );
    }
  };

  // ALWAYS works:
  // - if eventFilterId set: all attendees of that event
  // - else: all attendees currently shown on this page
  const onMakeAllVirtual = async () => {
    try {
      const payload = { virtual: true };
      if (eventFilterId) {
        payload.eventId = eventFilterId;
      } else {
        if (!allOnPageIds.length) {
          alert("No attendees on this page.");
          return;
        }
        payload.attendeeIds = allOnPageIds;
      }
      await setAttendeesVirtual(payload).unwrap();
      clearSelection();
      refetch();
    } catch (err) {
      console.error("setAttendeesVirtual (all) failed:", err);
      alert(
        err?.data?.message ||
          "Failed to update virtual status for attendees"
      );
    }
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
                <button className="btn tiny" onClick={clearSearchTop}>
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
              title="Filter attendees by event"
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
              Shows only attendees registered to the selected event.
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
              onClick={() => setCreating((v) => !v)}
            >
              {creating ? "Close form" : "Create attendee"}
            </button>
            <button
              className="btn tiny ml-4"
              onClick={onToggleSelectAllPage}
              disabled={!allOnPageIds.length}
              title="Toggle selection for all attendees on this page"
            >
              {allSelectedOnPage ? "Unselect page" : "Select page"}
            </button>
            <button
              className="btn tiny ml-4"
              onClick={onMakeSelectedVirtual}
              disabled={!selectedIds.length || savingVirtual}
              title={
                selectedIds.length
                  ? "Mark selected attendees as virtual"
                  : "Select attendees from the list first"
              }
            >
              {savingVirtual
                ? "Saving…"
                : `Set ${selectedIds.length || ""} selected virtual`}
            </button>
            <button
              className="btn tiny ml-4"
              onClick={onMakeAllVirtual}
              disabled={savingVirtual}
              title="Mark all attendees (in event or current page) as virtual"
            >
              {savingVirtual ? "Saving…" : "Set all in event virtual"}
            </button>
          </div>
        </div>

        {/* Create form */}
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
                      setCreateDraft({
                        ...createDraft,
                        fullName: e.target.value,
                      })
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
                      setCreateDraft({
                        ...createDraft,
                        email: e.target.value,
                      })
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
                        setCreateDraft({
                          ...createDraft,
                          country: e.target.value,
                        })
                      }
                    >
                      <option value="">— Select —</option>
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <div className="flag-preview">
                      {flagChip(createDraft.country)}
                    </div>
                  </div>
                </label>

                <label className="att-field">
                  <div className="att-lbl">Role-like (optional)</div>
                  <select
                    className="input"
                    value={roleKind}
                    onChange={(e) => setRoleKind(e.target.value)}
                    title="Assign a role-kind (Business Owner, Investor, …)"
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
                    Sessions list will load after selecting the event.
                    “Formation” track is excluded.
                  </div>
                </label>
              </div>

              {/* Right column: sessions */}
              <div className="att-col">
                <div className="att-lbl">
                  Assign sessions * (at least 1)
                </div>
                {!createDraft.eventId ? (
                  <div className="muted">
                    Select an event to load sessions.
                  </div>
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
                        const has = prev.sessionIds
                          .map(String)
                          .includes(id);
                        return {
                          ...prev,
                          sessionIds: has
                            ? prev.sessionIds.filter(
                                (x) => String(x) !== id
                              )
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
                className="btn brand"
                disabled={!canCreate || creatingReq}
              >
                {creatingReq ? "Creating…" : "Create attendee"}
              </button>
              <span className="att-hint muted ml-8">
                The attendee will receive the same styled email as registration,
                with their selected sessions attached in a PDF.
              </span>
            </div>
          </form>
        )}
      </div>

      {/* List */}
      <section className="att-list card p-10">
        <div className="att-list-head">
          <h3 className="att-title">Attendees</h3>
          <div className="muted">
            {search ? "Search results" : `Showing up to ${limit}`}
            {eventFilterId ? " • filtered by event" : ""}
          </div>
        </div>

        <div className="att-grid">
          {isLoading && !list.length ? (
            skeletons(12)
          ) : list.length ? (
            list.map((it) => {
              const id = getId(it);
              return (
                <AttendeeRow
                  key={id}
                  item={it}
                  onOpen={() => openModal(id)}
                  selected={selectedIds.includes(id)}
                  onToggleSelect={() => toggleSelected(id)}
                />
              );
            })
          ) : (
            <div className="muted">No attendees.</div>
          )}
        </div>
      </section>

      {/* Actor Modal */}
      {modalOpen && (
        <Modal onClose={closeModal}>
          {!actor || fetchingActor ? (
            <div className="muted">Loading actor…</div>
          ) : (
            <ActorDetails actor={actor} />
          )}
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────── Small components ───────────────────────── */

function AttendeeRow({ item, onOpen, selected, onToggleSelect }) {
  const name = item?.personal?.fullName || item?.name || "—";
  const email = item?.personal?.email || item?.email || "—";
  const countryKey =
    (item?.personal && item.personal.country) || item?.country || "";
  const pic = item?.personal?.profilePic || item?.profilePic;
  const verified = !!(item?.verified ?? item?.verifiedEmail);
  const eventId = item?.id_event || item?.eventId || item?.event?._id;

  return (
    <div className="att-row" onClick={onOpen} title="Open" role="button">
      <div className="att-avatar">
        {pic && !isDefaultPhoto(pic) ? (
          <img className="att-img" src={imageLink(pic)} alt={name} />
        ) : (
          <span className="att-fallback">
            {(name || email || "?").slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
      <div className="att-meta">
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
        <input
          type="checkbox"
          checked={!!selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect && onToggleSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select attendee"
        />
        <span className={`pill-verify ${verified ? "ok" : "no"}`}>
          {verified ? "Email verified" : "Unverified"}
        </span>
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

function ActorDetails({ actor }) {
  const navigate = useNavigate();

  const id = actor?.data?._id || actor?._id || getId(actor);

  const base = actor?.data || {};
  const A = base.personal || {};
  const B = base.organization || {};
  const C = base.businessProfile || {};
  const D = base.matchingIntent || {};

  const photo = A.profilePic;
  const hasRealPhoto = photo && !isDefaultPhoto(photo);

  const sess = Array.isArray(actor?.sessions) ? actor.sessions : [];
  const eid = base?.id_event || actor?.event?._id || null;

  const goProfile = () => navigate(`/admin/members/attendee/${id}`);
  const goMessage = () =>
    navigate(`/admin/messages?actor=${id}&role=attendee`);

  const websiteUrl = fmtUrl(base?.links?.website);
  const linkedinUrl = fmtUrl(base?.links?.linkedin);

  return (
    <div className="att-detail">
      <div className="att-d-head">
        <button
          className="att-d-avatar"
          onClick={goProfile}
          title="Open full profile"
        >
          {hasRealPhoto ? (
            <img
              className="att-d-img"
              src={imageLink(photo)}
              alt={A.fullName}
            />
          ) : (
            <span className="att-fallback">
              {(A.fullName || A.email || "?")
                .slice(0, 1)
                .toUpperCase()}
            </span>
          )}
        </button>
        <div className="att-d-meta">
          <div className="att-d-top">
            <button
              className="att-d-name linklike"
              onClick={goProfile}
              title={A.fullName}
            >
              {A.fullName || "—"}
            </button>

            <span
              className={`pill-verify big ${
                base.verified ? "ok" : "no"
              }`}
            >
              {base.verified ? "Email verified" : "Unverified"}
            </span>

            <span
              className={`pill-status big ${
                base.adminVerified || "pending"
              }`}
            >
              {base.adminVerified || "pending"}
            </span>
          </div>

          <div className="att-d-sub">
            <span className="muted">{A.email || "—"}</span>
            <span className="muted">
              {flagChip(A.country)} {A.city ? `, ${A.city}` : ""}
            </span>
          </div>

          <div className="att-d-sub">
            <span className="muted">
              Event: <EventName id={eid} fallback="—" />
            </span>
            {actor?.roleKind ? (
              <span className="muted ml-10">
                Role-like: {actor.roleKind}
              </span>
            ) : null}
          </div>

          <div className="att-d-sub">
            <span className="muted">
              Created: {dateYMD(base.createdAt)}
            </span>
          </div>

          <div className="att-d-links">
            {websiteUrl ? (
              <a
                className="linklike mr-8"
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Website
              </a>
            ) : null}
            {linkedinUrl ? (
              <a
                className="linklike"
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
              >
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

      <div className="att-sections">
        <AttSection title="Organization & Role">
          <KV k="Organization" v={B.orgName} />
          <KV k="Job Title" v={B.jobTitle} />
          <KV k="Actor Type" v={base.actorType} />
          <KV k="Role-like" v={actor?.roleKind} />
          <KV k="Headline" v={base.actorHeadline} />
        </AttSection>

        <AttSection title="Business Profile">
          <KV k="Primary industry" v={C.primaryIndustry} />
          <KV k="Model" v={C.businessModel} />
          <KV k="Company size" v={C.companySize} />
        </AttSection>

        <AttSection title="Matching Intent">
          <KV k="Objectives" v={(D.objectives || []).join(", ")} />
          <KV k="Open to meetings" v={bool(D.openToMeetings)} />
        </AttSection>

        <AttSection title="Sessions">
          {!sess.length ? (
            <div className="muted">No sessions assigned.</div>
          ) : (
            <div className="att-sessions">
              {sess.map((s) => (
                <div key={s._id || s.id} className="sess-row">
                  <div className="sess-title line-1">
                    {s.title || "Untitled"}
                  </div>
                  <div className="sess-sub tiny">
                    <span className="tag">
                      {s.track || "Session"}
                    </span>
                    <span className="sep">•</span>
                    <span>
                      {dateYMD(s.startAt)} {timeHM(s.startAt)}–
                      {timeHM(s.endAt)}
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
      <div className="att-v">
        {v == null || v === "" ? "—" : v}
      </div>
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
