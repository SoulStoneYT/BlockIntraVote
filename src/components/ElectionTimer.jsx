import { useState, useEffect, useMemo } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function ElectionTimer({ compact = false, showLabel = true }) {
  const [electionEndTime, setElectionEndTime] = useState(null);
  const [electionStatus, setElectionStatus] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const electionDocRef = doc(db, "settings", "election");
    const unsubscribe = onSnapshot(
      electionDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setElectionStatus(data.electionStatus);

          if (data.electionEndTime) {
            const endTime = typeof data.electionEndTime === "string" 
              ? new Date(data.electionEndTime) 
              : data.electionEndTime.toDate();
            setElectionEndTime(endTime);
          } else {
            setElectionEndTime(null);
          }
        }
      },
      (error) => {
        if (error.code !== "permission-denied" && error.code !== "unavailable" && error.code !== "network-request-failed") {
          console.error("ElectionTimer Firestore snapshot error:", error);
        }
        setElectionStatus(null);
        setElectionEndTime(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update timer tick while election is active
  useEffect(() => {
    if (!electionEndTime || electionStatus !== "active") {
      return;
    }

    const interval = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [electionEndTime, electionStatus]);

  const remainingSeconds = useMemo(() => {
    if (!electionEndTime || electionStatus !== "active") {
      return null;
    }

    const diff = Math.floor((electionEndTime.getTime() - tick) / 1000);
    return diff <= 0 ? 0 : diff;
  }, [electionEndTime, electionStatus, tick]);

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return "--:--:--";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't show if election not active
  if (electionStatus !== "active" || remainingSeconds === null) {
    return null;
  }

  // Determine styling based on remaining time (design.md: red for critical, amber for warning, green for normal)
  let statusColor = "#22C55E";
  let borderColor = "#22C55E";
  let bgTint = "rgba(34, 197, 94, 0.12)";

  if (remainingSeconds <= 600) { // 10 min
    statusColor = "#DC2626";
    borderColor = "#DC2626";
    bgTint = "rgba(220, 38, 38, 0.15)";
  } else if (remainingSeconds <= 1800) { // 30 min
    statusColor = "#F59E0B";
    borderColor = "#F59E0B";
    bgTint = "rgba(245, 158, 11, 0.15)";
  }

  if (compact) {
    return (
      <div style={{
        backgroundColor: bgTint,
        border: `1px solid ${borderColor}`,
        color: statusColor,
        padding: "4px 8px",
        borderRadius: "var(--radius-xs)",
        fontWeight: 700,
        fontSize: "0.8125rem",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em"
      }}>
        <Clock size={12} />
        <span>{formatTime(remainingSeconds)}</span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "var(--bg-surface)",
      border: "1px solid var(--border-color)",
      borderTop: `3px solid ${borderColor}`,
      borderRadius: "var(--radius-default)",
      padding: "16px 20px",
      textAlign: "center"
    }}>
      {showLabel && (
        <div style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px"
        }}>
          <Clock size={13} />
          <span>BALLOT TIMEFRAME COUNTDOWN</span>
        </div>
      )}
      <div style={{
        fontSize: "2.25rem",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        color: statusColor,
        letterSpacing: "0.05em"
      }}>
        {formatTime(remainingSeconds)}
      </div>
      {remainingSeconds <= 300 && remainingSeconds > 0 && (
        <div style={{
          fontSize: "0.75rem",
          marginTop: "6px",
          color: "var(--accent-error)",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          textTransform: "uppercase"
        }}>
          <AlertTriangle size={13} />
          <span>Critical: Under 5 minutes remaining before polls seal!</span>
        </div>
      )}
    </div>
  );
}
