// src/pages/Unauthorized.jsx
import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiLock, FiChevronLeft, FiHome, FiLogIn } from "react-icons/fi";
import { useTranslate } from "../lib/hooks/useTranslate";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { t } = useTranslate();

  const requestedPath = state?.from?.pathname || "";

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
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <FiLock className="h-7 w-7" />
        </div>

        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {t("system.unauthorized.title", "Access denied")}
        </h1>

        <p className="mb-2 text-sm text-slate-600">
          {t(
            "system.unauthorized.description",
            "You don’t have permission to view this page."
          )}
        </p>

        {requestedPath ? (
          <p className="text-xs text-slate-500">
            {t("system.unauthorized.requestedLabel", "Requested:")}{" "}
            <code className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-700">
              {requestedPath}
            </code>
          </p>
        ) : null}

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

          <Link className={primaryBtn} to="/login">
            <FiLogIn className="h-4 w-4" />
            <span>{t("actions.login", "Log in")}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
