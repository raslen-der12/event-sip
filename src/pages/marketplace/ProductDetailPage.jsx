import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetMarketItemQuery } from "../../features/bp/BPApiSlice";
import imageLink from "../../utils/imageLink";
import "./market.css";

export default function ProductDetailPage(){
  const { productId } = useParams();
  const { data: item, isFetching } = useGetMarketItemQuery(productId);

  if (isFetching) return <section className="mk-detail"><div className="mk-detail-skel" /></section>;
  if (!item) return <section className="mk-detail"><div className="empty">Item not found.</div></section>;

  const imgs = item.images || [];
  const cover = imgs[0] ? imageLink(imgs[0]) :
                item.thumbnailUpload ? imageLink(item.thumbnailUpload) : "";

  return (
    <section className="mk-detail">
      <div className="mk-detail-head">
        <div className="mk-detail-cover" style={{ backgroundImage: cover ? `url(${cover})` : "none" }} />
        <div className="mk-detail-meta">
          <div className="mk-kind">{item.kind}</div>
          <h1 className="mk-detail-title">{item.title}</h1>
          <div className="mk-detail-sec">
            {item.sector || "—"} {item.subsectorName ? `• ${item.subsectorName}` : ""}
          </div>
          {item.profile?.name && (
            <div className="mk-detail-prof">
              By <Link to={`/bp/${item.profile.slug || item.profile.id}`}>{item.profile.name}</Link>
            </div>
          )}
          {item.tags?.length ? <div className="mk-tags">{item.tags.map(t=><em key={t}>#{t}</em>)}</div> : null}
        </div>
      </div>

      <div className="mk-detail-body">
        {item.summary ? <p className="mk-detail-summary">{item.summary}</p> : null}
        {item.details ? <div className="mk-detail-text">{item.details}</div> : null}

        {imgs.length ? (
          <>
            <h3 className="mk-sec-h">Gallery</h3>
            <div className="mk-detail-gallery">
              {imgs.map((p,idx)=>(
                <a key={idx} className="mk-g-item" href={imageLink(p)} target="_blank" rel="noreferrer"
                   style={{backgroundImage:`url(${imageLink(p)})`}}/>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
