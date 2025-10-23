import React from "react";
import BarListCard from "./BarListCard";
export default function TopOrgsCard({ data }) {
  return <BarListCard title="Top Organizations" data={data} maxItems={6} />;
}