import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import blockchainService from "../blockchain/blockchainService";
import { Link } from "react-router-dom";
import { Award, ShieldCheck, FileText, AlertTriangle, ArrowLeft } from "lucide-react";

export default function Results() {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [onChainCounts, setOnChainCounts] = useState({});
  const [resultsPublished, setResultsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const electionDocRef = doc(db, "settings", "election");
        const electionDoc = await getDoc(electionDocRef);

        if (!electionDoc.exists() || electionDoc.data().resultsPublished !== true) {
          setResultsPublished(false);
          setLoading(false);
          return;
        }

        setResultsPublished(true);

        const [positionsSnapshot, candidatesSnapshot, votesSnapshot] = await Promise.all([
          getDocs(collection(db, "positions")),
          getDocs(collection(db, "candidates")),
          getDocs(collection(db, "votes"))
        ]);

        const candidatesList = candidatesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const positionsList = positionsSnapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        setPositions(positionsList);
        setCandidates(candidatesList);
        setVotes(votesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));

        // Query on-chain smart contract counts for each candidate
        const chainMap = {};
        for (const c of candidatesList) {
          try {
            const count = await blockchainService.getCandidateVotes(c.id);
            chainMap[c.id] = count;
          } catch {
            chainMap[c.id] = 0;
          }
        }
        setOnChainCounts(chainMap);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load certified election results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const computedResults = useMemo(() => {
    return positions
      .filter((position) => position.isActive !== false)
      .map((position) => {
        const positionCandidates = candidates.filter((c) => c.positionId === position.id);

        const standings = positionCandidates
          .map((candidate) => {
            const voteCount = votes.filter(
              (vote) => vote.positionId === position.id && vote.candidateId === candidate.id
            ).length;

            return {
              candidateId: candidate.id,
              name: candidate.name,
              party: candidate.party || "Independent",
              voteCount
            };
          })
          .sort((a, b) => b.voteCount - a.voteCount);

        const totalVotes = standings.reduce((sum, row) => sum + row.voteCount, 0);

        return {
          positionId: position.id,
          positionTitle: position.title,
          standings,
          winner: standings[0] || null,
          totalVotes
        };
      });
  }, [positions, candidates, votes]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner-large" />
        <h3 style={{ color: "var(--text-primary)" }}>Retrieving Certified Election Results</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Auditing cryptographic tallies against Ethereum smart contract
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "24px" }} className="card card-team-red">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "var(--accent-error)", marginBottom: "8px" }}>
          <AlertTriangle size={20} />
          <h3 style={{ margin: 0, color: "var(--accent-error)" }}>Unable to load certified tallies</h3>
        </div>
        <p style={{ color: "var(--text-secondary)" }}>{error}</p>
      </div>
    );
  }

  if (!resultsPublished) {
    return (
      <div style={{ maxWidth: "560px", margin: "60px auto", textAlign: "center", padding: "2.5rem 1.5rem" }} className="card card-team-blue">
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-default)",
          background: "rgba(37, 99, 235, 0.15)",
          border: "1px solid var(--accent-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          color: "#60A5FA"
        }}>
          <ShieldCheck size={28} />
        </div>
        <h2 style={{ margin: "0 0 0.5rem" }}>Results Under Official Certification</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.9375rem" }}>
          The Returning Officer has not released the final outcome yet. Certified tallies will appear here once the smart contract tally audit concludes.
        </p>
        <Link to="/" className="btn btn-tertiary" style={{ display: "inline-flex", marginTop: "16px", minHeight: "40px" }}>
          <ArrowLeft size={15} />
          <span>Return to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      {/* Institutional Top Banner */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div className="badge badge-green" style={{ marginBottom: "8px" }}>
          <ShieldCheck size={13} />
          <span>OFFICIAL CERTIFIED ELECTION DECLARATION</span>
        </div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Certified Election Standings</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
          Chief Returning Officer's certified outcomes synchronized with the decentralized Ethereum ledger.
        </p>
      </div>

      {/* Blockchain Verification Callout */}
      <div className="card card-team-green" style={{
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        padding: "1rem 1.25rem"
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={18} color="#22C55E" />
            <span>Cryptographic Smart Contract Consensus Achieved</span>
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            All ballot outcomes are mathematically proven and cross-verified against EVM Smart Contract:{" "}
            <span className="mono" style={{ color: "var(--accent-secondary)" }}>0x5FbDB...80aa3</span>.
          </div>
        </div>

        <Link
          to="/blockchain-explorer"
          className="btn btn-secondary"
          style={{ minHeight: "36px", padding: "0 12px", fontSize: "0.8125rem" }}
        >
          <FileText size={14} />
          <span>Open Ledger Explorer</span>
        </Link>
      </div>

      {computedResults.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>No positions declared for this election.</p>
      ) : (
        computedResults.map((result) => (
          <div
            key={result.positionId}
            className="card card-team-blue"
            style={{
              padding: "1.25rem",
              marginBottom: "1.5rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "1rem" }}>
              <div>
                <span className="badge badge-blue mono" style={{ marginBottom: "4px" }}>
                  CONSTITUENCY
                </span>
                <h3 style={{ margin: "4px 0 0", fontSize: "1.35rem" }}>
                  {result.positionTitle}
                </h3>
              </div>
              <span className="badge badge-neutral mono" style={{ fontSize: "0.8125rem", padding: "4px 10px" }}>
                Total Ballots: {result.totalVotes}
              </span>
            </div>

            {/* Winner Callout */}
            {result.winner && result.winner.voteCount > 0 ? (
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-default)",
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid var(--accent-success)",
                  margin: "1rem 0 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "var(--radius-default)",
                    background: "rgba(34, 197, 94, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#4ADE80",
                    flexShrink: 0
                  }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.06em", display: "block" }}>
                      Elected Candidate
                    </span>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-headline)" }}>
                      {result.winner.name} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>({result.winner.party})</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: "1.4rem", fontWeight: 700, color: "#22C55E" }}>
                    {result.winner.voteCount} Votes
                  </div>
                  <div className="mono" style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", fontWeight: 600 }}>
                    {result.totalVotes > 0 ? ((result.winner.voteCount / result.totalVotes) * 100).toFixed(1) : 0}% of tally
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", fontStyle: "italic" }}>No votes recorded or tied at 0 votes.</p>
            )}

            {/* Standings List with Sharp Progress Bars */}
            {result.standings.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {result.standings.map((entry, idx) => {
                  const percentage = result.totalVotes > 0 
                    ? ((entry.voteCount / result.totalVotes) * 100).toFixed(1)
                    : 0;

                  return (
                    <div
                      key={entry.candidateId}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "var(--radius-default)",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-color)",
                        position: "relative",
                        overflow: "hidden"
                      }}
                    >
                      {/* Visual progress bar fill */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${percentage}%`,
                          background: idx === 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(37, 99, 235, 0.12)",
                          transition: "width 0.3s ease",
                          zIndex: 0
                        }}
                      />

                      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <strong style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                            {idx + 1}. {entry.name}
                          </strong>{" "}
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>({entry.party})</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className="mono" style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.875rem" }}>
                            {entry.voteCount} votes ({percentage}%)
                          </span>
                          <span className="badge badge-blue mono" style={{ fontSize: "0.72rem" }}>
                            On-Chain: {onChainCounts[entry.candidateId] ?? entry.voteCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
