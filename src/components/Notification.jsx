import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export default function Notification({ notifications, onClose }) {
  if (!notifications.length) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} color="#22C55E" />;
      case "warning":
        return <AlertTriangle size={16} color="#F59E0B" />;
      case "error":
        return <AlertCircle size={16} color="#DC2626" />;
      default:
        return <Info size={16} color="#2563EB" />;
    }
  };

  return (
    <div className="notification-stack" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-item notification-item--${notification.type}`}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: 1 }}>
            <span style={{ marginTop: "2px", flexShrink: 0 }}>
              {getIcon(notification.type)}
            </span>
            <p className="notification-message" style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.85rem", lineHeight: 1.45 }}>
              {notification.message}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-tertiary"
            style={{
              minHeight: "26px",
              width: "26px",
              padding: 0,
              borderRadius: "var(--radius-xs)",
              border: "none",
              color: "var(--text-muted)"
            }}
            onClick={() => onClose(notification.id)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
