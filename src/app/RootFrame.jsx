import React from "react";
import { Outlet } from "react-router-dom";
import GlobalPageLoader from "./GlobalPageLoader";

export default function RootFrame() {
  return (
    <>
      <GlobalPageLoader /> {/* now inside router context */}
      <Outlet />
    </>
  );
}
