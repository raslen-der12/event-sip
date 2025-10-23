import React from "react";
import BarListCard from "./BarListCard";

export default function ObjectivesCard({ data }) {
  // expects [{ label:'networking', value: 180 }, ...]
  return <BarListCard title="Top Objectives" data={data} maxItems={8} />;
}
