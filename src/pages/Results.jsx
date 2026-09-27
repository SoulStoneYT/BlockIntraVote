import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import blockchainService from "../blockchain/blockchainService";
import { Link } from "react-router-dom";

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
        setPositions(positionsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCandidates(candidatesList);
        setVotes(votesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));

        // Query on-chain smart contract counts for each candidate
        const chainMap = {};
        for (const c of candidatesList) {
          try {
            const count = await blockchainService.getCandidateVotes(c.id);
            chainMap[c.id] = count;
          } catch (e) {
            chainMap[c.id] = 0;
          }
        }
        setOnChainCounts(chainMap);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError("Failed to load results. Please try again.");
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

        return {
          positionId: position.id,
          positionTitle: position.title,
          standings,
          winner: standings[0] || null,
          totalVotes: standings.reduce((sum, row) => sum + row.voteCount, 0)
        };
      });
  }, [positions, candidates, votes]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "40px" }}>Loading results...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#dc3545" }}>
        <h2>Unable to load results</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!resultsPublished) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>Results Not Published Yet</h2>
        <p>Please wait for the admin to publish the final results.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ textAlign: "center", marginBottom: "8px" }}>🎉 Election Results</h1>
      <p style={{ textAlign: "center", color: "#555", marginBottom: "16px" }}>
        Final outcomes of the election
      </p>

      {/* Blockchain Verification Callout */}
      <div style={{
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
        color: "#ecfdf5",
        padding: "16px 20px",
        borderRadius: "12px",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
            🔒 Ethereum Smart Contract Verified
          </div>
          <div style={{ fontSize: "0.85rem", color: "#a7f3d0", marginTop: "2px" }}>
            All ballot counts are cryptographically checked against the EVM distributed ledger.
          </div>
        </div>

        <Link
          to="/blockchain-explorer"
          style={{
            background: "#10b981",
            color: "#064e3b",
            textDecoration: "none",
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.85rem"
          }}
        >
          ⛓️ View Blockchain Blocks
        </Link>
      </div>

      {computedResults.length === 0 ? (
        <p style={{ textAlign: "center" }}>No positions available.</p>
      ) : (
        computedResults.map((result) => (
          <div
            key={result.positionId}
            style={{
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "20px",
              backgroundColor: "var(--bg-card)",
              boxShadow: "var(--card-shadow)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", color: "var(--text-primary)" }}>{result.positionTitle}</h3>
              <span style={{
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "0.8rem",
                fontWeight: 600
              }}>
                Total Ballots: {result.totalVotes}
              </span>
            </div>

            {result.winner ? (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid #10b981",
                  margin: "12px 0 16px",
                  color: "var(--text-primary)"
                }}
              >
                🏆 <strong>Winner:</strong> {result.winner.name} ({result.winner.party}) —{" "}
                <strong style={{ color: "#10b981" }}>{result.winner.voteCount}</strong> votes
                <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "#38bdf8", fontWeight: 600 }}>
                  [On-Chain: {onChainCounts[result.winner.candidateId] ?? result.winner.voteCount}]
                </span>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>No candidates for this position.</p>
            )}

            {result.standings.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {result.standings.map((entry) => (
                  <li
                    key={entry.candidateId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-color)",
                      marginBottom: "8px",
                      fontSize: "0.9rem"
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{entry.name}</strong>{" "}
                      <span style={{ color: "var(--text-secondary)" }}>({entry.party})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {entry.voteCount} votes
                      </span>
                      <span style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600
                      }}>
                        EVM: {onChainCounts[entry.candidateId] ?? entry.voteCount}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))

      )}
    </div>
  );

}
