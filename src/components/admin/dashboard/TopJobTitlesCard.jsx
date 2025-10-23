import React from "react";
import BarListCard from "./BarListCard";
export default function TopJobTitlesCard({ data }) {
  return <BarListCard title="Top Job Titles" data={data} maxItems={6} />;
}