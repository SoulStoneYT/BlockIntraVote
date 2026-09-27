import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "positions"));
        const list = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((pos) => pos.isActive !== false)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        setPositions(list);
      } catch (err) {
        console.error("Error loading positions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "0 1rem 3rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div className="badge badge-blue" style={{ marginBottom: "8px" }}>
          <Layers size={12} />
          <span>ACTIVE CONSTITUENCIES</span>
        </div>

        <h1 style={{ margin: "0 0 0.35rem" }}>Select Position to Vote</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
          Choose an election category in commission-designated order to inspect candidates and cast your ballot.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
          Loading active election positions...
        </div>
      ) : positions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No active voting positions configured by the election commission yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {positions.map((position, idx) => (
            <div
              key={position.id}
              onClick={() => navigate(`/position/${position.id}`)}
              className="card card-team-red"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                padding: "1rem 1.25rem",
                transition: "border-color 120ms ease, box-shadow 120ms ease",
                minHeight: "64px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-primary)";
                e.currentTarget.style.boxShadow = "var(--glow-red-sm)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                  <span className="badge badge-blue" style={{ fontFamily: "var(--font-mono)" }}>
                    BALLOT #{idx + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
                    {position.title}
                  </h3>
                </div>

                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {position.description || "Tap to view nominated candidates and cast ballot"}
                </span>
              </div>

              <div style={{
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "var(--radius-default)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-color)",
                marginLeft: "12px",
                flexShrink: 0
              }}>
                <ArrowRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}