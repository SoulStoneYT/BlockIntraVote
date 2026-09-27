import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import blockchainService from "../blockchain/blockchainService";
import contractConfig from "../contracts/contractConfig.json";
import { auth } from "../firebase";
import useNotification from "../hooks/useNotification";
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Database,
  Search,
  Hash,
  Clock,
  Layers,
  Cpu
} from "lucide-react";

export default function BlockchainExplorer() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedContract, setCopiedContract] = useState(false);

  // Verification state
  const [verifyUid, setVerifyUid] = useState("");
  const [verifyPosition, setVerifyPosition] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Pre-fill student UID if logged in
  useEffect(() => {
    if (auth.currentUser) {
      setVerifyUid(auth.currentUser.uid);
    }
  }, []);

  const loadBlockchainData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logs, total] = await Promise.all([
        blockchainService.getRecentAuditVotes(50),
        blockchainService.getTotalVotes()
      ]);
      setAuditLogs(logs);
      setTotalVotes(total);
    } catch (err) {
      console.error("Blockchain explorer load error:", err);
      setError("Unable to connect to Ethereum Node (Make sure 'npx hardhat node' is running).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyUid.trim() || !verifyPosition.trim()) {
      showNotification("Please provide both Student UID and Position ID.", "warning");
      return;
    }

    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await blockchainService.verifyVoteReceipt(verifyUid.trim(), verifyPosition.trim());
      setVerifyResult(res);
      if (res.verified) {
        showNotification("Vote receipt verified on Ethereum blockchain!", "success");
      } else {
        showNotification("No matching ballot found for this UID and position.", "error");
      }
    } catch (err) {
      setVerifyResult({ verified: false, message: err.message });
      showNotification(err.message || "Verification failed", "error");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text, label = "Address") => {
    navigator.clipboard.writeText(text);
    setCopiedContract(true);
    showNotification(`${label} copied to clipboard!`, "info");
    setTimeout(() => setCopiedContract(false), 2500);
  };

  return (
    <div style={{
      maxWidth: "1140px",
      margin: "0 auto",
      padding: "1.25rem 1rem 3rem",
      color: "var(--text-primary)"
    }}>
      {/* Navigation & Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.75rem",
        borderBottom: "1px solid var(--border-color)",
        paddingBottom: "1.25rem"
      }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            className="btn-tertiary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "0.75rem",
              cursor: "pointer"
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={24} style={{ color: "var(--accent-secondary)" }} />
            <h1 style={{
              margin: 0,
              fontFamily: "var(--font-headline)",
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: "var(--text-primary)"
            }}>
              Blockchain Ledger & Audit Explorer
            </h1>
          </div>
          <p style={{
            margin: "0.35rem 0 0",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            maxWidth: "680px"
          }}>
            Real-time, cryptographically verified ballot transactions executed on Ethereum EVM Smart Contract.
          </p>
        </div>

        <button
          onClick={loadBlockchainData}
          disabled={loading}
          className="btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "0.6rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.8125rem",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          {loading ? "Syncing Blocks..." : "Refresh Ledger"}
        </button>
      </div>

      {/* Network & Contract Metrics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "12px",
        marginBottom: "1.75rem"
      }}>
        {/* Smart Contract Card */}
        <div className="card card-team-blue" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.05em",
              marginBottom: "6px"
            }}>
              <Hash size={13} style={{ color: "var(--accent-secondary)" }} /> Smart Contract
            </div>
            <div style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
              wordBreak: "break-all",
              lineHeight: 1.3
            }}>
              {contractConfig.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(contractConfig.address, "Contract Address")}
            style={{
              marginTop: "0.75rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "none",
              color: "var(--accent-secondary)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: 0
            }}
          >
            {copiedContract ? <Check size={13} color="#22C55E" /> : <Copy size={13} />}
            {copiedContract ? "Copied" : "Copy Contract Address"}
          </button>
        </div>

        {/* Consensus & Network Card */}
        <div className="card card-team-green" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.05em",
              marginBottom: "6px"
            }}>
              <Cpu size={13} style={{ color: "var(--accent-success)" }} /> Consensus & Network
            </div>
            <div style={{
              fontSize: "1.25rem",
              fontFamily: "var(--font-headline)",
              letterSpacing: "0.02em",
              color: "var(--accent-success)",
              lineHeight: 1.2
            }}>
              EVM LOCALHOST (31337)
            </div>
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Solidity ^0.8.20 · Hardhat Local Node
          </div>
        </div>

        {/* Total On-Chain Ballots Card */}
        <div className="card card-team-red" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.05em",
              marginBottom: "6px"
            }}>
              <Database size={13} style={{ color: "var(--accent-primary)" }} /> Total On-Chain Ballots
            </div>
            <div style={{
              fontSize: "2rem",
              fontFamily: "var(--font-headline)",
              letterSpacing: "0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.1
            }}>
              {totalVotes}
            </div>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "0.75rem",
            color: "var(--accent-success)",
            fontWeight: 600,
            marginTop: "0.5rem"
          }}>
            <ShieldCheck size={14} /> 100% Immutable Ledger
          </div>
        </div>
      </div>

      {/* Interactive Vote Verification Box */}
      <div className="card" style={{
        borderLeft: "4px solid var(--accent-secondary)",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
          <ShieldCheck size={20} style={{ color: "var(--accent-secondary)" }} />
          <h2 style={{
            margin: 0,
            fontFamily: "var(--font-headline)",
            fontSize: "1.25rem",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "var(--text-primary)"
          }}>
            Voter Proof Verification Portal
          </h2>
        </div>
        <p style={{ margin: "0 0 1.25rem", color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>
          Verify that your vote exists in the blockchain block without exposing your identity. 
          Your student UID is converted into a <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-secondary)" }}>keccak256</code> hash to check on-chain proof.
        </p>

        <form onSubmit={handleVerify} style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr)) auto",
          gap: "12px",
          alignItems: "end"
        }}>
          <div>
            <label className="form-label" htmlFor="verify-uid-input">
              Student UID / Voter Identifier
            </label>
            <input
              id="verify-uid-input"
              className="admin-input"
              type="text"
              value={verifyUid}
              onChange={(e) => setVerifyUid(e.target.value)}
              placeholder="e.g. 21BCS045 or Firebase UID"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="verify-pos-input">
              Position ID / Name
            </label>
            <input
              id="verify-pos-input"
              className="admin-input"
              type="text"
              value={verifyPosition}
              onChange={(e) => setVerifyPosition(e.target.value)}
              placeholder="e.g. president"
              required
            />
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "0 1.5rem",
              height: "44px",
              fontWeight: 700,
              fontSize: "0.8125rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              cursor: verifying ? "not-allowed" : "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {verifying ? (
              <>
                <RefreshCw size={15} className="spin-icon" /> Verifying...
              </>
            ) : (
              <>
                <Search size={15} /> Verify on EVM
              </>
            )}
          </button>
        </form>

        {verifyResult && (
          <div style={{
            marginTop: "1.25rem",
            padding: "1rem",
            borderRadius: "var(--radius-default)",
            background: verifyResult.verified ? "rgba(34, 197, 94, 0.12)" : "rgba(220, 38, 38, 0.12)",
            border: `1px solid ${verifyResult.verified ? "var(--accent-success)" : "var(--accent-error)"}`
          }}>
            {verifyResult.verified ? (
              <div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 700,
                  color: "var(--accent-success)",
                  fontSize: "0.95rem",
                  marginBottom: "6px"
                }}>
                  <CheckCircle2 size={18} /> Cryptographically Verified On-Chain
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                  <strong>Block:</strong> <span style={{ fontFamily: "var(--font-mono)" }}>#{verifyResult.blockNumber}</span> |{" "}
                  <strong>Position:</strong> {verifyResult.positionId}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-secondary)",
                  wordBreak: "break-all"
                }}>
                  <strong>Anonymized Voter Hash:</strong> {verifyResult.voterHash}
                </div>
              </div>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#F87171",
                fontSize: "0.875rem",
                fontWeight: 600
              }}>
                <AlertTriangle size={18} /> Verification Failed: {verifyResult.message || "No matching vote found."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ledger Table & Mobile Cards */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={18} style={{ color: "var(--accent-secondary)" }} />
            <h2 style={{
              margin: 0,
              fontFamily: "var(--font-headline)",
              fontSize: "1.25rem",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: "var(--text-primary)"
            }}>
              Chronological Ballot Ledger
            </h2>
          </div>
          <span className="badge badge-neutral" style={{ fontFamily: "var(--font-mono)" }}>
            {auditLogs.length} Recorded Entries
          </span>
        </div>

        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "1rem",
            background: "rgba(220, 38, 38, 0.12)",
            border: "1px solid var(--accent-error)",
            borderRadius: "var(--radius-default)",
            color: "#F87171",
            marginBottom: "1.25rem",
            fontSize: "0.875rem"
          }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {auditLogs.length === 0 && !loading && !error && (
          <div className="card" style={{
            textAlign: "center",
            padding: "2.5rem 1.5rem",
            borderStyle: "dashed",
            color: "var(--text-muted)"
          }}>
            <Database size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
            <p style={{ margin: "0 0 0.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              No ballots have been mined into the blockchain ledger yet.
            </p>
            <p style={{ margin: 0, fontSize: "0.8rem" }}>
              Cast your vote in an active election session to generate immutable on-chain blocks.
            </p>
          </div>
        )}

        {auditLogs.length > 0 && (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="audit-table-desktop" style={{
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-default)",
              overflow: "hidden",
              background: "var(--bg-surface)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", textAlign: "left" }}>
                <thead>
                  <tr style={{
                    background: "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border-color)",
                    color: "var(--text-muted)",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em"
                  }}>
                    <th style={{ padding: "10px 14px" }}>Block #</th>
                    <th style={{ padding: "10px 14px" }}>Position</th>
                    <th style={{ padding: "10px 14px" }}>Nominee Choice</th>
                    <th style={{ padding: "10px 14px" }}>Voter Hash (Keccak256)</th>
                    <th style={{ padding: "10px 14px" }}>Timestamp</th>
                    <th style={{ padding: "10px 14px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        background: index % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.02)"
                      }}
                    >
                      <td style={{
                        padding: "12px 14px",
                        fontWeight: 700,
                        color: "var(--accent-secondary)",
                        fontFamily: "var(--font-mono)"
                      }}>
                        #{log.blockNumber}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {log.positionId}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="badge badge-blue">
                          {log.candidateId}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {log.voterHash ? `${log.voterHash.substring(0, 10)}...${log.voterHash.substring(log.voterHash.length - 8)}` : "N/A"}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                          <Check size={11} /> Mined
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 768px) - Zero horizontal scroll */}
            <div className="audit-cards-mobile" style={{ display: "none", flexDirection: "column", gap: "10px" }}>
              {auditLogs.map((log, index) => (
                <div
                  key={index}
                  className="card"
                  style={{
                    padding: "0.85rem 1rem",
                    borderLeft: "3px solid var(--accent-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: "var(--accent-secondary)",
                      fontSize: "0.875rem"
                    }}>
                      Block #{log.blockNumber}
                    </span>
                    <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <Check size={10} /> Mined
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <Layers size={13} /> {log.positionId}
                    </span>
                    <span className="badge badge-blue">
                      {log.candidateId}
                    </span>
                  </div>

                  <div style={{
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)",
                    background: "var(--bg-elevated)",
                    padding: "4px 8px",
                    borderRadius: "var(--radius-xs)",
                    wordBreak: "break-all"
                  }}>
                    Hash: {log.voterHash || "N/A"}
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    marginTop: "2px"
                  }}>
                    <Clock size={11} />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .spin-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 767px) {
          .audit-table-desktop {
            display: none !important;
          }
          .audit-cards-mobile {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
