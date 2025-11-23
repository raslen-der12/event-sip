// src/pages/NotFound.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiChevronLeft, FiHome, FiSearch } from "react-icons/fi";
import { useTranslate } from "../lib/hooks/useTranslate";

export default function NotFound() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { t } = useTranslate();

  const url = `${pathname || ""}${search || ""}`;

  const baseBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 " +
    "bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm " +
    "hover:bg-slate-50 focus:outline-none focus:ring-2 ring-brand focus:ring-offset-1";

  const ghostBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 " +
    "bg-transparent px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm " +
    "hover:bg-slate-50 focus:outline-none focus:ring-2 ring-brand focus:ring-offset-1";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-transparent " +
    "bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm " +
    "hover:bg-brand-2 focus:outline-none focus:ring-2 ring-brand focus:ring-offset-1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
          <FiAlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {t("system.notFound.title", "404 — Page not found")}
        </h1>

        <p className="mb-2 text-sm text-slate-600">
          {t("system.notFound.description", "We couldn’t find this URL:")}
        </p>

        <p className="text-xs text-slate-500">
          <code className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-700">
            {url}
          </code>
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className={ghostBtn}
            onClick={() => navigate(-1)}
          >
            <FiChevronLeft className="h-4 w-4" />
            <span>{t("actions.back", "Back")}</span>
          </button>

          <Link className={baseBtn} to="/">
            <FiHome className="h-4 w-4" />
            <span>{t("actions.home", "Home")}</span>
          </Link>

          <Link className={primaryBtn} to="/search">
            <FiSearch className="h-4 w-4" />
            <span>{t("actions.search", "Search")}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
