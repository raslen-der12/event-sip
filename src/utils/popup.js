export default function triggerPopup({ title, body, type = "success", link }) {
  try {
    const item = {
      type, status: type,
      title: title || "Notification",
      body: body || "",
      message: body || "",
      ts: Date.now(),
      showOnce: true,
      link: link ? { href: link.href, label: link.label || "Open" } : null,
      _source: "local",
    };
    localStorage.setItem("popup", JSON.stringify([item]));
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("app:popup:ready"));
    });
  } catch {}
}