import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import blockchainService from "../blockchain/blockchainService";
import contractConfig from "../contracts/contractConfig.json";
import { auth } from "../firebase";

export default function BlockchainExplorer() {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    if (!verifyUid || !verifyPosition) {
      alert("Please provide both Student UID and Position ID.");
      return;
    }

    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await blockchainService.verifyVoteReceipt(verifyUid.trim(), verifyPosition.trim());
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({ verified: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
  };

  return (
    <div style={{
      maxWidth: "1100px",
      margin: "0 auto",
      padding: "24px 16px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: "var(--text-primary)"
    }}>
      {/* Navigation & Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "24px"
      }}>
        <div>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: "6px 14px",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "8px",
              boxShadow: "none"
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: "1.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
            ⛓️ Blockchain Ledger & Audit Explorer
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Real-time, cryptographically verified ballot transactions executed on Ethereum EVM Smart Contract.
          </p>
        </div>

        <button
          onClick={loadBlockchainData}
          disabled={loading}
          style={{
            padding: "8px 18px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
          }}
        >
          {loading ? "Syncing Blocks..." : "🔄 Refresh Ledger"}
        </button>
      </div>

      {/* Network & Contract Metrics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "28px"
      }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Smart Contract
          </div>
          <div style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            marginTop: "6px",
            fontFamily: "monospace",
            color: "var(--text-primary)",
            wordBreak: "break-all"
          }}>
            {contractConfig.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}
          </div>
          <button
            onClick={() => copyToClipboard(contractConfig.address)}
            style={{
              marginTop: "6px",
              background: "none",
              border: "none",
              color: "#38bdf8",
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: 0,
              boxShadow: "none"
            }}
          >
            📋 Copy Contract Address
          </button>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Consensus & Network
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "6px", color: "#10b981" }}>
            EVM Localhost (31337)
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Solidity ^0.8.20 • Hardhat
          </div>
        </div>

        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
            Total On-Chain Ballots
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, marginTop: "4px", color: "#38bdf8" }}>
            {totalVotes}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#10b981", marginTop: "2px" }}>
            ✓ 100% Immutable
          </div>
        </div>
      </div>


      {/* Interactive Vote Verification Box */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
        color: "white",
        borderRadius: "14px",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
          🛡️ Student Vote Verification Portal
        </h2>
        <p style={{ margin: "0 0 16px", color: "#c7d2fe", fontSize: "0.9rem" }}>
          Verify that your vote exists in the blockchain block without exposing your identity. 
          Your student UID is converted into a <code>keccak256</code> hash to check on-chain proof.
        </p>

        <form onSubmit={handleVerify} style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr)) auto",
          gap: "12px",
          alignItems: "end"
        }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px", color: "#e0e7ff" }}>
              Student UID / Voter Identifier
            </label>
            <input
              type="text"
              value={verifyUid}
              onChange={(e) => setVerifyUid(e.target.value)}
              placeholder="e.g. your student UID"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #4338ca",
                background: "#0f172a",
                color: "white",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px", color: "#e0e7ff" }}>
              Position ID / Name
            </label>
            <input
              type="text"
              value={verifyPosition}
              onChange={(e) => setVerifyPosition(e.target.value)}
              placeholder="e.g. president"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #4338ca",
                background: "#0f172a",
                color: "white",
                boxSizing: "border-box"
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={verifying}
            style={{
              padding: "10px 24px",
              background: "#38bdf8",
              color: "#0f172a",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: "pointer",
              height: "42px"
            }}
          >
            {verifying ? "Verifying..." : "Verify on EVM"}
          </button>
        </form>

        {verifyResult && (
          <div style={{
            marginTop: "16px",
            padding: "14px 18px",
            borderRadius: "8px",
            background: verifyResult.verified ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
            border: `1px solid ${verifyResult.verified ? "#10b981" : "#ef4444"}`
          }}>
            {verifyResult.verified ? (
              <div>
                <div style={{ fontWeight: 700, color: "#34d399", fontSize: "1rem", marginBottom: "4px" }}>
                  ✓ Cryptographically Verified On-Chain
                </div>
                <div style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
                  <strong>Block:</strong> {verifyResult.blockNumber} | <strong>Position:</strong> {verifyResult.positionId}
                </div>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#94a3b8", marginTop: "4px", wordBreak: "break-all" }}>
                  <strong>Anonymized Voter Hash:</strong> {verifyResult.voterHash}
                </div>
              </div>
            ) : (
              <div style={{ color: "#f87171", fontSize: "0.9rem" }}>
                ✗ Verification Failed: {verifyResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          📜 Chronological Ballot Ledger (Blocks & Transactions)
        </h2>

        {error && (
          <div style={{
            padding: "16px",
            background: "#fee2e2",
            border: "1px solid #f87171",
            borderRadius: "8px",
            color: "#991b1b",
            marginBottom: "16px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {auditLogs.length === 0 && !loading && !error && (
          <div style={{
            textAlign: "center",
            padding: "40px",
            background: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px dashed var(--border-color)",
            color: "var(--text-secondary)"
          }}>
            No ballots have been mined into the blockchain yet. 
            Cast your first vote in the voting session to generate a block!
          </div>
        )}

        {auditLogs.length > 0 && (
          <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "10px", boxShadow: "var(--card-shadow)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                <tr>
                  <th style={{ padding: "12px" }}>Block #</th>
                  <th style={{ padding: "12px" }}>Position</th>
                  <th style={{ padding: "12px" }}>Candidate Choice</th>
                  <th style={{ padding: "12px" }}>Voter Hash (Keccak256)</th>
                  <th style={{ padding: "12px" }}>Timestamp</th>
                  <th style={{ padding: "12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid var(--border-color)", background: index % 2 === 0 ? "var(--bg-card)" : "var(--bg-surface)" }}>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#38bdf8", fontFamily: "monospace" }}>
                      #{log.blockNumber}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {log.positionId}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontWeight: 600
                      }}>
                        {log.candidateId}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      {log.voterHash ? `${log.voterHash.substring(0, 10)}...${log.voterHash.substring(log.voterHash.length - 8)}` : "N/A"}
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        background: "rgba(16, 185, 129, 0.15)",
                        color: "#10b981",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700
                      }}>
                        ✓ Mined
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

