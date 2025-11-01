import React from "react";
import { Link } from "react-router-dom";
import imageLink from "../../utils/imageLink";

export default function ProductCard({ item }) {
  if (!item) return null;

  const id   = String(item.id || item._id || "");
  const img  =
    (Array.isArray(item.images) && item.images[0] && imageLink(item.images[0])) ||
    (item.thumbnailUpload ? imageLink(item.thumbnailUpload) : "");
  const sector = (item.sector || "").replace(/\b\w/g, m => m.toUpperCase());
  const sub    = item.subsectorName || "";
  const price  = item.pricingNote || "";
  console.log(item);
  const contactHref = `/businessprofile/${item.profile.id}#team` || "#";
     
    

  return (
    <article className="mk-card">
      <div className="mk-figure">
        {img ? <img src={img} alt={item.title} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy" /> : null}
        {sector ? <span className="mk-pill">{sector}</span> : null}
        {price  ? <span className="mk-price">{price}</span> : null}
      </div>

      <div className="mk-body">
        <h3 className="mk-title">{item.title}</h3>
        {sub ? <p className="mk-sub">{sub}</p> : null}

        <div className="mk-actions">
          <Link className="mk-btn primary" to={`/products/${id}`}>View</Link>
          <Link className="mk-btn ghost"   to={contactHref}>Contact</Link>
        </div>
      </div>
    </article>
  );
}
