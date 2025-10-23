
// src/components/admin/dashboard/TopCitiesCard.jsx
import React from "react";
import BarListCard from "./BarListCard";
export default function TopCitiesCard({ data }) {
  return <BarListCard title="Top Cities" data={data} maxItems={10} />;
}
