import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Vote as VoteIcon, ArrowRight, LogOut } from "lucide-react";

export default function Vote() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div style={{ maxWidth: "560px", margin: "3rem auto", padding: "0 1rem" }}>
      <div className="card card-team-red" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div className="badge badge-blue" style={{ marginBottom: "12px" }}>
          <VoteIcon size={12} />
          <span>ACTIVE ELECTION SESSION</span>
        </div>

        <h2 style={{ margin: "0 0 0.5rem" }}>Voting Dashboard</h2>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          maxWidth: "420px",
          margin: "0 auto 1.75rem"
        }}>
          Access active candidate nominations, inspect manifestos, and cast your verified vote on the decentralized ledger.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/positions")}
            className="btn btn-primary"
            style={{ minHeight: "44px", padding: "0 1.5rem" }}
          >
            <span>Enter Voting Booth</span>
            <ArrowRight size={16} />
          </button>

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