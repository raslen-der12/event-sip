import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FiSearch, FiChevronLeft, FiSend, FiPaperclip, FiAlertTriangle, FiMoreHorizontal,
} from "react-icons/fi";
import "./messages.css";
import { actorsSocket } from "../../services/actorsSocket";

import {
  useEnsureDMMutation,
  useGetRoomMessagesQuery,
  useSendMessageMutation,
  useMarkSeenMutation,
  useUploadFilesMutation,
} from "../../features/Actor/actorsChatApiSlice";

import { useGetActorsToChatQuery ,  useGetUnreadCountsQuery,} from "../../features/Actor/toolsApiSlice";
import useAuth from "../../lib/hooks/useAuth";
import imageLink from "../../utils/imageLink";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

/* ---------------- utils ---------------- */
const idOf = (o) => o?._id || o?.id || o?.userId || o?.actorId || o?.peerId;
const isValidId = (s) => /^[a-f0-9]{24}$/i.test(String(s||""));
const initials = (t="") => (t||"??").trim().split(/\s+/).slice(0,2).map(s=>s[0]?.toUpperCase?.()||"").join("") || "??";
const fmtClock = (d) => { try{ const dt=new Date(d); if(Number.isNaN(dt)) return ""; return dt.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); } catch { return ""; } };
const isSystemText = (s="") => /^\s*\[system]/i.test(String(s).trim());

const normProfile = (row={}) => {
  const p = row.profile || {};
  return {
    id: p.id || idOf(p),
    name: p.name || "—",
    role: p.role || "",
    country: p.country || "",
    photo: p.avatar || "",
    hasChat: !!row.hasChat,
  };
};

const normMsg = (m={}, meId) => ({
  id: idOf(m),
  mine: !!(m.mine || m.fromMe || m.isMine || (m.senderId && meId && String(m.senderId)===String(meId))),
  text: (m.text ?? "").toString(),
  files: Array.isArray(m.files) ? m.files : [],
  createdAt: m.createdAt || m.time || m.ts,
  seenByMe: !!(m.seenByMe || m.seen || false),
});

/* label like "Today", "Yesterday", or "Aug 20, 2025" */
const dateLabel = (iso) => {
  try{
    const d = new Date(iso); const now = new Date();
    const one = (x)=> new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const today = one(now), that = one(d);
    const diff = (today - that)/(24*3600*1000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
  }catch{ return ""; }
};

/* decorate for render: inject date dividers + group flags */
const prepareRenderItems = (msgs=[]) => {
  const items = [];
  let lastDay = "";
  let prevMine = null;
  let prevTime = 0;

  msgs.forEach(m => {
    const day = dateLabel(m.createdAt);
    if (day && day !== lastDay) {
      items.push({ type:"divider", id:`d-${m.id}-${day}`, label: day });
      lastDay = day;
      prevMine = null; prevTime = 0;
    }
    const t = new Date(m.createdAt||0).getTime();
    const grouped = prevMine === m.mine && (t - prevTime) < 5*60*1000; // 5 min window
    items.push({ type:"msg", ...m, grouped });
    prevMine = m.mine; prevTime = t;
  });

  return items;
};

export default function ActorsMessages(){
  const { ActorId: meId } = useAuth();
  const navig = useNavigate();
  const [sp, setSp] = useSearchParams();
  const memberParam = sp.get("member") || ""; // peerId
  const roomParam   = sp.get("room")   || ""; // open-by-room

  /* ---------- Left pane state ---------- */
  const [tab, setTab] = React.useState("recent");
  const [q, setQ] = React.useState("");
  const [limit, setLimit] = React.useState(20);
  const [qDeb, setQDeb] = React.useState("");
  React.useEffect(() => { const t = setTimeout(()=>setQDeb(q.trim()), 250); return ()=>clearTimeout(t); }, [q]);

  const { data: resp, isFetching: listLoading, isError: listErr, refetch: refetchLists } =
    useGetActorsToChatQuery({ meId, search: qDeb || null, limit });

  const suggestions = React.useMemo(() => {
    const arr = Array.isArray(resp?.suggestions) ? resp.suggestions : [];
    return arr.map(normProfile).filter(x=>x.id && x.id!==meId);
  }, [resp, meId]);
  const { data: unreadRaw } = useGetUnreadCountsQuery(undefined, { pollingInterval: 8000 });
  const unreadMap = React.useMemo(() => {
    return (unreadRaw?.data ?? unreadRaw ?? {}) || {};
  }, [unreadRaw]);
  const recent = React.useMemo(() => {
    const arr = Array.isArray(resp?.chats) ? resp.chats : [];
    return arr.map(normProfile).filter(x=>x.id && x.id!==meId);
  }, [resp, meId]);

  const people = tab === "suggest" ? suggestions : recent;

  /* ---------- Ensure room ---------- */
  const [ensureDM, { isLoading: ensuring }] = useEnsureDMMutation();
  const [roomId, setRoomId] = React.useState(roomParam || null);
  const activePeerId = memberParam || null;

  React.useEffect(() => {
    let alive = true;
    async function go(){
      if (roomParam) { setRoomId(roomParam); return; }
      if (!isValidId(activePeerId) || String(activePeerId) === String(meId)) {
        setRoomId(null); return;
      }
      try {
        const res = await ensureDM({ peerId: activePeerId }).unwrap();
        const rid = res?.roomId || res?.room?._id || res?.room?.id || null;
        if (alive) {
          setRoomId(rid || null);
          if (rid) actorsSocket.joinRoom(String(rid));
        }
      } catch {
        if (alive) setRoomId(null);
      }
    }
    go();
    return ()=>{ alive=false; };
  }, [activePeerId, roomParam, ensureDM, meId]);

  /* ---------- Messages ---------- */
  const { data: msgsRaw, isFetching: msgsLoading, isError: msgsErr, refetch: refetchMsgs } =
    useGetRoomMessagesQuery({ roomId, limit: 80 }, { skip: !roomId });

  const msgs = React.useMemo(() => {
    const arr = Array.isArray(msgsRaw?.data) ? msgsRaw.data : (Array.isArray(msgsRaw) ? msgsRaw : []);
    return arr
      .map((m) => normMsg(m, meId))
      .map((n) => {
        if (n.text && isSystemText(n.text)) n.text = ""; // strip [SYSTEM] prefix messages
        return n;
      })
      .filter((n) => n.text || (n.files && n.files.length));
  }, [msgsRaw, meId]);

  const items = React.useMemo(() => prepareRenderItems(msgs), [msgs]);

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [markSeen] = useMarkSeenMutation();
  const [uploadFiles, { isLoading: uploading }] = useUploadFilesMutation();

  React.useEffect(() => {
    if (!roomId || !msgs?.length) return;
    const unseenIds = msgs.filter(m => !m.mine && !m.seenByMe).slice(-60).map(m => m.id).filter(Boolean);
    if (unseenIds.length) markSeen({ roomId, msgIds: unseenIds }).catch(()=>{});
  }, [roomId, msgs, markSeen]);

  /* ---------- Socket ---------- */
  React.useEffect(() => {
    const offNew  = actorsSocket.on("chat:new",     (pl) => { if (pl?.roomId && String(pl.roomId)===String(roomId)) refetchMsgs(); refetchLists(); });
    const offSeen = actorsSocket.on("chat:seen",    (pl) => { if (pl?.roomId && String(pl.roomId)===String(roomId)) refetchMsgs(); });
    const offDel  = actorsSocket.on("chat:deleted", (pl) => { if (pl?.roomId && String(pl.roomId)===String(roomId)) refetchMsgs(); refetchLists(); });
    return () => { offNew(); offSeen(); offDel(); };
  }, [roomId, refetchMsgs, refetchLists]);

  React.useEffect(() => {
    if (!roomId) return;
    actorsSocket.joinRoom(String(roomId));
    return () => actorsSocket.leaveRoom(String(roomId));
  }, [roomId]);

  const [theirTyping, setTheirTyping] = React.useState(false);
  React.useEffect(() => {
    const offTyping = actorsSocket.on("chat:typing", (pl) => {
      if (!pl?.roomId || String(pl.roomId) !== String(roomId)) return;
      setTheirTyping(!!pl.isTyping);
      if (pl.isTyping) setTimeout(() => setTheirTyping(false), 2200);
    });
    return () => offTyping();
  }, [roomId]);

  /* ---------- Compose ---------- */
  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState([]);
  const scRef = React.useRef(null);
  const dzRef = React.useRef(null);

  const scrollToBottom = React.useCallback(() => {
    const el = scRef.current; if (!el) return;
    el.scrollTop = el.scrollHeight + 9999;
  }, []);
  React.useEffect(() => { scrollToBottom(); }, [roomId, msgs.length, scrollToBottom]);

  const toUrlArray = (arr=[]) => arr
    .map(f => (typeof f === 'string' ? f : (f.url || f.path || f.href || null)))
    .filter(Boolean);

  const onSend = async () => {
    if (!roomId) return;
    const body = { roomId, text: text?.trim() || "", files: toUrlArray(files) };
    if (!body.text && !body.files.length) return;
    try {
      await sendMessage(body).unwrap();
      setText(""); setFiles([]); scrollToBottom();
    } catch {}
  };

  const onPick = async (ev) => {
    const fls = Array.from(ev.target.files || []);
    if (!fls.length || !roomId) return;
    try {
      const res = await uploadFiles({ roomId, files: fls }).unwrap();
      const arr = Array.isArray(res?.files) ? res.files : (Array.isArray(res) ? res : []);
      setFiles(cur => [...cur, ...arr]);
    } catch {} finally { ev.target.value = ""; }
  };

  React.useEffect(() => {
    const el = dzRef.current; if (!el) return;
    const prevent = (e)=>{ e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => { prevent(e); const dt = e.dataTransfer; if (!dt?.files?.length) return; onPick({ target: { files: dt.files, value: "" } }); };
    ["dragenter","dragover","dragleave","drop"].forEach(t => el.addEventListener(t, prevent));
    el.addEventListener("drop", onDrop);
    return () => {
      ["dragenter","dragover","dragleave","drop"].forEach(t => el.removeEventListener(t, prevent));
      el.removeEventListener("drop", onDrop);
    };
  }, [roomId]);

  const lastTypeRef = React.useRef(0);
  const onTyping = () => {
    const now = Date.now();
    if (now - lastTypeRef.current > 600) {
      lastTypeRef.current = now;
      if (roomId) {
        actorsSocket.typing(String(roomId), true);
        setTimeout(() => { actorsSocket.typing(String(roomId), false); }, 900);
      }
    }
  };

  /* ---------- Helpers for header ---------- */
  const combined = React.useMemo(() => {
    const map = new Map();
    [...recent, ...suggestions].forEach(p => { if (p?.id) map.set(String(p.id), p); });
    return map;
  }, [recent, suggestions]);

  const peer = combined.get(String(activePeerId)) || null;

  const goBack = () => { const nsp = new URLSearchParams(sp); nsp.delete("member"); nsp.delete("room"); setSp(nsp,{replace:true}); };

  return (
    <>
        <HeaderShell top={topbar} nav={nav} cta={cta} />
    <section className="dm">
      <div className="dm-wrap">
        {/* LEFT: Inbox */}
        <aside className={`dm-inbox ${(memberParam || roomParam) ? "hide-sm" : ""}`}>
          <div className="dm-inbox-head">
            <div className="dm-title">Inbox</div>
            <div className="dm-tabs">
              <button className={tab==="recent" ? "on" : ""} onClick={()=>setTab("recent")}>Recent</button>
              <button className={tab==="suggest" ? "on" : ""} onClick={()=>setTab("suggest")}>Suggestions</button>
            </div>
          </div>

          <div className="dm-search">
            <FiSearch />
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder={tab==="recent" ? "Search recent…" : "Search people…"}
              aria-label="Search"
            />
          </div>

          {listErr ? (
            <div className="dm-empty"><FiAlertTriangle/> Failed to load.</div>
          ) : (
            <div className="dm-list">
              {(people || []).map((p) => (
                <button
                  key={p.id}
                  className={`dm-item ${String(p.id)===String(activePeerId) ? "is-active" : ""}`}
                  style={{ position:'relative' }}
                  onClick={()=> isValidId(p.id) && navig(`?member=${p.id}`, { replace:false })}
                >
                  <div className="dm-avatar" style={p.photo ? { backgroundImage:`url(${imageLink(p.photo)})` } : {}}>
                    {!p.photo && <span className="dm-inits">{initials(p.name)}</span>}
                  </div>
                  <div className="dm-itxt">
                    <div className="dm-name">{p.name}</div>
                    <div className="dm-sub">
                      {p.role ? <span className="dm-chip">{p.role}</span> : null}
                      {p.country ? <span className="dm-subtle">{p.country}</span> : null}
                    </div>
                  </div>
                  {tab==="recent" && (unreadMap[String(p.id)]||0) > 0 && (
                    <span
                      title={`${unreadMap[String(p.id)]} unread`}
                      style={{
                        position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                        minWidth:18, height:18, padding:'0 6px', borderRadius:999,
                        fontSize:11, lineHeight:'18px', textAlign:'center', fontWeight:700,
                        background:'#7c3aed', color:'#fff'
                      }}>{unreadMap[String(p.id)]}</span>
                  )}
                </button>
              ))}
              <div className="dm-more">
                <button disabled={listLoading} onClick={()=> tab==="suggest" ? setLimit(v=>v+20) : refetchLists()}>
                  {listLoading ? "Loading…" : (tab==="suggest" ? "See more" : "Refresh")}
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT: Conversation */}
        <main className="dm-chat" ref={dzRef}>
          {(!memberParam && !roomParam) ? (
            <div className="dm-placeholder">
              <div className="dm-ph-title">Select a conversation</div>
              <p className="dm-ph-sub">Choose someone from your inbox or suggestions to start chatting.</p>
            </div>
          ) : (ensuring && !roomId) ? (
            <div className="dm-placeholder"><FiAlertTriangle/> Preparing conversation…</div>
          ) : (
            <>
              {/* Chat header */}
              <header className="dm-head">
                <button className="dm-back" onClick={goBack}><FiChevronLeft/></button>
                <div className="dm-peer">
                  <div className="dm-avatar -sm" style={peer?.photo ? { backgroundImage:`url(${imageLink(peer.photo)})` } : {}}>
                    {!peer?.photo && <span className="dm-inits">{initials(peer?.name || "")}</span>}
                  </div>
                  <div className="dm-ptxt">
                    <div className="dm-pname">{peer?.name || "Direct chat"}</div>
                    <div className="dm-psub">{[peer?.role, peer?.country].filter(Boolean).join(" • ")}</div>
                  </div>
                </div>
                <button className="dm-menu" title="More"><FiMoreHorizontal/></button>
              </header>

              {/* Messages */}
              <div className="dm-msgs" ref={scRef}>
                {msgsErr ? (
                  <div className="dm-empty"><FiAlertTriangle/> Failed to load messages.</div>
                ) : (msgsLoading && !msgs?.length) ? (
                  <div className="dm-empty">Loading…</div>
                ) : (!msgs || !msgs.length) ? (
                  <div className="dm-empty">No messages yet.</div>
                ) : (
                  items.map((it) => {
                    if (it.type === "divider") {
                      return <div key={it.id} className="dm-divider"><span>{it.label}</span></div>;
                    }
                    const m = it;
                    return (
                      <div key={m.id} className={`dm-bubble ${m.mine ? "mine" : "theirs"} ${m.grouped ? "grouped" : "first"}`}>
                        {m.text ? <div className="dm-text">{m.text}</div> : null}
                        {!!m.files?.length && (
                          <div className="dm-files">
                            {m.files.map((f, i) => {
                              const href = typeof f==='string' ? f : (f.url || f.path || "#");
                              const name = (typeof f==='string' ? f.split("/").pop() : f.name) || "file";
                              return <a key={`${m.id}-f-${i}`} className="dm-file" href={href} target="_blank" rel="noreferrer">{name}</a>;
                            })}
                          </div>
                        )}
                        {!m.grouped ? <div className="dm-time">{fmtClock(m.createdAt)}</div> : null}
                      </div>
                    );
                  })
                )}
                {theirTyping && <div className="dm-typing"><span/><span/><span/></div>}
              </div>

              {/* Composer */}
              <div className="dm-compose">
                {!!files.length && (
                  <div className="dm-attach-preview">
                    {files.map((f,i)=>{
                      const name = f?.name || (typeof f==='string' ? f.split("/").pop() : "file");
                      return <span key={i} className="dm-chip">{name}</span>;
                    })}
                  </div>
                )}

                <label className="dm-clip">
                  <input type="file" multiple onChange={onPick} disabled={uploading || !roomId}/>
                  <FiPaperclip/>
                </label>

                <textarea
                  className="dm-input"
                  value={text}
                  onChange={(e)=>{ setText(e.target.value); onTyping(); }}
                  onKeyDown={(e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); onSend(); }}}
                  placeholder="Write a message…"
                  disabled={!roomId || sending}
                />

                <button className="dm-send" onClick={onSend}
                        disabled={!roomId || sending || uploading || (!text.trim() && !files.length)}>
                  <FiSend/> Send
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </section>
    <Footer
            brand={footerData.brand}
            columns={footerData.columns}
            socials={footerData.socials}
            actions={footerData.actions}
            bottomLinks={footerData.bottomLinks}
          />
    </>
  );
}
