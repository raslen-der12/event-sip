import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import useToggle from "../../lib/hooks/useToggle";
import useOnClickOutside from "../../lib/hooks/useOnClickOutside";
import useScrollElevate from "../../lib/hooks/useScrollElevate";
import "./header.css";
import useAuth from "../../lib/hooks/useAuth";
import AvatarMenu from "../user/AvatarMenu";
import imageLink from "../../utils/imageLink";

/* icons */
const Icon = {
  phone: () => <svg className="icon" viewBox="0 0 24 24" fill="none"><path d="M4 5c0 8 7 15 15 15l2-3-4-3-2 2a12 12 0 0 1-6-6l2-2-3-4L4 5z" stroke="currentColor" strokeWidth="2"/></svg>,
  mail: () => <svg className="icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor"/><path d="M3 7l9 6 9-6" stroke="currentColor"/></svg>,
  clock: () => <svg className="icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><path d="M12 7v6l4 2" stroke="currentColor"/></svg>,
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2"/><path d="M20 20l-3-3" stroke="#fff" strokeWidth="2"/></svg>,
  burger: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" strokeWidth="2"/></svg>,
  close: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>,
};

export default function HeaderShell({ top, nav, cta }) {
  const { role, status, ActorId } = useAuth();
  const isAuthed = status !== "Guest" && !!ActorId;

  const elevated = useScrollElevate(8);
  const [openDD, setOpenDD] = useState(null);

  /* mobile drawer */
  const drawer = useToggle(false);
  const drawerRef = useRef(null);

  // Lock body scroll when drawer is open
  useEffect(() => { document.body.style.overflow = drawer.open ? "hidden" : ""; }, [drawer.open]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!drawer.open || !drawerRef.current) return;
    const root = drawerRef.current;
    const selectors = 'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(root.querySelectorAll(selectors)).filter(el => !el.hasAttribute('disabled'));
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    first?.focus();

    const onKey = (e) => {
      if (e.key === "Tab" && nodes.length) {
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [drawer.open]);

  /* dropdown outside click */
  const ddRef = useRef(null);
  useOnClickOutside(ddRef, () => setOpenDD(null));

  /* search overlay */
  const search = useToggle(false);

  /* esc closes things */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenDD(null); drawer.close(); search.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="header">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="container">
          <div className="row">
            <div className="left">
              <span className="item"><Icon.phone />{top?.phone}</span>
              <span className="item d-none d-sm-flex"><Icon.mail />{top?.email}</span>
              <span className="item d-none d-md-flex"><Icon.clock />{top?.hours}</span>
            </div>
            <div className="social">
              {top?.socials?.map((s) => (
                <a key={s} href="#" aria-label={s}>{s[0].toUpperCase()}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <div className={`nav ${elevated ? "elevated" : ""}`}>
        <div className="container" style={{height:"72px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          {/* brand */}
          <a className="brand" href="/"><img width={190} src={ imageLink('default/IPDAYXGITS.png')} /></a>

          {/* desktop links */}
          <div className="menu">
            {nav.map((item, idx) => (
              <div
  key={item.label}
  className={`dd ${openDD === idx ? "open" : ""} ${item.label === "Logistics Solutions" ? "dd--wide" : item.label ==="Events" ? "dd--fit" : ""}`}
  onMouseEnter={() => setOpenDD(idx)}
  onMouseLeave={() => setOpenDD(null)}
  ref={openDD === idx ? ddRef : null}
>

                <a
                  href={item.href || "#"}
                  className="link"
                  onClick={(e) => {
                    if (item.children?.length) { e.preventDefault(); setOpenDD(openDD === idx ? null : idx); }
                  }}
                >
                  {item.label}{item.children?.length ? " ▾" : ""}
                </a>
                {item.children?.length ? (
                  <div className="dd-menu">
                    {item.children.map((s) => <a key={s.href} href={s.href}>{s.label}</a>)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {/* right */}
          <div className="right">
            {isAuthed ? <AvatarMenu /> : (cta ? <a className="btn-brand cta" href={cta.href}>{cta.label || "log in"}</a> : null)}
            <button className="icon-btn burger d-lg-none" onClick={drawer.openFn} aria-label="Menu"><Icon.burger /></button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY (blocks background clicks) */}
      <div
        className={`drawer-overlay ${drawer.open ? "open" : ""}`}
        onClick={drawer.close}
        aria-hidden={drawer.open ? "false" : "true"}
      />

      {/* MOBILE DRAWER */}
      <aside
        ref={drawerRef}
        className={`drawer ${drawer.open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileMenuTitle"
      >
        <div className="section drawer-header">
          <a className="brand" href="/"><img width={130} src={ imageLink('default/LOGO GITS COLOR.png')} /></a>
          <button className="icon-btn drawer-close" onClick={drawer.close} aria-label="Close menu">
            <Icon.close />
          </button>
        </div>

        <div className="section">
          <h2 id="mobileMenuTitle" className="sr-only">Main Menu</h2>
          {nav.map((item) => (
            <div key={item.label} style={{marginBottom:8}}>
              <a href={item.href || "#"} onClick={drawer.close}>{item.label}</a>
              {item.children?.length ? (
                <div style={{paddingLeft:10}}>
                  {item.children.map((s) => (
                    <a key={s.href} href={s.href} style={{display:"block", opacity:.85}} onClick={drawer.close}>
                      {s.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="section">
          <button className="icon-btn" onClick={() => { search.openFn(); drawer.close(); }} aria-label="Search">🔎</button>
          {cta?.href && (
            <a className="btn-brand cta" href={cta.href} style={{display:"inline-block", marginLeft:8}} onClick={drawer.close}>
              {cta.label || "Buy Ticket"}
            </a>
          )}
        </div>
      </aside>

      {/* SEARCH OVERLAY */}
      <div className={`search-overlay ${search.open ? "open" : ""}`} onClick={search.close}>
        <div className="search-card" onClick={(e) => e.stopPropagation()}>
          <div className="search-row">
            <input type="text" placeholder="Search events, speakers, or cities…" autoFocus />
            <button className="btn-brand" onClick={search.close}>Search</button>
          </div>
        </div>
      </div>
    </div>
  );
}

HeaderShell.propTypes = {
  top: PropTypes.shape({
    phone: PropTypes.string,
    email: PropTypes.string,
    hours: PropTypes.string,
    socials: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  nav: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      children: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, href: PropTypes.string })),
    })
  ).isRequired,
  cta: PropTypes.shape({ href: PropTypes.string, label: PropTypes.string }),
};
