// src/components/event/organizers/EventOrganizers.jsx
import React from "react";
import PropTypes from "prop-types";
import "./organizers.css";
import imageLink from "../../../utils/imageLink";

export default function EventOrganizers({
  heading = "Organizers & Partners",
  subheading = "Hosts, co-hosts, sponsors, partners and media for this event.",
  items = [],
  loading = false,
  error = "",
}) {
  // keep the old data logic in case you ever un-comment it again

  const [tab, setTab] = React.useState("all");

  // Normalize input (keeping it intact for backward compatibility)
  const normalized = Array.isArray(items)
    ? items.map((x, i) => {
        const id = x._id || x.id || `org-${i}`;
        const name = x.name || x.type || "Organization";
        const link = x.link || "";
        const logo = x.logo || "";
        const type = String(x.type || "partner").trim();
        const order = typeof x.order === "number" ? x.order : Number(x.order) || 0;
        return { id, name, link, logo, type, order };
      })
    : [];

  // ⚠️ OLD DESIGN COMMENTED OUT
  // ----------------------------------------------------------
  // return (
  //   <section className="orgs">
  //     <div className="container">
  //       <header className="org-head">
  //         <div className="org-titles">
  //           <h2 className="org-title">{heading}</h2>
  //           {subheading ? <p className="org-sub">{subheading}</p> : null}
  //         </div>
  //
  //         <div className="org-tabs" role="tablist" aria-label="Organizer types">
  //           {tabs.map((t) => (
  //             <button
  //               key={t.key}
  //               role="tab"
  //               aria-selected={tab === t.key}
  //               className={`org-tab ${tab === t.key ? "is-active" : ""}`}
  //               onClick={() => setTab(t.key)}
  //             >
  //               <span className="org-dot" data-type={t.key} />
  //               <span className="org-tab-label">{t.label}</span>
  //               <span className="org-count">{counts[t.key] || 0}</span>
  //             </button>
  //           ))}
  //         </div>
  //       </header>
  //
  //       <div className="org-grid">
  //         {filtered.map((o) => (
  //           <div key={o.id} className="org-card">
  //             <img src={imageLink(o.logo)} alt={o.name} className="org-logo" />
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   </section>
  // );
  // ----------------------------------------------------------

  // ✅ NEW SIMPLE PARTNER SECTION
  return (
    <section className="partners">
      <div className="container text-center">
        <h2 className="partners-title">Our Partners</h2>
        <p className="partners-sub">In collaboration with our trusted partners</p>

        <div className="partners-image-wrapper">
          <img
            src={"https://gits.seketak-eg.com/wp-content/uploads/2025/11/ipdaysxgitsparnets.png"}
            alt="All partners"
            className="partners-image"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

EventOrganizers.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.array,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
