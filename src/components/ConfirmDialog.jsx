import { useEffect } from "react";
import { ShieldAlert, AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Please confirm your action",
  message,
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onClick={(e) => e.stopPropagation()}
        style={{
          border: "1px solid var(--border-color)",
          borderTop: "3px solid var(--accent-primary)",
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-default)",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)",
          padding: "1.5rem",
          maxWidth: "480px",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem" }}>
          <ShieldAlert size={22} color="var(--accent-primary)" />
          <h3 id="confirm-title" style={{
            margin: 0,
            fontSize: "1.25rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-headline)",
            letterSpacing: "0.03em"
          }}>
            {title}
          </h3>
        </div>

        {/* Irreversibility Advisory Banner */}
        <div style={{
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          color: "var(--accent-warning)",
          padding: "8px 12px",
          borderRadius: "var(--radius-xs)",
          fontSize: "0.8rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          margin: "0.75rem 0 1rem"
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>
            <strong>Official Advisory:</strong> Actions recorded on the cryptographic ledger cannot be reversed or altered.
          </span>
        </div>

        <p id="confirm-message" style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          lineHeight: 1.55,
          margin: "0 0 1.5rem"
        }}>
          {message}
        </p>

        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          <button
            type="button"
            className="btn btn-tertiary"
            onClick={onCancel}
            style={{ minHeight: "44px", padding: "0 1.25rem" }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            style={{ minHeight: "44px", padding: "0 1.25rem" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
