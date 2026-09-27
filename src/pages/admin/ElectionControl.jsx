import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  startElection,
  pauseElection,
  resumeElection,
  endElection,
  resetElection,
  initElectionSettings,
  publishResults,
  resetAllVotes,
  resetAllUserVotingStatus,
  fullTestingReset
} from "../../services/electionService";
import { sendResultsAnnouncementEmails } from "../../services/emailService";
import ElectionTimer from "../../components/ElectionTimer";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import {
  Clock,
  Activity,
  Pause,
  Flag,
  Play,
  Square,
  Megaphone,
  RefreshCw,
  FlaskConical,
  Flame,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from "lucide-react";

export default function ElectionControl({ stats = {} }) {
  const [electionStatus, setElectionStatus] = useState("not_started");
  const [, setElectionEndTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [resultsPublished, setResultsPublished] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  const { showNotification } = useNotification();
  const { showConfirm } = useConfirm();

  // Initialize settings and subscribe to real-time updates
  useEffect(() => {
    const initializeAndSubscribe = async () => {
      try {
        await initElectionSettings();

        const electionDocRef = doc(db, "settings", "election");
        const unsubscribe = onSnapshot(electionDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setElectionStatus(data.electionStatus);
            setResultsPublished(data.resultsPublished || false);

            if (data.electionEndTime) {
              const endTime = typeof data.electionEndTime === "string"
                ? new Date(data.electionEndTime)
                : data.electionEndTime.toDate
                ? data.electionEndTime.toDate()
                : new Date(data.electionEndTime);
              setElectionEndTime(endTime);
            }

            // Auto-end election if time has expired
            if (data.electionStatus === "active" && data.electionEndTime) {
              const now = new Date();
              const endTimeDate = typeof data.electionEndTime === "string"
                ? new Date(data.electionEndTime)
                : data.electionEndTime.toDate
                ? data.electionEndTime.toDate()
                : new Date(data.electionEndTime);

              if (now >= endTimeDate) {
                await endElection();
              }
            }
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error("Error initializing election:", err);
        setError("Failed to load election status");
        setLoading(false);
      }
    };

    initializeAndSubscribe();
  }, []);

  const handleStart = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to start the election? Eligible voters will immediately be able to cast verified ballots.",
      { title: "Start Election", confirmText: "Start Election" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      await startElection();
      showNotification("Election is now LIVE! Voting booth is open.", "success");
    } catch (err) {
      setError(err.message);
      showNotification(err.message, "error");
    }
    setProcessing(false);
  };

  const handlePause = async () => {
    const confirmed = await showConfirm(
      "Pause the active election session? Balloting will be temporarily suspended.",
      { title: "Pause Election", confirmText: "Pause Voting" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      await pauseElection();
      showNotification("Voting temporarily paused.", "info");
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handleResume = async () => {
    setProcessing(true);
    setError("");
    try {
      await resumeElection();
      showNotification("Voting session resumed successfully.", "success");
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handleEnd = async () => {
    const confirmed = await showConfirm(
      "Are you sure you want to END the election? Once ended, no further ballots can be cast on the blockchain ledger.",
      { title: "Conclude Election", confirmText: "End Election" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      await endElection();
      showNotification("Election concluded. Ballots locked on blockchain.", "info");
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handleReset = async () => {
    const confirmed = await showConfirm(
      "Reset election schedule and timing parameters? This will clear active election timestamps.",
      { title: "Reset Election Schedule", confirmText: "Reset Schedule" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      await resetElection();
      showNotification("Election timing reset to NOT STARTED.", "info");
    } catch (err) {
      setError(err.message);
    }
    setProcessing(false);
  };

  const handlePublishResults = async () => {
    const confirmed = await showConfirm(
      "Publish verified election results to all students and trigger announcement notifications?",
      { title: "Publish Results", confirmText: "Publish to All" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      await publishResults();
      setResultsPublished(true);

      const resultsLink = `${window.location.origin}/results`;
      const { sent, failed, total, failedReasons } = await sendResultsAnnouncementEmails(resultsLink);

      if (failed > 0) {
        showNotification(
          `Results published! Email summary: ${sent}/${total} sent, ${failed} failed.${
            failedReasons?.[0] ? ` (${failedReasons[0]})` : ""
          }`,
          "warning",
          7000
        );
      } else {
        showNotification(`Results published and broadcast to ${sent} registered voters.`, "success");
      }
    } catch (err) {
      setError(err.message);
      showNotification(err.message || "Failed to publish results", "error");
    }
    setProcessing(false);
  };

  // Developer & Testing actions
  const handleResetVotesOnly = async () => {
    const confirmed = await showConfirm(
      "Reset all voting records? This will delete all vote documents from Firestore for testing.",
      { title: "Reset Votes", confirmText: "Delete Votes" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      const { deletedVotes } = await resetAllVotes();
      showNotification(`Reset complete. Deleted ${deletedVotes} vote records.`, "info");
    } catch (err) {
      setError(err.message || "Failed to reset voting results");
    }
    setProcessing(false);
  };

  const handleResetUserVotingOnly = async () => {
    const confirmed = await showConfirm(
      "Reset all user voting status? This clears voted positions for every student account.",
      { title: "Reset User Voting Status", confirmText: "Reset Status" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      const { resetUsers } = await resetAllUserVotingStatus();
      showNotification(`Reset complete. Cleared voting status for ${resetUsers} users.`, "info");
    } catch (err) {
      setError(err.message || "Failed to reset user voting status");
    }
    setProcessing(false);
  };

  const handleFullTestingReset = async () => {
    const confirmed = await showConfirm(
      "CRITICAL TEST RESET: Delete all votes, reset all student voting history, and set election to NOT STARTED?",
      { title: "Full Testing Reset", confirmText: "Execute Full Reset" }
    );
    if (!confirmed) return;

    setProcessing(true);
    setError("");
    try {
      const { deletedVotes, resetUsers } = await fullTestingReset();
      setResultsPublished(false);
      showNotification(
        `Full reset complete: ${deletedVotes} votes deleted, ${resetUsers} users reset. Status: NOT STARTED.`,
        "info",
        6000
      );
    } catch (err) {
      setError(err.message || "Failed to run full testing reset");
    }
    setProcessing(false);
  };

  const statusConfig = {
    not_started: {
      label: "NOT STARTED",
      color: "#94a3b8",
      bg: "rgba(148, 163, 184, 0.12)",
      border: "#475569",
      desc: "Election setup mode. Voters cannot cast ballots until the Chief Returning Officer starts the session.",
      Icon: Clock
    },
    active: {
      label: "VOTING ACTIVE",
      color: "#4ade80",
      bg: "rgba(34, 197, 94, 0.15)",
      border: "#22c55e",
      desc: "Voters are currently casting cryptographically verifiable ballots on the Ethereum ledger.",
      Icon: Activity
    },
    paused: {
      label: "TEMPORARILY PAUSED",
      color: "#fde68a",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "#f59e0b",
      desc: "Voting is temporarily suspended by administrative order. Voters are placed on standby.",
      Icon: Pause
    },
    ended: {
      label: "ELECTION CONCLUDED",
      color: "#fca5a5",
      bg: "rgba(239, 68, 68, 0.15)",
      border: "#ef4444",
      desc: "Ballot intake closed. On-chain results are frozen and ready for certification or publishing.",
      Icon: Flag
    }
  };

  const currentCfg = statusConfig[electionStatus] || statusConfig.not_started;
  const StatusIcon = currentCfg.Icon;

  if (loading) {
    return (
      <div className="hero-status-card" style={{ textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Initializing Election State Engine...</p>
      </div>
    );
  }

  return (
    <>
      {/* HERO ELECTION STATUS CARD (Un-nested, Intentional, Mobile-First) */}
      <section id="election-status-section" className="hero-status-card">
        <div className="hero-status-header">
          <div className="hero-status-pill" style={{
            background: currentCfg.bg,
            border: `1px solid ${currentCfg.border}`,
            color: currentCfg.color,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <StatusIcon size={14} />
            <span>{currentCfg.label}</span>
          </div>

          {/* Integrated Compact Timer */}
          <div className="hero-timer-container">
            <ElectionTimer compact />
          </div>
        </div>

        <div className="hero-status-body">
          <h3 className="hero-status-title">
            {electionStatus === "not_started" && "Election Scheduled · Ready to Launch"}
            {electionStatus === "active" && "Decentralized Ballot Booth is Live"}
            {electionStatus === "paused" && "Balloting Temporarily Paused"}
            {electionStatus === "ended" && "Election Concluded · Ledger Sealed"}
          </h3>
          <p className="hero-status-desc">{currentCfg.desc}</p>

          {/* Real-time stats ticker during active or ended election */}
          {electionStatus !== "not_started" && stats.votesCast !== undefined && (
            <div className="hero-live-ticker">
              <div className="ticker-item">
                <span className="ticker-label">Votes Mined:</span>
                <strong className="ticker-val" style={{ fontFamily: "var(--font-mono)" }}>{stats.votesCast}</strong>
              </div>
              <div className="ticker-separator">·</div>
              <div className="ticker-item">
                <span className="ticker-label">Turnout:</span>
                <strong className="ticker-val" style={{ fontFamily: "var(--font-mono)" }}>{stats.turnout}%</strong>
              </div>
              {stats.activePositions !== undefined && (
                <>
                  <div className="ticker-separator">·</div>
                  <div className="ticker-item">
                    <span className="ticker-label">Constituencies:</span>
                    <strong className="ticker-val">{stats.activePositions} Active</strong>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="hero-error-banner" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertTriangle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Contextual Actions Bar (Full width on mobile, 48px touch targets) */}
        <div className="hero-actions-bar">
          {electionStatus === "not_started" && (
            <button
              type="button"
              onClick={handleStart}
              disabled={processing}
              className="action-btn action-btn--primary"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Play size={16} />
              <span>{processing ? "Processing..." : "Start Election & Open Ballot"}</span>
            </button>
          )}

          {electionStatus === "active" && (
            <div className="action-btn-group">
              <button
                type="button"
                onClick={handlePause}
                disabled={processing}
                className="action-btn action-btn--secondary"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Pause size={16} />
                <span>{processing ? "Processing..." : "Pause Voting"}</span>
              </button>
              <button
                type="button"
                onClick={handleEnd}
                disabled={processing}
                className="action-btn action-btn--danger"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Square size={16} />
                <span>{processing ? "Processing..." : "End Election"}</span>
              </button>
            </div>
          )}

          {electionStatus === "paused" && (
            <div className="action-btn-group">
              <button
                type="button"
                onClick={handleResume}
                disabled={processing}
                className="action-btn action-btn--primary"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Play size={16} />
                <span>{processing ? "Processing..." : "Resume Voting"}</span>
              </button>
              <button
                type="button"
                onClick={handleEnd}
                disabled={processing}
                className="action-btn action-btn--danger"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Square size={16} />
                <span>{processing ? "Processing..." : "End Election"}</span>
              </button>
            </div>
          )}

          {electionStatus === "ended" && (
            <div className="action-btn-group">
              <button
                type="button"
                onClick={handlePublishResults}
                disabled={processing || resultsPublished}
                className="action-btn action-btn--primary"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {resultsPublished ? (
                  <>
                    <CheckCircle2 size={16} /> Results Published & Broadcast
                  </>
                ) : (
                  <>
                    <Megaphone size={16} /> Publish & Broadcast Results
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={processing}
                className="action-btn action-btn--tertiary"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <RefreshCw size={15} />
                <span>{processing ? "Processing..." : "Reset Schedule"}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* DEVELOPER & TESTING TOOLS (Collapsed at very bottom, visually distinct) */}
      <section id="dev-tools-section" className="dev-tools-wrapper">
        <div
          className="dev-tools-toggle"
          onClick={() => setDevToolsOpen(!devToolsOpen)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setDevToolsOpen(!devToolsOpen)}
        >
          <div className="dev-tools-label">
            <span className="dev-icon" style={{ display: "inline-flex", alignItems: "center" }}>
              <FlaskConical size={16} />
            </span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ color: "var(--text-primary)" }}>Developer & Testing Tools</strong>
              <span className="dev-subtitle">(Reset votes, test profiles, debug Hardhat ledger)</span>
            </div>
          </div>
          <span className="dev-chevron" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {devToolsOpen ? (
              <>
                <ChevronUp size={14} /> Collapse
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Expand
              </>
            )}
          </span>
        </div>

        {devToolsOpen && (
          <div className="dev-tools-content">
            <p className="dev-warning-text" style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <strong>Administrative Sandbox Controls:</strong> These functions bypass standard election guards to allow resetting test fixtures during demonstrations or viva presentations. Do not use during a live student election.
              </span>
            </p>

            <div className="dev-actions-grid">
              <button
                type="button"
                onClick={handleResetVotesOnly}
                disabled={processing}
                className="dev-btn dev-btn--warning"
              >
                {processing ? "Executing..." : "Delete All Vote Documents"}
              </button>

              <button
                type="button"
                onClick={handleResetUserVotingOnly}
                disabled={processing}
                className="dev-btn dev-btn--warning"
              >
                {processing ? "Executing..." : "Clear User 'Already Voted' Flags"}
              </button>

              <button
                type="button"
                onClick={handleFullTestingReset}
                disabled={processing}
                className="dev-btn dev-btn--danger"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Flame size={15} />
                <span>{processing ? "Executing..." : "Full Reset (Votes + Users + Election)"}</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
