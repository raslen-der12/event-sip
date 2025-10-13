import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  FiTrendingUp,   // innovation
  FiShield,       // sustainability (policy/guard)
  FiCheckCircle,  // booleans
  FiX,            // negative boolean
  FiDollarSign,   // investment range
  FiFileText,     // brochure generic
  FiExternalLink, // open brochure
} from "react-icons/fi";
import "./pp-brochure-preview.css";

/**
 * Public Profile – Exhibitor: Value Adds + Brochure Preview (READ-ONLY)
 *
 * Props:
 *  - valueAdds?: {
 *      innovationFocus: 'Yes' | 'No' | 'Moderate',
 *      sustainabilityFocus: 'Yes' | 'No' | 'Relevant',
 *      investmentSeeking?: boolean,
 *      investmentRange?: number,
 *      productBrochure?: string
 *    }
 *  - identity?: { exhibitorName?: string, orgName?: string }
 *  - className?: string
 */
export default function PPBrochurePreview({
  valueAdds = {},
  identity = {},
  className = "",
}) {
  const {
    innovationFocus,
    sustainabilityFocus,
    investmentSeeking,
    investmentRange,
    productBrochure,
  } = valueAdds || {};

  const orgTitle =
    identity?.exhibitorName || identity?.orgName || "Exhibitor";

  const brochure = useMemo(() => {
    const url = (productBrochure || "").trim();
    if (!url) return { url: "", kind: "none" };
    const lower = url.toLowerCase();
    if (/\.(pdf)(\?|#|$)/.test(lower)) return { url, kind: "pdf" };
    if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/.test(lower))
      return { url, kind: "image" };
    return { url, kind: "link" };
  }, [productBrochure]);

  return (
    <section className={`ppbr ${className}`}>
      <header className="ppbr-head">
        <div className="ppbr-title">
          <span className="ppbr-ico"><FiTrendingUp /></span>
          <h3>Value Adds &amp; Brochure</h3>
        </div>
      </header>

      <div className="ppbr-grid">
        {/* LEFT: long text details */}
        <div className="ppbr-details">
          <DetailRow
            icon={<FiTrendingUp />}
            label="Innovation focus"
            value={safeText(innovationFocus)}
          />
          <DetailRow
            icon={<FiShield />}
            label="Sustainability focus"
            value={safeText(sustainabilityFocus)}
          />
          <DetailRow
            icon={investmentSeeking ? <FiCheckCircle /> : <FiX />}
            label="Seeking investment"
            value={boolToText(investmentSeeking)}
            badge={investmentSeeking ? "Yes" : "No"}
            badgeTone={investmentSeeking ? "ok" : "muted"}
          />
          <DetailRow
            icon={<FiDollarSign />}
            label="Investment range"
            value={
              typeof investmentRange === "number"
                ? formatCurrency(investmentRange)
                : "—"
            }
          />

          {/* Long-text paragraph slot (keeps style if server later adds text fields) */}
          <div className="ppbr-par">
            <p title={orgTitle}>
              {orgTitle}’s value-adds summarize their innovation &amp;
              sustainability posture and whether they’re currently exploring
              capital. Figures and files are provided by the exhibitor.
            </p>
          </div>
        </div>

        {/* RIGHT: brochure preview */}
        <div className="ppbr-preview">
          <div className="ppbr-preview-card">
            <div className="ppbr-preview-head">
              <span className="ppbr-preview-ico"><FiFileText /></span>
              <div className="ppbr-preview-txt">
                <strong>Product brochure</strong>
                <span className="ppbr-preview-sub">
                  {brochure.url ? trimUrl(brochure.url) : "No brochure uploaded"}
                </span>
              </div>
              {brochure.url ? (
                <a
                  className="ppbr-open"
                  href={brochure.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open brochure"
                >
                  <FiExternalLink />
                </a>
              ) : null}
            </div>

            <div className="ppbr-frame">
              {!brochure.url ? (
                <div className="ppbr-empty">—</div>
              ) : brochure.kind === "image" ? (
                <img src={brochure.url} alt="Brochure preview" />
              ) : brochure.kind === "pdf" ? (
                <iframe
                  title="Brochure PDF"
                  src={brochure.url}
                  loading="lazy"
                />
              ) : (
                <div className="ppbr-generic">
                  <FiFileText />
                  <span>This file can be opened in a new tab.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

PPBrochurePreview.propTypes = {
  valueAdds: PropTypes.object,
  identity: PropTypes.object,
  className: PropTypes.string,
};

/* ---------- helpers (kept local) ---------- */

function DetailRow({ icon, label, value, badge, badgeTone = "muted" }) {
  return (
    <div className="ppbr-row">
      <div className="ppbr-row-l">
        <span className="ppbr-row-ico">{icon}</span>
        <span className="ppbr-row-label">{label}</span>
      </div>
      <div className="ppbr-row-r">
        <span className="ppbr-row-value" title={String(value || "")}>
          {value || "—"}
        </span>
        {badge ? <span className={`ppbr-badge -${badgeTone}`}>{badge}</span> : null}
      </div>
    </div>
  );
}

DetailRow.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  badge: PropTypes.string,
  badgeTone: PropTypes.oneOf(["ok", "muted"]),
};

function boolToText(b) {
  return typeof b === "boolean" ? (b ? "Yes" : "No") : "—";
}

function safeText(s) {
  if (s === null || s === undefined || s === "") return "—";
  return String(s);
}

function trimUrl(u = "", max = 48) {
  try {
    const t = u.replace(/^https?:\/\/(www\.)?/i, "");
    return t.length > max ? t.slice(0, max - 1) + "…" : t;
  } catch {
    return u;
  }
}

function formatCurrency(n) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(n);
  }
}

/* alias with the misspelling the user requested */
export const PPBorchurePreview = PPBrochurePreview;
