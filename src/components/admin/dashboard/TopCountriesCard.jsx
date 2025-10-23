// src/components/admin/dashboard/TopCountriesCard.jsx
import React from "react";
import BarListCard from "./BarListCard";
export default function TopCountriesCard({ data }) {
  return <BarListCard title="Top Countries" data={data} maxItems={10} />;
}
