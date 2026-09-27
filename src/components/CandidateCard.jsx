import { useState } from "react";
import { RotateCcw, CheckCircle2, Vote, Loader2, FileText } from "lucide-react";
import { getOptimizedCloudinaryUrl } from "../services/cloudinaryService";

const FALLBACK_AVATAR =
  "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg";

export default function CandidateCard({
  candidate,
  onVote,
  canVote,
  voting,
  index = 0,
  isVotedFor = false,
  isOtherVoting = false
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const rawUrl = candidate.photo || FALLBACK_AVATAR;
  const imageUrl = getOptimizedCloudinaryUrl(rawUrl, 360);

  return (
    <div
      className={`candidate-card-container ${isVotedFor ? "is-voted-for" : ""} ${isOtherVoting ? "is-dimmed" : ""}`}
      style={{ "--card-index": index }}
    >
      <div className={`candidate-card ${isFlipped ? "flipped" : ""}`}>
        {/* Front Face */}
        <div className="card-face card-front">
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                background: "rgba(37, 99, 235, 0.15)",
                color: "#60A5FA",
                border: "1px solid rgba(37, 99, 235, 0.35)",
                padding: "2px 8px",
                borderRadius: "var(--radius-xs)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 700
              }}
            >
              #{candidate.id?.substring(0, 8)}
            </span>
            <button
              type="button"
              className="btn btn-tertiary"
              style={{
                minHeight: "32px",
                padding: "2px 10px",
                fontSize: "0.75rem",
                borderRadius: "var(--radius-xs)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              onClick={() => setIsFlipped(true)}
              aria-label={`View manifesto and details for ${candidate.name}`}
              title="Candidate manifesto"
            >
              <FileText size={13} />
              <span>Manifesto</span>
            </button>
          </div>

          <div className="card-photo-wrap">
            <img
              src={imageUrl}
              alt={candidate.name}
              className="card-photo"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_AVATAR;
              }}
            />
            {isVotedFor && <span className="card-photo-pulse-ring" />}
          </div>

          <h3 className="card-name">{candidate.name}</h3>
          <p className="card-party">{candidate.party || "Independent Nominee"}</p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginBottom: "1rem"
            }}
          >
            <CheckCircle2 size={13} color="#22C55E" />
            <span style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
              Certified Nominee
            </span>
          </div>

          <button
            type="button"
            onClick={() => onVote(candidate.id)}
            disabled={voting || !canVote}
            aria-label={`Cast ballot for candidate ${candidate.name}`}
            className={`card-vote-btn ${isVotedFor ? "card-vote-btn-active" : ""}`}
          >
            {isVotedFor ? (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Sealing on Ledger...</span>
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Vote size={15} />
                <span>Vote for {candidate.name}</span>
              </span>
            )}
          </button>
        </div>

        {/* Back Face (Manifesto) */}
        <div className="card-face card-back">
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                background: "rgba(245, 158, 11, 0.15)",
                color: "#FBBF24",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                padding: "2px 8px",
                borderRadius: "var(--radius-xs)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                textTransform: "uppercase"
              }}
            >
              Manifesto
            </span>
            <button
              type="button"
              className="btn btn-tertiary"
              style={{
                minHeight: "32px",
                padding: "2px 10px",
                fontSize: "0.75rem",
                borderRadius: "var(--radius-xs)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              onClick={() => setIsFlipped(false)}
              aria-label={`Back to ballot card for ${candidate.name}`}
              title="Back"
            >
              <RotateCcw size={13} />
              <span>Card</span>
            </button>
          </div>

          <div>
            <h3 className="card-name" style={{ marginTop: "1rem" }}>{candidate.name}</h3>
            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: "0.75rem"
              }}
            >
              Candidate Vision & Collegiate Motto
            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                lineHeight: 1.6,
                fontStyle: "italic",
                background: "var(--bg-elevated)",
                padding: "12px",
                borderRadius: "var(--radius-default)",
                border: "1px solid var(--border-color)",
                maxHeight: "160px",
                overflowY: "auto"
              }}
            >
              "{candidate.motto?.trim() || "Dedicated to transparent student governance, academic excellence, and campus welfare."}"
            </p>
          </div>

          <button
            type="button"
            onClick={() => onVote(candidate.id)}
            disabled={voting || !canVote}
            aria-label={`Cast ballot for candidate ${candidate.name}`}
            className={`card-vote-btn ${isVotedFor ? "card-vote-btn-active" : ""}`}
          >
            {isVotedFor ? (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Loader2 size={16} className="animate-spin" />
                <span>Sealing on Ledger...</span>
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <Vote size={15} />
                <span>Vote for {candidate.name}</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}