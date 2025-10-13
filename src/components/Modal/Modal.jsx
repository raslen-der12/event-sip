import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./modal.css";

/**
 * Props
 * - open: boolean
 * - title: string
 * - text?: string (optional if you prefer to pass children)
 * - onClose: () => void
 * - closeOnOverlay?: boolean (default true)
 * - size?: "sm" | "md" | "lg" (default "md")
 * - actions?: ReactNode (optional custom footer actions; default shows a single “OK”)
 * - children?: ReactNode (optional custom body content)
 */
export default function Modal({
  open,
  title,
  text,
  onClose,
  closeOnOverlay = true,
  size = "md",
  actions,
  children,
}) {
  const dialogRef = useRef(null);

  // Create a portal root if it doesn't exist
  const portalRoot = getPortalRoot();

  // Lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus the dialog on open
  useEffect(() => {
    if (open && dialogRef.current) {
      // give the browser a tick before focusing
      const t = setTimeout(() => {
        dialogRef.current.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
      // Basic focus trap (keep tab inside)
      if (e.key === "Tab" && dialogRef.current) {
        trapTab(dialogRef.current, e);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlay = () => {
    if (closeOnOverlay) onClose?.();
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay" aria-hidden={!open}>
      <div
        className={`modal ${sizeClass(size)}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h3 id="modal-title" className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-x"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          {text ? <p className="modal-text">{text}</p> : children}
        </div>

        <footer className="modal-foot">
          {actions ? (
            actions
          ) : (
            <button type="button" className="modal-btn" onClick={onClose}>
              OK
            </button>
          )}
        </footer>
      </div>

      {/* overlay click target lives last so it doesn't sit above dialog */}
      <div className="modal-backdrop" onClick={handleOverlay} />
    </div>,
    portalRoot
  );
}

/* ---------- helpers ---------- */
function getPortalRoot() {
  let el = document.getElementById("modal-root");
  if (!el) {
    el = document.createElement("div");
    el.setAttribute("id", "modal-root");
    document.body.appendChild(el);
  }
  return el;
}

function sizeClass(size) {
  if (size === "sm") return "modal--sm";
  if (size === "lg") return "modal--lg";
  return "modal--md";
}

function trapTab(container, e) {
  const focusables = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  } else if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  }
}
