import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetPublicPollQuery, useSubmitVoteMutation } from "../../features/tools/pollApiSlice";

/* ---------------- utils ---------------- */
function ensureVoterId(){
  try{
    const K = "poll:voterId";
    let v = localStorage.getItem(K);
    if (v) return v;
    const a = new Uint8Array(16);
    (window.crypto || {}).getRandomValues?.(a);
    v = Array.from(a).map(b=>b.toString(16).padStart(2,"0")).join("") || String(Date.now());
    localStorage.setItem(K, v);
    return v;
  }catch{ return String(Date.now()); }
}

/* ------------- component ------------- */
export default function PollVotePage(){
  const { pollId } = useParams();
  const voterId = useMemo(ensureVoterId, []);
  const votedKey = `poll:voted:${pollId}`;

  // fetch once (no polling)
  const { data: pollRes, isFetching } = useGetPublicPollQuery(pollId, {
    refetchOnMountOrArgChange: true,
  });
  const [submitVote, submitState] = useSubmitVoteMutation();

  const poll = pollRes?.data || pollRes || null; // accept {data:{...}} or raw
  const status = String(poll?.status || "").toLowerCase(); // 'upcoming' | 'running' | 'finished'
  const options = Array.isArray(poll?.options) ? poll.options : [];

  const [selected, setSelected] = useState("");
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [thanks, setThanks] = useState(false);

  // if user already voted on this poll, show thanks immediately
  useEffect(() => {
    try {
      const v = localStorage.getItem(votedKey);
      if (v) { setAlreadyVoted(true); setSelected(v); setThanks(true); }
    } catch {}
  }, [votedKey]);

  async function onVote(){
    if (!selected || !pollId || alreadyVoted) return;
    try{
      await submitVote({ id: pollId, optionId: selected, voterId }).unwrap();
      try { localStorage.setItem(votedKey, selected); } catch {}
      setAlreadyVoted(true);
      setThanks(true);
    }catch(e){
      alert(e?.data?.message || e?.message || "Vote failed");
    }
  }

  const disableForm =
    isFetching ||
    submitState.isLoading ||
    status !== "running" ||  // only accept votes while running
    alreadyVoted;
  console.log("isFetching",isFetching);

  // ---- Thanks screen (no results, just a simple acknowledgement) ----
  if (thanks) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 grid place-items-center px-4">
        <div className="w-full max-w-xl bg-white border rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{poll?.title || "Poll"}</h1>
          <p className="mt-3 text-zinc-700">Thank you! Your vote has been recorded.</p>
          <div className="mt-6">
            <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-semibold">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---- Voting screen (no timers, no live results, no auto refresh) ----
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{poll?.title || "Poll"}</h1>
          <div className="mt-1 text-sm text-zinc-600">
            {status === "running"   && <>Status: <span className="font-medium text-emerald-700">Running</span></>}
            {status === "upcoming"  && <>Status: <span className="font-medium text-amber-700">Upcoming</span></>}
            {status === "finished"  && <>Status: <span className="font-medium text-zinc-800">Finished</span></>}
          </div>
        </header>

        {/* Form */}
        <section className="bg-white rounded-2xl border shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-4">Choose one option</h2>

          <div className="space-y-2">
            {options.length === 0 && <div className="text-sm text-zinc-500">No options available.</div>}
            {options.map(opt => {
              const id = String(opt?.key || opt?.id || "");
              const label = String(opt?.label || opt?.title || "Option");
              return (
                <label key={id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${selected===id ? "border-zinc-900" : "border-zinc-200 hover:border-zinc-400"}`}>
                  <input
                    type="radio"
                    name="pollOption"
                    className="accent-zinc-900"
                    value={id}
                    checked={selected === id}
                    onChange={() => setSelected(id)}
                    disabled={disableForm}
                  />
                  <span className="font-medium">{label}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-semibold disabled:opacity-50"
              onClick={onVote}
              disabled={disableForm || !selected}
            >
              {submitState.isLoading ? "Submitting…" : "Submit vote"}
            </button>

            <Link to="/" className="px-3 py-2 rounded-xl border">
              Back to Home
            </Link>
          </div>

          {status !== "running" && (
            <div className="mt-4 text-sm text-zinc-600">
              Voting is not open right now.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
