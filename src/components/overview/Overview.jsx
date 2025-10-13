import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import PillTabs from "./PillTabs";
import FeatureCard from "./FeatureCard";
import "./overview.css";

/* tiny inline icons */
const IcUsers = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor"/><path d="M2 20c0-3 3-5 6-5" stroke="currentColor"/><circle cx="17" cy="10" r="3" stroke="currentColor"/><path d="M12 20c0-2.5 2.5-4.5 5-4.5" stroke="currentColor"/></svg>);
const IcMic   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor"/></svg>);
const IcStar  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z" stroke="currentColor"/></svg>);
const IcGear  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor"/><path d="M19 12a7 7 0 0 0-.2-1.6l2.1-1.6-2-3.5-2.5 1a7 7 0 0 0-2.7-1.2l-.4-2.7h-4l-.4 2.7A7 7 0 0 0 7.4 6.3l-2.5-1-2 3.5 2.1 1.6A7 7 0 0 0 4.9 12c0 .5.07 1.07.2 1.6l-2.1 1.6 2 3.5 2.5-1a7 7 0 0 0 2.7 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2.7-1.2l2.5 1 2-3.5-2.1-1.6c.13-.53.2-1.06.2-1.6z" stroke="currentColor"/></svg>);

export default function Overview({ heading, subheading, tabs, featuresByTab }) {
  const [activeId, setActiveId] = useState(tabs?.[0]?.id);
  const features = useMemo(() => featuresByTab?.[activeId] ?? [], [featuresByTab, activeId]);

  return (
    <section className="overview">
      {/* subtle bg shapes */}
      <div className="ov-bg" aria-hidden="true" />
      <div className="container">
        <header className="ov-head">
          <h2 className="ov-title">{heading}</h2>
          {subheading ? <p className="ov-sub">{subheading}</p> : null}
        </header>

        <PillTabs
          tabs={tabs.map(t => ({
            ...t,
            icon:
              t.icon === "users" ? <IcUsers /> :
              t.icon === "mic"   ? <IcMic />   :
              t.icon === "star"  ? <IcStar />  :
              t.icon === "gear"  ? <IcGear />  : null
          }))}
          defaultActiveId={activeId}
          onChange={setActiveId}
        />

        <div className="features-grid">
          {features.map((f, i) => (
            <FeatureCard
              key={`${f.title}-${i}`}
              icon={
                f.icon === "users" ? <IcUsers /> :
                f.icon === "mic"   ? <IcMic />   :
                f.icon === "star"  ? <IcStar />  :
                f.icon === "gear"  ? <IcGear />  : null
              }
              title={f.title}
              desc={f.desc}
              bullets={f.bullets}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

Overview.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, icon: PropTypes.string })
  ).isRequired,
  featuresByTab: PropTypes.object.isRequired,
};
