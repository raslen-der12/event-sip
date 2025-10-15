import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./admin.attendees.css";

import {
  useGetActorsListAdminQuery,
  useGetAdminActorQuery,
  useCreateActorMutation,
} from "../../../features/Actor/adminApiSlice";
import { useGetEventsQuery } from "../../../features/events/eventsApiSlice"; // old simple list hook (used for picker)
import imageLink from "../../../utils/imageLink";

export default function AdminAttendees() {
  const navigate = useNavigate();

  // ── Filters / query args (only one of limit or search must be sent)
  const ROLE = "attendee";
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const queryArgs = React.useMemo(() => {
    const s = search.trim();
    if (s) return { role: ROLE, search: s }; // search only
    return { role: ROLE, limit: Number(limit) || 20 }; // limit only
  }, [limit, search]);
  const {
    data: list = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetActorsListAdminQuery(queryArgs);

  // ── Modal (full actor)
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

  // ── Create attendee (now with event picker)
  const [creating, setCreating] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState({
    fullName: "",
    email: "",
    country: "",
    profilePic: "",
    eventId: "",
  });
  const [selectedEvent, setSelectedEvent] = React.useState(null); // {id,name,cover,capMax,capUsed}
  const [eventPickerOpen, setEventPickerOpen] = React.useState(false);
  const [createActor, { isLoading: creatingReq }] = useCreateActorMutation();
  const canCreate =
    createDraft.fullName.trim() &&
    createDraft.email.trim() &&
    createDraft.country.trim();

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    const payload = {
      role: ROLE,
      adminVerified: "yes",
      personal: {
        fullName: createDraft.fullName.trim(),
        email: createDraft.email.trim(),
        country: createDraft.country.trim(),
      },
      eventId: createDraft.eventId || undefined,
    };
    try {
      await createActor(payload).unwrap();
      setCreateDraft({
        fullName: "",
        email: "",
        country: "",
        profilePic: "",
        eventId: "",
      });
      setSelectedEvent(null);
      setCreating(false);
      refetch();
    } catch (err) {
      console.error("Create attendee failed", err);
    }
  };

  // ── Handlers
  const seeMore = () => {
    if (search.trim()) return;
    setLimit((n) => (Number(n) || 20) + 5);
  };
  const onCustomLimit = (n) => {
    if (search.trim()) return;
    const v = Math.max(5, Number(n) || 20);
    setLimit(v);
  };
  const clearSearch = () => setSearch("");

  return (
    
    <div className="att-page">
      {/* Top bar */}
      <div className="att-top card p-10">
        <div className="att-controls">
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
                <button className="btn tiny " onClick={clearSearch}>
                  Clear
                </button>
              ) : null}
            </div>
            <div className="att-hint muted">
              When searching, “Results per page” is disabled.
            </div>
          </div>
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
                See more(+5)
              </button>
            </div>
          </div>
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
          </div>
        </div>

        {/* Inline create form */}
        {creating && (
          <form className="att-create card soft p-10" onSubmit={submitCreate}>
            <div className="att-create-grid">
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
                  value={createDraft.email}
                  onChange={(e) =>
                    setCreateDraft({ ...createDraft, email: e.target.value })
                  }
                />
              </label>
              {/* Country input only (you'll replace with your own select) */}
              <label className="att-field">
                <div className="att-lbl">Country *</div>
                <select
                  className="input"
                  value={createDraft.country}
                  onChange={(e) =>
                    setCreateDraft({ ...createDraft, country: e.target.value })
                  }
                >
                  <option value="">Select country</option>
                  <option value="">— Select country —</option>{" "}
                  <option value="Afghanistan">Afghanistan</option>{" "}
                  <option value="Albania">Albania</option>{" "}
                  <option value="Algeria">Algeria</option>{" "}
                  <option value="Andorra">Andorra</option>{" "}
                  <option value="Angola">Angola</option>{" "}
                  <option value="Antigua and Barbuda">
                    {" "}
                    Antigua and Barbuda{" "}
                  </option>{" "}
                  <option value="Argentina">Argentina</option>{" "}
                  <option value="Armenia">Armenia</option>{" "}
                  <option value="Australia">Australia</option>{" "}
                  <option value="Austria">Austria</option>{" "}
                  <option value="Azerbaijan">Azerbaijan</option>{" "}
                  <option value="Bahamas">Bahamas</option>{" "}
                  <option value="Bahrain">Bahrain</option>{" "}
                  <option value="Bangladesh">Bangladesh</option>{" "}
                  <option value="Barbados">Barbados</option>{" "}
                  <option value="Belarus">Belarus</option>{" "}
                  <option value="Belgium">Belgium</option>{" "}
                  <option value="Belize">Belize</option>{" "}
                  <option value="Benin">Benin</option>{" "}
                  <option value="Bhutan">Bhutan</option>{" "}
                  <option value="Bolivia">Bolivia</option>{" "}
                  <option value="Bosnia and Herzegovina">
                    {" "}
                    Bosnia and Herzegovina{" "}
                  </option>{" "}
                  <option value="Botswana">Botswana</option>{" "}
                  <option value="Brazil">Brazil</option>{" "}
                  <option value="Brunei">Brunei</option>{" "}
                  <option value="Bulgaria">Bulgaria</option>{" "}
                  <option value="Burkina Faso">Burkina Faso</option>{" "}
                  <option value="Burundi">Burundi</option>{" "}
                  <option value="Cabo Verde">Cabo Verde</option>{" "}
                  <option value="Cambodia">Cambodia</option>{" "}
                  <option value="Cameroon">Cameroon</option>{" "}
                  <option value="Canada">Canada</option>{" "}
                  <option value="Central African Republic">
                    {" "}
                    Central African Republic{" "}
                  </option>{" "}
                  <option value="Chad">Chad</option>{" "}
                  <option value="Chile">Chile</option>{" "}
                  <option value="China">China</option>{" "}
                  <option value="Colombia">Colombia</option>{" "}
                  <option value="Comoros">Comoros</option>{" "}
                  <option value="Congo">Congo</option>{" "}
                  <option value="Costa Rica">Costa Rica</option>{" "}
                  <option value="Côte d’Ivoire">Côte d’Ivoire</option>{" "}
                  <option value="Croatia">Croatia</option>{" "}
                  <option value="Cuba">Cuba</option>{" "}
                  <option value="Cyprus">Cyprus</option>{" "}
                  <option value="Czechia">Czechia</option>{" "}
                  <option value="Democratic Republic of the Congo">
                    {" "}
                    Democratic Republic of the Congo{" "}
                  </option>{" "}
                  <option value="Denmark">Denmark</option>{" "}
                  <option value="Djibouti">Djibouti</option>{" "}
                  <option value="Dominica">Dominica</option>{" "}
                  <option value="Dominican Republic">Dominican Republic</option>{" "}
                  <option value="Ecuador">Ecuador</option>{" "}
                  <option value="Egypt">Egypt</option>{" "}
                  <option value="El Salvador">El Salvador</option>{" "}
                  <option value="Equatorial Guinea">Equatorial Guinea</option>{" "}
                  <option value="Eritrea">Eritrea</option>{" "}
                  <option value="Estonia">Estonia</option>{" "}
                  <option value="Eswatini">Eswatini</option>{" "}
                  <option value="Ethiopia">Ethiopia</option>{" "}
                  <option value="Fiji">Fiji</option>{" "}
                  <option value="Finland">Finland</option>{" "}
                  <option value="France">France</option>{" "}
                  <option value="Gabon">Gabon</option>{" "}
                  <option value="Gambia">Gambia</option>{" "}
                  <option value="Georgia">Georgia</option>{" "}
                  <option value="Germany">Germany</option>{" "}
                  <option value="Ghana">Ghana</option>{" "}
                  <option value="Greece">Greece</option>{" "}
                  <option value="Grenada">Grenada</option>{" "}
                  <option value="Guatemala">Guatemala</option>{" "}
                  <option value="Guinea">Guinea</option>{" "}
                  <option value="Guinea-Bissau">Guinea-Bissau</option>{" "}
                  <option value="Guyana">Guyana</option>{" "}
                  <option value="Haiti">Haiti</option>{" "}
                  <option value="Honduras">Honduras</option>{" "}
                  <option value="Hungary">Hungary</option>{" "}
                  <option value="Iceland">Iceland</option>{" "}
                  <option value="India">India</option>{" "}
                  <option value="Indonesia">Indonesia</option>{" "}
                  <option value="Iran">Iran</option>{" "}
                  <option value="Iraq">Iraq</option>{" "}
                  <option value="Ireland">Ireland</option>{" "}
                  <option value="Italy">Italy</option>{" "}
                  <option value="Jamaica">Jamaica</option>{" "}
                  <option value="Japan">Japan</option>{" "}
                  <option value="Jordan">Jordan</option>{" "}
                  <option value="Kazakhstan">Kazakhstan</option>{" "}
                  <option value="Kenya">Kenya</option>{" "}
                  <option value="Kiribati">Kiribati</option>{" "}
                  <option value="Kuwait">Kuwait</option>{" "}
                  <option value="Kyrgyzstan">Kyrgyzstan</option>{" "}
                  <option value="Laos">Laos</option>{" "}
                  <option value="Latvia">Latvia</option>{" "}
                  <option value="Lebanon">Lebanon</option>{" "}
                  <option value="Lesotho">Lesotho</option>{" "}
                  <option value="Liberia">Liberia</option>{" "}
                  <option value="Libya">Libya</option>{" "}
                  <option value="Liechtenstein">Liechtenstein</option>{" "}
                  <option value="Lithuania">Lithuania</option>{" "}
                  <option value="Luxembourg">Luxembourg</option>{" "}
                  <option value="Madagascar">Madagascar</option>{" "}
                  <option value="Malawi">Malawi</option>{" "}
                  <option value="Malaysia">Malaysia</option>{" "}
                  <option value="Maldives">Maldives</option>{" "}
                  <option value="Mali">Mali</option>{" "}
                  <option value="Malta">Malta</option>{" "}
                  <option value="Marshall Islands">Marshall Islands</option>{" "}
                  <option value="Mauritania">Mauritania</option>{" "}
                  <option value="Mauritius">Mauritius</option>{" "}
                  <option value="Mexico">Mexico</option>{" "}
                  <option value="Micronesia">Micronesia</option>{" "}
                  <option value="Moldova">Moldova</option>{" "}
                  <option value="Monaco">Monaco</option>{" "}
                  <option value="Mongolia">Mongolia</option>{" "}
                  <option value="Montenegro">Montenegro</option>{" "}
                  <option value="Morocco">Morocco</option>{" "}
                  <option value="Mozambique">Mozambique</option>{" "}
                  <option value="Myanmar">Myanmar</option>{" "}
                  <option value="Namibia">Namibia</option>{" "}
                  <option value="Nauru">Nauru</option>{" "}
                  <option value="Nepal">Nepal</option>{" "}
                  <option value="Netherlands">Netherlands</option>{" "}
                  <option value="New Zealand">New Zealand</option>{" "}
                  <option value="Nicaragua">Nicaragua</option>{" "}
                  <option value="Niger">Niger</option>{" "}
                  <option value="Nigeria">Nigeria</option>{" "}
                  <option value="North Korea">North Korea</option>{" "}
                  <option value="North Macedonia">North Macedonia</option>{" "}
                  <option value="Norway">Norway</option>{" "}
                  <option value="Oman">Oman</option>{" "}
                  <option value="Pakistan">Pakistan</option>{" "}
                  <option value="Palau">Palau</option>{" "}
                  <option value="Palestine">Palestine</option>{" "}
                  <option value="Panama">Panama</option>{" "}
                  <option value="Papua New Guinea">Papua New Guinea</option>{" "}
                  <option value="Paraguay">Paraguay</option>{" "}
                  <option value="Peru">Peru</option>{" "}
                  <option value="Philippines">Philippines</option>{" "}
                  <option value="Poland">Poland</option>{" "}
                  <option value="Portugal">Portugal</option>{" "}
                  <option value="Qatar">Qatar</option>{" "}
                  <option value="Romania">Romania</option>{" "}
                  <option value="Russia">Russia</option>{" "}
                  <option value="Rwanda">Rwanda</option>{" "}
                  <option value="Saint Kitts and Nevis">
                    {" "}
                    Saint Kitts and Nevis{" "}
                  </option>{" "}
                  <option value="Saint Lucia">Saint Lucia</option>{" "}
                  <option value="Saint Vincent and the Grenadines">
                    {" "}
                    Saint Vincent and the Grenadines{" "}
                  </option>{" "}
                  <option value="Samoa">Samoa</option>{" "}
                  <option value="San Marino">San Marino</option>{" "}
                  <option value="São Tomé and Príncipe">
                    {" "}
                    São Tomé and Príncipe{" "}
                  </option>{" "}
                  <option value="Saudi Arabia">Saudi Arabia</option>{" "}
                  <option value="Senegal">Senegal</option>{" "}
                  <option value="Serbia">Serbia</option>{" "}
                  <option value="Seychelles">Seychelles</option>{" "}
                  <option value="Sierra Leone">Sierra Leone</option>{" "}
                  <option value="Singapore">Singapore</option>{" "}
                  <option value="Slovakia">Slovakia</option>{" "}
                  <option value="Slovenia">Slovenia</option>{" "}
                  <option value="Solomon Islands">Solomon Islands</option>{" "}
                  <option value="Somalia">Somalia</option>{" "}
                  <option value="South Africa">South Africa</option>{" "}
                  <option value="South Korea">South Korea</option>{" "}
                  <option value="South Sudan">South Sudan</option>{" "}
                  <option value="Spain">Spain</option>{" "}
                  <option value="Sri Lanka">Sri Lanka</option>{" "}
                  <option value="Sudan">Sudan</option>{" "}
                  <option value="Suriname">Suriname</option>{" "}
                  <option value="Sweden">Sweden</option>{" "}
                  <option value="Switzerland">Switzerland</option>{" "}
                  <option value="Syria">Syria</option>{" "}
                  <option value="Tajikistan">Tajikistan</option>{" "}
                  <option value="Tanzania">Tanzania</option>{" "}
                  <option value="Thailand">Thailand</option>{" "}
                  <option value="Timor-Leste">Timor-Leste</option>{" "}
                  <option value="Togo">Togo</option>{" "}
                  <option value="Tonga">Tonga</option>{" "}
                  <option value="Trinidad and Tobago">
                    {" "}
                    Trinidad and Tobago{" "}
                  </option>{" "}
                  <option value="Tunisia">Tunisia</option>{" "}
                  <option value="Türkiye">Türkiye</option>{" "}
                  <option value="Turkmenistan">Turkmenistan</option>{" "}
                  <option value="Tuvalu">Tuvalu</option>{" "}
                  <option value="Uganda">Uganda</option>{" "}
                  <option value="Ukraine">Ukraine</option>{" "}
                  <option value="United Arab Emirates">
                    {" "}
                    United Arab Emirates{" "}
                  </option>{" "}
                  <option value="United Kingdom">United Kingdom</option>{" "}
                  <option value="United States">United States</option>{" "}
                  <option value="Uruguay">Uruguay</option>{" "}
                  <option value="Uzbekistan">Uzbekistan</option>{" "}
                  <option value="Vanuatu">Vanuatu</option>{" "}
                  <option value="Vatican City">Vatican City</option>{" "}
                  <option value="Venezuela">Venezuela</option>{" "}
                  <option value="Vietnam">Vietnam</option>{" "}
                  <option value="Yemen">Yemen</option>{" "}
                  <option value="Zambia">Zambia</option>{" "}
                  <option value="Zimbabwe">Zimbabwe</option>
                </select>
              </label>

              {/* Event selector row */}
              <div className="att-field">
                <div className="att-lbl">Event (optional)</div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn tiny"
                    onClick={() => setEventPickerOpen(true)}
                  >
                    Select event
                  </button>
                  {selectedEvent ? (
                    <button
                      type="button"
                      className="pill-status yes"
                      onClick={() => {
                        setSelectedEvent(null);
                        setCreateDraft({ ...createDraft, eventId: "" });
                      }}
                      title="Clear selected event"
                    >
                      {truncate(selectedEvent.name, 40)} •{" "}
                      
                    </button>
                  ) : (
                    <span className="muted">No event selected</span>
                  )}
                </div>
              </div>

              <div className="att-create-actions">
                <button
                  className="btn brand"
                  disabled={!canCreate || creatingReq}
                >
                  {creatingReq ? "Creating…" : "Create"}
                </button>
              </div>
            </div>
            <div className="att-hint muted">
              Actor will be created with <b>role: attendee</b> and{" "}
              <b>adminVerified: yes</b>.
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
          </div>
        </div>
        <div className="att-grid">
          {isLoading && !list.length ? (
            skeletons(12)
          ) : list.length ? (
            list.map((it) => (
              <AttendeeRow
                key={getId(it)}
                item={it}
                onOpen={() => openModal(getId(it))}
              />
            ))
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

      {/* Event Picker Modal */}
      {eventPickerOpen && (
        <Modal onClose={() => setEventPickerOpen(false)}>
          <EventPicker
            onPick={(evt) => {
              setSelectedEvent(evt);
              setCreateDraft({ ...createDraft, eventId: evt.id });
              setEventPickerOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────── Components ───────────────────────── */

function AttendeeRow({ item, onOpen }) {
  const name = item?.personal?.fullName || item?.name || "—";
  const email = item?.personal?.email || item?.email || "—";
  const country = item?.personal?.country || item?.country || "—";
  const pic = item?.personal?.profilePic || item?.profilePic;
  const verified = !!(item?.verified ?? item?.verifiedEmail);
  return (
    <button className="att-row" onClick={onOpen} title="Open">
      <div className="att-avatar">
        {pic ? (
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
        <div className="att-sub tiny">{country}</div>
      </div>
      <div className="att-right">
        <span className={`pill-verify ${verified ? "ok" : "no"}`}>
          {verified ? "Email verified" : "Unverified"}
        </span>
      </div>
    </button>
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
  const id = getId(actor);
  const A = actor.personal || {},
    B = actor.organization || {},
    C = actor.businessProfile || {},
    D = actor.matchingIntent || {},
    E = actor.matchingAids || {},
    M = actor.matchingMeta || {};
  const photo = A.profilePic;
  const goProfile = () => navigate(`/admin/members/attendee/${id}`);
  const goMessage = () =>
    navigate(`/admin/messages?actor=${id}&role=attendee`);
  return (
    <div className="att-detail">
      <div className="att-d-head">
        <button
          className="att-d-avatar"
          onClick={goProfile}
          title="Open full profile"
        >
          {photo ? (
            <img
              className="att-d-img"
              src={imageLink(photo)}
              alt={A.fullName}
            />
          ) : (
            <span className="att-fallback">
              {(A.fullName || A.email || "?").slice(0, 1).toUpperCase()}
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
            <span className={`pill-verify big ${actor.verified ? "ok" : "no"}`}>
              {actor.verified ? "Email verified" : "Unverified"}
            </span>
            <span
              className={`pill-status big ${actor.adminVerified || "pending"}`}
            >
              {actor.adminVerified || "pending"}
            </span>
          </div>
          <div className="att-d-sub">
            <span className="muted">{A.email || "—"}</span>
            <span className="muted">
              {A.country || "—"}
              {A.city ? `, ${A.city}` : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="att-sections">
        <AttSection title="Organization & Role">
          <KV k="Organization" v={B.orgName} />
          <KV k="Website" v={B.orgWebsite} />
          <KV k="Role" v={B.businessRole} />
          <KV k="Department" v={B.department} />
          <KV k="Decision maker" v={bool(B.decisionMaker)} />
        </AttSection>
        <AttSection title="Business Profile">
          <KV k="Primary industry" v={C.primaryIndustry} />
          <KV k="Sub-industry" v={C.subIndustry} />
          <KV k="Model" v={C.businessModel} />
          <KV k="Company size" v={C.companySize} />
          <KV k="Export ready" v={bool(C.exportReady)} />
        </AttSection>
        <AttSection title="Matching Intent">
          <KV k="Objectives" v={(D.objectives || []).join(", ")} />
          <KV k="Offering" v={D.offering} />
          <KV k="Needs" v={D.needs} />
          <KV k="Open to meetings" v={bool(D.openToMeetings)} />
          <KV k="Meeting slots" v={(D.meetingSlots || []).join(", ")} />
        </AttSection>
        <AttSection title="Matching Aids">
          <KV k="Tags" v={(E.tags || []).join(", ")} />
          <KV k="Preferences" v={(E.matchPrefs || []).join(", ")} />
          <KV k="Regions" v={(E.regions || []).join(", ")} />
          <KV k="Language" v={E.language} />
          <KV k="Allow contact" v={bool(E.allowContact)} />
        </AttSection>
        <AttSection title="Matching Meta">
          <KV k="Match score" v={num(M.matchScore)} />
          <KV k="Engagement" v={num(M.engagementScore)} />
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

/* ───────────────────────── Event Picker ───────────────────────── */

function EventPicker({ onPick }) {
  // Old hook for simple list of events
  const { data: events = [], isFetching } = useGetEventsQuery(); // no args -> simple list
  return (
    <div className="evt-picker">
      <div className="att-list-head" style={{ marginBottom: 8 }}>
        <h3 className="att-title">Select an event</h3>
        <div className="muted">
          {isFetching ? "Loading…" : `${events.length || 0} events`}
        </div>
      </div>
      <div className="evt-grid">
        {!events || !events.length ? (
          <div className="muted">No events.</div>
        ) : (
          events?.map((e) => {
            const card = toEventCard(e);
            return (
              <button
                key={card.id}
                className="evt-card"
                onClick={() => onPick(card)}
                title={card.name}
              >
                <div className="evt-cover">
                  {card.cover ? (
                    <img
                      className="evt-img"
                      src={imageLink(card.cover)}
                      alt={card.name}
                    />
                  ) : (
                    <div className="evt-cover-fallback">No cover</div>
                  )}
                </div>
                <div className="evt-meta">
                  <div className="evt-name line-1">{card.name}</div>
                  <div className="evt-cap">
                    {card.capUsed ?? "—"} / {card.capMax ?? "—"} capacity
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function toEventCard(e) {
  const id = e?._id || e?.id || "";
  const name = e?.title || e?.name || e?.eventName || "Untitled event";
  const cover =
    e?.cover ||
    e?.coverImage ||
    e?.mainPhoto ||
    e?.photo ||
    (Array.isArray(e?.gallery) ? e.gallery[0]?.url : "");
  const capMax =
    (e?.capacity && (e.capacity.max ?? e.capacity)) ??
    e?.tickets?.capacity ??
    e?.stats?.capacity?.max ??
    null;
  const capUsed =
    (e?.capacity && (e.capacity.occupied ?? e.occupied)) ??
    e?.tickets?.sold ??
    e?.stats?.attendees ??
    null;
  return { id, name, cover, capMax, capUsed };
}
function getId(x) {
  return x?._id || x?.id || String(x?.email || "") + String(x?.createdAt || "");
}
function bool(v) {
  return v == null ? "—" : v ? "Yes" : "No";
}
function num(n) {
  return n == null ? "—" : String(n);
}
function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

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
