// src/pages/VerifEmail/index.jsx
import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAutoVerifyMutation } from "../../features/Actor/toolsApiSlice";

function appendPopup(newPopup) {
  try {
    const raw = localStorage.getItem("popup");
    if (!raw) {
      localStorage.setItem("popup", JSON.stringify([newPopup]));
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      parsed.push(newPopup);
      localStorage.setItem("popup", JSON.stringify(parsed));
    } else if (parsed && typeof parsed === "object") {
      localStorage.setItem("popup", JSON.stringify([parsed, newPopup]));
    } else {
      localStorage.setItem("popup", JSON.stringify([newPopup]));
    }
  } catch {
    localStorage.setItem("popup", JSON.stringify([newPopup]));
  }
}

export default function VerifEmail() {
  const navigate = useNavigate();
  const { search } = useLocation();

  // Parse URL params once per search change
  const { token, role, id } = useMemo(() => {
    const q = new URLSearchParams(search);
    return {
      token: q.get("token") || "",
      role: q.get("role") || "",
      id: q.get("id") || "",
    };
  }, [search]);

  const [autoVerify] = useAutoVerifyMutation();

  useEffect(() => {
    let alive = true;

    // If required params missing -> set error popup & go home
    if (!token || !role || !id) {
      appendPopup({
        type: "error",
        title: "Verification link is invalid",
        body: "Missing parameters in the verification link. Please request a new link and try again.",
        ts: Date.now(),
        showOnce: true,
        link: { href: "/resend-verification", label: "Resend verification" }
      });
      navigate("/", { replace: true });
      return;
    }

    (async () => {
      try {
        await autoVerify({ token, role, id }).unwrap();
        if (!alive) return;
        appendPopup({
          type: "success",
          title: "Email verified 🎉",
          body: "Your email has been verified successfully. You’re all set!",
          ts: Date.now(),
          showOnce: true,
          link: { href: "/", label: "Go to homepage" }
        });
        navigate("/", { replace: true });
      } catch (err) {
        if (!alive) return;
        appendPopup({
          type: "error",
          title: "Verification failed",
          body:
            err?.data?.message ||
            "We couldn't verify your email. The link may be expired or already used.",
          ts: Date.now(),
          showOnce: true,
          link: { href: "/resend-verification", label: "Get a new link" }
        });
        navigate("/", { replace: true });
      }
    })();

    return () => {
      alive = false;
    };
  }, [autoVerify, token, role, id, navigate]);

  return (
    <div style={{ padding: "32px 0", textAlign: "center" }}>
      <h1>Verifying your email…</h1>
      <p>Please wait…</p>
    </div>
  );
}
