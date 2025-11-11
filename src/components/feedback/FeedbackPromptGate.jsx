// src/components/feedback/FeedbackPromptGate.jsx
import React from "react";
import {
  useGetPendingFeedbackQuery,
  useMarkFeedbackShownMutation,
  useSubmitFeedbackMutation,
} from "../../features/meetings/feedbackApiSlice";
import "./feedback.css";

export default function FeedbackPromptGate() {
  const { data, isFetching, refetch } = useGetPendingFeedbackQuery();
  const [markShown] = useMarkFeedbackShownMutation();
  const [submitFeedback, { isLoading: isSubmitting }] = useSubmitFeedbackMutation();

  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState(null);
  const [stars, setStars] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [mode, setMode] = React.useState("form"); // "form" | "done"

  // prevent re-opening the same prompt id after closing
  const lastSeenIdRef = React.useRef(null);

  React.useEffect(() => {
    const item = data?.data?.[0];
    if (!item) return;
    // if we already handled this id in this session, don't reopen
    if (lastSeenIdRef.current === item.id) return;

    setCurrent(item);
    setStars(5);
    setComment("");
    setMode("form");
    setOpen(true);

    // mark as shown (best-effort)
    lastSeenIdRef.current = item.id;
    markShown(item.id).catch(() => {});
  }, [data, markShown]);

  if (!open || !current) return null;

  const title =
    current.kind === "meet"
      ? "Rate your B2B meeting"
      : current.kind === "session"
      ? "Rate the session you attended"
      : "Rate the event";

  const hardClose = async () => {
    setOpen(false);
    setCurrent(null);
    setMode("form");
    // make sure list is fresh so a new (different) prompt can appear later
    try { await refetch(); } catch {}
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitFeedback({ promptId: current.id, stars, comment }).unwrap();
      // switch to thank-you view, and keep modal open until user closes it
      setMode("done");
      // refresh the queue so this prompt disappears server-side
      try { await refetch(); } catch {}
    } catch {
      alert("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <div className="fbk-overlay" role="dialog" aria-modal="true">
      <div className="fbk-modal">
        <div className="fbk-head">
          <h3>{mode === "done" ? "Thanks for your feedback!" : title}</h3>
        </div>

        {mode === "done" ? (
          <div className="fbk-body fbk-done">
            <div className="fbk-ok-icon" aria-hidden="true">✓</div>
            <h4 className="fbk-done-title">Submitted successfully</h4>
            <p className="fbk-note">Your response was recorded.</p>
            <div className="fbk-actions">
              <button className="fbk-btn fbk-primary" type="button" onClick={hardClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form className="fbk-body" onSubmit={onSubmit}>
            <div className="fbk-stars" aria-label="Rate from 1 to 5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`fbk-star ${n <= stars ? "on" : ""}`}
                  onClick={() => setStars(n)}
                  aria-pressed={n <= stars}
                  title={`${n} star${n > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="fbk-text"
              placeholder="Add a short comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
            />
            <div className="fbk-actions">
              <button
                className="fbk-btn fbk-primary"
                type="submit"
                disabled={isFetching || isSubmitting}
              >
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
              <button
                className="fbk-btn"
                type="button"
                onClick={hardClose}
                title="Close and continue later"
              >
                Later
              </button>
            </div>
            <p className="fbk-note">
              This prompt appears about 1 hour after we confirm your attendance.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
