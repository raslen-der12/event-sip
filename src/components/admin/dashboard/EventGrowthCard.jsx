// src/components/admin/dashboard/EventGrowthCard.jsx
import React from "react";
import BarListCard from "./BarListCard";
export default function EventGrowthCard({ data }) {
  // assumes values are % integers; still renders with absolutes if backend sends raw counts
  return <BarListCard title="Growth (last 30 days)" data={data} maxItems={8} />;
}
