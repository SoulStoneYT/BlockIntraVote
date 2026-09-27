import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { db } from "../firebase";
import { BarChart3 } from "lucide-react";

// Adapted design.md palette for vote distribution charts
const CHART_COLORS = [
  "#2563EB", // Electric Blue
  "#DC2626", // Red Primary
  "#22C55E", // Success Green
  "#F59E0B", // Warning Amber
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#64748B"  // Slate
];

export default function LiveVoteStats({ positions = [], candidates = [] }) {
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const votesRef = collection(db, "votes");

    const unsubscribe = onSnapshot(votesRef, (snapshot) => {
      const allVotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVotes(allVotes);
    });

    return () => unsubscribe();
  }, []);

  const statsByPosition = useMemo(() => {
    return positions
      .map((position) => {
        const positionCandidates = candidates.filter((c) => c.positionId === position.id);

        const chartData = positionCandidates
          .map((candidate) => {
            const count = votes.filter(
              (vote) =>
                vote.positionId === position.id && vote.candidateId === candidate.id
            ).length;

            return {
              name: candidate.name,
              value: count,
              party: candidate.party || "Independent"
            };
          })
          .filter((row) => row.value > 0);

        const totalVotes = chartData.reduce((sum, row) => sum + row.value, 0);

        return {
          positionId: position.id,
          positionTitle: position.title,
          chartData,
          totalVotes
        };
      })
      .filter((item) => item.chartData.length > 0);
  }, [positions, candidates, votes]);

  const totalVotesOverall = votes.length;

  return (
    <section className="admin-section">
      <div className="admin-card" style={{ padding: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={18} style={{ color: "var(--accent-secondary)" }} />
            <h3 style={{
              margin: 0,
              fontFamily: "var(--font-headline)",
              fontSize: "1.15rem",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              color: "var(--text-primary)"
            }}>
              Live Vote Distribution
            </h3>
          </div>
          <span
            className="badge badge-neutral"
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", padding: "4px 10px" }}
          >
            Total Votes Cast: <strong>{totalVotesOverall}</strong>
          </span>
        </div>

        {statsByPosition.length === 0 ? (
          <p style={{ color: "var(--text-muted)", margin: "1rem 0 0", fontSize: "0.85rem" }}>
            No vote data recorded yet. Charts will populate automatically as ballots are mined on chain.
          </p>
        ) : (
          <div className="live-stats-grid">
            {statsByPosition.map((item) => (
              <div key={item.positionId} className="live-stats-card" style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-default)",
                padding: "1rem"
              }}>
                <h4 style={{
                  marginTop: 0,
                  marginBottom: "4px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-headline)",
                  fontSize: "1rem",
                  letterSpacing: "0.02em"
                }}>
                  {item.positionTitle}
                </h4>
                <p style={{ marginTop: 0, color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                  Total Ballots: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{item.totalVotes}</strong>
                </p>

                <div className="live-chart-wrap" style={{ height: "200px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={item.chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={32}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {item.chartData.map((entry, index) => (
                          <Cell
                            key={`${entry.name}-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                            stroke="var(--bg-surface)"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--bg-surface)",
                          borderColor: "var(--border-color)",
                          borderRadius: "var(--radius-default)",
                          color: "var(--text-primary)",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
                          fontSize: "0.8rem",
                          fontFamily: "var(--font-body)"
                        }}
                        itemStyle={{ color: "var(--text-primary)" }}
                      />
                      <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
