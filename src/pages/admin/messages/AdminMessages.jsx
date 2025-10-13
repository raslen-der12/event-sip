// src/pages/admin/messages/AdminMessages.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { FiSend, FiSearch, FiUsers, FiLoader, FiAlertTriangle } from "react-icons/fi";
import "./admin.messages.css";
import useAuth from "../../../lib/hooks/useAuth";
import imageLink from "../../../utils/imageLink";

// ACTORS list (left)
import { useGetActorsListAdminQuery } from "../../../features/Actor/adminApiSlice";

// CHAT REST hooks (history, upload, HTTP fallback)
import {
  useCreateRoomMutation,
  useGetRoomMessagesQuery,
  useUploadFilesMutation,
  useSendSystemMutation,
} from "../../../features/messages/chatSlice";

// Socket singleton
import { adminSocket } from "../../../services/adminSocket";

const ROLES = ["attendee", "exhibitor", "speaker"];

export default function AdminMessages() {
  const { ActorId: myActorId } = useAuth();
  const [searchParams] = useSearchParams();
  const deeplinkActorId = searchParams.get("actor") || "";
  const deeplinkRole = (searchParams.get("role") || "").toLowerCase();

  // ---------- Left: Audience ----------
  const [role, setRole] = React.useState(ROLES.includes(deeplinkRole) ? deeplinkRole : "attendee");
  const [q, setQ] = React.useState("");
  const [limit, setLimit] = React.useState(20);

  const { data: list = [], isFetching: fetchingActors, refetch: refetchActors } =
    useGetActorsListAdminQuery(
      React.useMemo(
        () => ({ role, ...(q.trim() ? { search: q.trim() } : { limit }) }),
        [role, q, limit]
      ),
      { skip: !role }
    );

  const seeMore = () => { if (!q.trim()) setLimit((n) => n + 20); };
  const onSearch = (e) => setQ(e.target.value);

  // ---------- Selection + Room ensure ----------
  const [createRoom] = useCreateRoomMutation();
  const [active, setActive] = React.useState({ roomId: "", peer: null });
  const prevRoomRef = React.useRef("");

  // connect socket once
  React.useEffect(() => { adminSocket.ensureConnected?.(); }, []);

  // If URL has actor+role, ensure we open that chat once
  const didOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (!deeplinkActorId || didOpenRef.current || !myActorId) return;
    // align the role tab with deeplink
    if (ROLES.includes(deeplinkRole) && role !== deeplinkRole) {
      setRole(deeplinkRole);
    }
    // Build a lightweight virtual actor row and open room immediately
    const vActor = {
      _id: deeplinkActorId,
      role: deeplinkRole || "member",
      fullName: "(Selected)",
      email: "",
    };
    (async () => {
      try {
        const res = await createRoom({ aId: myActorId, bId: deeplinkActorId }).unwrap();
        const rid = res?.roomId || res?.data?.roomId || "";
        if (rid) {
          setActive({ roomId: rid, peer: vActor });
          didOpenRef.current = true;
        }
      } catch (err) {
        console.error("createRoom (deeplink) failed", err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deeplinkActorId, myActorId, deeplinkRole, role]);

  // live cache (socket)
  const [live, setLive] = React.useState([]);
  React.useEffect(() => {
    const onNew = (payload) => {
      if (!payload || payload.roomId !== active.roomId) return;
      const m = payload.msg || {};
      setLive((cur) => (cur.some((x) => x._id === m._id) ? cur : [...cur, m]));
    };
    const onSystem = (payload) => {
      if (!payload || payload.roomId !== active.roomId) return;
      const m = payload.msg || {};
      setLive((cur) => (cur.some((x) => x._id === m._id) ? cur : [...cur, m]));
    };
    adminSocket.on?.("chat:new", onNew);
    adminSocket.on?.("chat:system", onSystem);
    return () => {
      adminSocket.off?.("chat:new", onNew);
      adminSocket.off?.("chat:system", onSystem);
    };
  }, [active.roomId]);

  // join/leave room on change
  React.useEffect(() => {
    const rid = active.roomId;
    if (!rid) return;
    if (prevRoomRef.current && prevRoomRef.current !== rid) {
      adminSocket.leaveRoom(prevRoomRef.current);
    }
    adminSocket.joinRoom(rid);
    prevRoomRef.current = rid;
    setLive([]); // reset socket cache on room change
    return () => { if (rid) adminSocket.leaveRoom(rid); };
  }, [active.roomId]);

  // open from list click
  const onOpenActor = async (actor) => {
    const peerId = actor?._id || actor?.id;
    if (!peerId || !myActorId) return;
    try {
      const res = await createRoom({ aId: myActorId, bId: peerId }).unwrap();
      const rid = res?.roomId || res?.data?.roomId || "";
      if (rid) setActive({ roomId: rid, peer: actor });
    } catch (e) {
      console.error("createRoom failed", e);
    }
  };

  // ---------- Messages + history ----------
  const [before, setBefore] = React.useState(null);
  React.useEffect(() => { setBefore(null); }, [active.roomId]);

  const {
    data: historyData = { items: [], nextBefore: null, total: null },
    isFetching: fetchingHistory,
    refetch: refetchHistory
  } = useGetRoomMessagesQuery(
    active.roomId ? { roomId: active.roomId, before, limit: 40 } : { skip: true },
    { skip: !active.roomId }
  );

  const history = Array.isArray(historyData?.items) ? historyData.items
                 : (Array.isArray(historyData) ? historyData : []);

  const merged = React.useMemo(() => {
    const map = new Map();
    history.forEach((m) => map.set(m._id, m));
    live.forEach((m) => map.set(m._id, m));
    return Array.from(map.values()).sort(
      (a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)
    );
  }, [history, live]);

  const loadOlder = () => {
    if (!history.length) return;
    const first = history[0];
    if (!first?._id) return;
    setBefore(first._id);
  };

  // ---------- Compose / send ----------
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [uploadFiles] = useUploadFilesMutation();
  const [sendSystemH] = useSendSystemMutation();

  const typingRef = React.useRef(null);
  const onTyping = (v) => {
    setText(v);
    if (!active.roomId) return;
    adminSocket.typing(active.roomId, true);
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => adminSocket.typing(active.roomId, false), 900);
  };

  const onPickFiles = async (e) => {
    if (!active.roomId) return;
    const files = e.target.files;
    if (!files || !files.length) return;
    try {
      // Upload via REST to get URLs
      const up = await uploadFiles({ roomId: active.roomId, files }).unwrap();
      const urls = (up?.data?.files || up?.files || []).map((f) => f.url).filter(Boolean);
      if (urls.length) {
        // Send as system message with attachments via socket
        adminSocket.sendSystem(active.roomId, "", urls);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      e.target.value = "";
    }
  };

  const onSend = async (e) => {
    e?.preventDefault?.();
    if (!active.roomId || !text.trim()) return;
    setSending(true);
    const content = text.trim();

    let ok = false;
    try {
      adminSocket.sendSystem(active.roomId, content);
      ok = true;
    } catch (_) {}

    if (!ok) {
      try {
        await sendSystemH({ roomId: active.roomId, text: content }).unwrap();
      } catch (err) {
        console.error("sendSystem (HTTP) failed", err);
      }
    }

    setText("");
    setSending(false);
  };

  // seen tracking stub (admin side no-op for now)
  const scRef = React.useRef(null);
  React.useEffect(() => {
    if (!active.roomId || !merged.length) return;
    const el = scRef.current;
    if (!el) return;
    const atBottom = () => el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    const mark = () => { if (atBottom()) {/* no-op */} };
    mark();
    const onScroll = () => mark();
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [active.roomId, merged]);

  // Build rows, inject a virtual row for deeplink (so it appears selectable)
  const rows = React.useMemo(() => {
    const arr = Array.isArray(list) ? list : [];
    if (!deeplinkActorId) return arr;
    const exists = arr.some((x) => idOf(x) === deeplinkActorId);
    if (exists) return arr;
    return [
      { _id: deeplinkActorId, role: deeplinkRole || "member", fullName: "(Selected)", email: "" },
      ...arr,
    ];
  }, [list, deeplinkActorId, deeplinkRole]);

  const activePeerId = idOf(active.peer);

  // ---------- UI ----------
  return (
    <div className="msg-layout">
      {/* LEFT */}
      <aside className="msg-left">
        <div className="msg-left-head">
          <div className="msg-tabs">
            {ROLES.map((r) => (
              <button
                key={r}
                className={`msg-tab ${role === r ? "is-active" : ""}`}
                onClick={() => { setRole(r); setLimit(20); setQ(""); }}
              >
                {r[0].toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <div className="msg-row">
            <div className="msg-search">
              <FiSearch />
              <input
                className="input"
                placeholder="Search by name or email"
                value={q}
                onChange={onSearch}
              />
            </div>
            <button className="btn tiny" onClick={() => refetchActors()} disabled={fetchingActors}>
              Refresh
            </button>
          </div>
        </div>

        <div className="msg-list">
          {fetchingActors && !rows.length ? (
            <div className="muted p-10">Loading…</div>
          ) : rows.length ? (
            <>
              {rows.map((a) => (
                <ActorRow
                  key={idOf(a)}
                  item={a}
                  active={idOf(a) === activePeerId}
                  onOpen={() => onOpenActor(a)}
                />
              ))}
              {!q.trim() ? (
                <div className="th-footer">
                  <div className="muted tiny">Up to {limit}</div>
                  <div className="grow" />
                  <button className="btn tiny" onClick={seeMore} disabled={fetchingActors}>
                    See more (+20)
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="muted p-10">No results.</div>
          )}
        </div>

        <div className="msg-left-foot">
          <button className="btn"><FiUsers /> Broadcast</button>
        </div>
      </aside>

      {/* RIGHT */}
      <section className="msg-right">
        {!active.roomId ? (
          <EmptyTip />
        ) : (
          <div className="conv">
            <ConvHeader peer={active.peer} onReload={() => refetchHistory()} />
            <div className="conv-body" ref={scRef}>
              <button
                className="btn tiny ghost"
                disabled={fetchingHistory || !historyData?.nextBefore}
                onClick={loadOlder}
              >
                {fetchingHistory ? "Loading…" : historyData?.nextBefore ? "Load older" : "No older"}
              </button>

              <div className="conv-msgs">
                {merged.map((m) => (
                  <MessageBubble key={m._id} msg={m} meId={myActorId} />
                ))}
              </div>
            </div>

            <form className="composer" onSubmit={onSend}>
              <input
                className="input"
                placeholder={`Message ${niceName(active.peer)}`}
                value={text}
                onChange={(e) => onTyping(e.target.value)}
              />
              <label className="upl" title="Attach files">
                <input type="file" multiple onChange={onPickFiles} />
              </label>
              <button className="btn brand" disabled={!text.trim() || sending}>
                {sending ? <FiLoader className="spin" /> : <FiSend />} Send
              </button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

/* ===== pieces ===== */
function ActorRow({ item, onOpen, active }) {
  const a = item || {};
  const photo = a.profilePic || a.logo || a.headshot || "";
  const name = a.fullName || a.exhibitorName || a.contactName || a.name || "—";
  const email = a.email || a.personal?.email || "—";
  const sub = a.orgName || a.organization || a.city || a.country || "";
  return (
    <button
      className={`th-row ${active ? "is-active" : ""}`}
      onClick={onOpen}
      title={name}
      style={active ? { borderColor: "var(--msg-brand)" } : undefined}
    >
      <div className="th-avatar">
        {photo ? (
          <img className="th-img" alt={name} src={imageLink(photo)} />
        ) : (
          <span className="th-fallback">{(name || email || "?").slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="th-main">
        <div className="th-top">
          <div className="th-name line-1">{name}</div>
        </div>
        <div className="th-sub line-1">{email}</div>
        {sub ? <div className="th-last line-1">{sub}</div> : null}
      </div>
    </button>
  );
}

function ConvHeader({ peer, onReload }) {
  const name = niceName(peer);
  const photo = peer?.profilePic || peer?.logo || peer?.headshot || "";
  return (
    <div className="conv-head">
      <div className="conv-who">
        <button className="conv-ava">
          {photo ? (
            <img src={imageLink(photo)} alt={name} />
          ) : (
            <span className="th-fallback">{(name || "?").slice(0, 1).toUpperCase()}</span>
          )}
        </button>
        <div className="conv-meta">
          <div className="conv-name">{name}</div>
          <div className="muted tiny">{peer?.email || ""}</div>
        </div>
      </div>
      <div className="grow" />
      <button className="btn tiny" onClick={onReload}>Refresh</button>
    </div>
  );
}

function MessageBubble({ msg, meId }) {
  const mine = msg?.senderId && meId && String(msg.senderId) === String(meId);
  const cls = `msgb ${mine ? "is-mine" : ""}`;
  const when = fmtTime(msg?.createdAt);
  return (
    <div className={cls}>
      <div className="msgb-body">
        {msg?.text ? <div className="msgb-text">{String(msg.text).replace("[SYSTEM]", "")}</div> : null}
        {Array.isArray(msg?.files) && msg.files.length ? (
          <div className="msgb-files">
            {msg.files.map((u, i) => (
              <a key={i} className="msgb-file" href={u} target="_blank" rel="noreferrer">
                Attachment {i + 1}
              </a>
            ))}
          </div>
        ) : null}
        <div className="msgb-meta tiny muted">{when}</div>
      </div>
    </div>
  );
}

function EmptyTip() {
  return (
    <div className="msg-empty">
      <FiAlertTriangle />
      <div className="muted">Select someone on the left to start a chat. A room will be ensured automatically.</div>
    </div>
  );
}

/* helpers */
function idOf(x) {
  return x?._id || x?.id || "";
}
function niceName(x) {
  return x?.fullName || x?.exhibitorName || x?.contactName || x?.name || "Member";
}
function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(+d)) return "";
  const now = Date.now(),
    dd = now - +d,
    day = 86400000;
  if (dd < day) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString();
}
