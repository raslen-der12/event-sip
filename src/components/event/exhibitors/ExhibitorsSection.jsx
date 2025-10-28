import React from "react";
import PropTypes from "prop-types";
import ExhibitorCard from "./ExhibitorCard";
import ExhibitorFilters from "./ExhibitorFilters";
import ExhibitorModal from "./ExhibitorModal";
import "./exhibitors.css";
import sampleExhibitors from "./sampleExhibitors";

/**
 * Props:
 *  heading, subheading
 *  items?: array   // if not passed, we fall back to sample data
 *  isLoggedIn?: boolean
 *  onReadMore?: (item) => void
 *  onBook?: (item) => void
 *  onMessage?: (item) => void
 */
export default function ExhibitorsSection({
  heading = "Exhibitors",
  subheading = "Teams showcasing products & services.",
  items,
  isLoggedIn = false,
  onReadMore,
  onBook,
  onMessage,
}) {
  const data = Array.isArray(items) && items.length ? items : sampleExhibitors;

  // Build industries
  const industries = React.useMemo(() => {
    const s = new Set();
    data.forEach(x => x.industry && s.add(x.industry));
    return ["All", ...Array.from(s).sort()];
  }, [data]);

  const [q, setQ] = React.useState("");
  const [ind, setInd] = React.useState("All");
  const [modalItem, setModalItem] = React.useState(null);

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return data.filter(x => {
      const okInd = ind === "All" || x.industry === ind;
      const hay = `${x.orgName||""} ${x.offering||""} ${x.industry||""}`.toLowerCase();
      const okQ = !qq || hay.includes(qq);
      return okInd && okQ;
    });
  }, [data, q, ind]);

  return (
    <section className="exb-wrap">
      <div className="container">
        <header className="exb-head">
          <div className="exb-titles">
            <h2 className="exb-title">{heading}</h2>
            {subheading ? <p className="exb-sub">{subheading}</p> : null}
          </div>
          <ExhibitorFilters
            industries={industries}
            selectedIndustry={ind}
            onIndustryChange={setInd}
            query={q}
            onQueryChange={setQ}
          />
        </header>

        {filtered.length ? (
          <div className="exb-grid">
            {filtered.map((x) => (
              <ExhibitorCard
                key={x.id}
                item={x}
                isLoggedIn={isLoggedIn}
                onReadMore={() => onReadMore ? onReadMore(x) : setModalItem(x)}
                onBook={() => onBook ? onBook(x) : alert("Book meeting: TODO")}
                onMessage={(id) => {
          const href = `/messages?member=${id}`;;
          window.location.assign(href);
        }}
              />
            ))}
          </div>
        ) : (
          <div className="exb-empty">No exhibitors match your filters.</div>
        )}
      </div>

      <ExhibitorModal
        open={!!modalItem}
        item={modalItem}
        onClose={() => setModalItem(null)}
        isLoggedIn={isLoggedIn}
        onBook={() => modalItem && (onBook ? onBook(modalItem) : alert("Book meeting: TODO"))}
        onMessage={(id) => {
          const href = `/chat/new?actorId=${encodeURIComponent(id)}`;
          window.location.assign(href);
        }}
      />
    </section>
  );
}

ExhibitorsSection.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.array,
  isLoggedIn: PropTypes.bool,
  onReadMore: PropTypes.func,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
};
