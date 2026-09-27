import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { CheckCircle2, BarChart3, FileText, LogOut, Clock, ShieldCheck } from "lucide-react";

export default function AlreadyVoted() {
  const navigate = useNavigate();
  const [resultsPublished, setResultsPublished] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchVoterStatus = async () => {
      try {
        const electionDocRef = doc(db, "settings", "election");
        const electionDocSnap = await getDoc(electionDocRef);

        if (electionDocSnap.exists()) {
          setResultsPublished(electionDocSnap.data().resultsPublished === true);
        }

        if (auth.currentUser) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserData(userSnap.data());
          }
        }
      } catch (error) {
        console.error("Failed to check voter status:", error);
      }
    };

    fetchVoterStatus();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{
      maxWidth: "640px",
      margin: "2.5rem auto",
      padding: "0 1rem"
    }}>
      <div className="card card-team-green" style={{
        textAlign: "center",
        padding: "2.5rem 1.5rem"
      }}>
        {/* Verification Shield Emblem */}
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-default)",
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          border: "2px solid #22C55E",
          boxShadow: "0 0 12px rgba(34, 197, 94, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
          color: "#4ADE80"
        }}>
          <CheckCircle2 size={28} />
        </div>

        <div className="badge badge-green" style={{ marginBottom: "1rem" }}>
          <ShieldCheck size={12} />
          <span>OFFICIAL DIGITAL BALLOT RECEIPT</span>
        </div>

        <h2 style={{ margin: "0 0 0.5rem" }}>
          Your Ballot is Sealed on Chain
        </h2>

        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          maxWidth: "480px",
          margin: "0 auto 1.75rem"
        }}>
          Thank you for participating in the collegiate democratic process. Your vote has been recorded immutably on the Ethereum smart contract with cryptographic anonymity.
        </p>

        {/* Voter Receipt Details */}
        <div style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-default)",
          padding: "1.25rem",
          textAlign: "left",
          marginBottom: "1.75rem"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.8125rem" }}>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 600 }}>
                Voter Name
              </span>
              <strong style={{ color: "var(--text-primary)" }}>{userData?.name || "Verified Student"}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 600 }}>
                PRN / Roll No
              </span>
              <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {userData?.enrollmentNumber || "N/A"}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 600 }}>
                Ballot Status
              </span>
              <span className="badge badge-green">Mined & Certified</span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)", display: "block", textTransform: "uppercase", fontSize: "0.7rem", fontWeight: 600 }}>
                Consensus Network
              </span>
              <span className="badge badge-blue mono">Hardhat EVM (31337)</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
          {resultsPublished ? (
            <button
              onClick={() => navigate("/results")}
              className="btn btn-primary"
              style={{ minHeight: "44px", padding: "0 1.25rem" }}
            >
              <BarChart3 size={15} />
              <span>View Certified Results</span>
            </button>
          ) : (
            <div style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-default)",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "var(--accent-warning)",
              fontSize: "0.8125rem",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <Clock size={14} />
              <span>Official results will be published once voting concludes and the Returning Officer certifies the ledger.</span>
            </div>
          )}

          <Link
            to="/blockchain-explorer"
            className="btn btn-secondary"
            style={{ minHeight: "44px", padding: "0 1.25rem" }}
          >
            <FileText size={15} />
            <span>Verify on Blockchain Explorer</span>
          </Link>

          <button
            onClick={handleLogout}
            className="btn btn-tertiary"
            style={{ minHeight: "44px", padding: "0 1.25rem" }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
