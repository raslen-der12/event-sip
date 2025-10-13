import React from "react";
import PropTypes from "prop-types";
import { FiSearch } from "react-icons/fi";

export default function ExhibitorFilters({
  industries = ["All"],
  selectedIndustry = "All",
  onIndustryChange,
  query = "",
  onQueryChange,
}) {
  return (
    <div className="exb-filters">
      <div className="exb-search">
        <FiSearch />
        <input
          type="text"
          placeholder="Search exhibitors or offerings…"
          value={query}
          onChange={(e) => onQueryChange?.(e.target.value)}
        />
      </div>
      <div className="exb-pills" role="tablist" aria-label="Filter by industry">
        {industries.map((i) => {
          const active = i === selectedIndustry;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={active}
              className={`exb-pill ${active ? "on" : ""}`}
              onClick={() => onIndustryChange?.(i)}
            >
              {i}
            </button>
          );
        })}
      </div>
    </div>
  );
}

ExhibitorFilters.propTypes = {
  industries: PropTypes.array,
  selectedIndustry: PropTypes.string,
  onIndustryChange: PropTypes.func,
  query: PropTypes.string,
  onQueryChange: PropTypes.func,
};
