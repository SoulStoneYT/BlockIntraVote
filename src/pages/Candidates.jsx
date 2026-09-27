import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";
import useNotification from "../hooks/useNotification";
import blockchainService from "../blockchain/blockchainService";
import { getOptimizedCloudinaryUrl } from "../services/cloudinaryService";

const FALLBACK_AVATAR =
  "https://res.cloudinary.com/demo/image/upload/v1/samples/people/smiling-man.jpg";

export default function Candidates() {
  const { id } = useParams(); // position id
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [candidates, setCandidates] = useState([]);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [votingId, setVotingId] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "candidates"));

        const list = querySnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(candidate => candidate.positionId === id)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        setCandidates(list);
      } catch (err) {
        console.error("Error loading candidates:", err);
      }
    };

    const checkIfVoted = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const votedPositions = userDoc.data().votedPositions || [];

        if (votedPositions.includes(id)) {
          setAlreadyVoted(true);
        }
      }
    };

    fetchCandidates();
    checkIfVoted();
  }, [id]);

  const handleVote = async (candidateId) => {
    const user = auth.currentUser;
    if (!user) return;

    if (alreadyVoted) {
      showNotification("You have already voted for this position.", "warning");
      return;
    }

    setVotingId(candidateId);
    try {
      // 1. Cast Vote on Ethereum Smart Contract
      let blockchainReceipt = null;
      try {
        blockchainReceipt = await blockchainService.castVoteOnChain(id, candidateId, user.uid);
        showNotification(
          `Ballot Mined on Block #${blockchainReceipt.blockNumber}!`,
          "success"
        );
      } catch (bcError) {
        console.warn("Blockchain transaction note:", bcError.message);
        if (bcError.message.includes("already") || bcError.message.includes("Guard")) {
          showNotification(bcError.message, "error");
          setVotingId(null);
          return;
        }
      }

      // 2. Save vote to Firestore with blockchain receipt
      await addDoc(collection(db, "votes"), {
        positionId: id,
        candidateId: candidateId,
        userId: user.uid,
        timestamp: new Date(),
        onChainVerified: !!blockchainReceipt,
        txHash: blockchainReceipt ? blockchainReceipt.txHash : null,
        blockNumber: blockchainReceipt ? blockchainReceipt.blockNumber : null,
        voterHash: blockchainReceipt ? blockchainReceipt.voterHash : null
      });

      // Update user votedPositions
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const votedPositions = userDoc.data().votedPositions || [];

      await updateDoc(userRef, {
        votedPositions: [...votedPositions, id]
      });

      setAlreadyVoted(true);
      showNotification("Vote recorded and verified on-chain!", "success");

    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem 3rem" }}>
      {/* Top Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
        <button
          onClick={() => navigate("/positions")}
          className="btn btn-tertiary"
          style={{ minHeight: "36px", padding: "0 12px", fontSize: "0.8rem" }}
        >
          <ArrowLeft size={14} />
          <span>Back to Positions</span>
        </button>

        {alreadyVoted && (
          <div className="badge badge-green" style={{ padding: "6px 12px", fontSize: "0.75rem" }}>
            <CheckCircle2 size={13} />
            <span>Ballot Cast for this Position</span>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div className="badge badge-blue" style={{ marginBottom: "8px" }}>
          <Shield size={12} />
          <span>NOMINEE ROSTER</span>
        </div>
        <h1 style={{ margin: "0 0 0.35rem" }}>Candidates for Position</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9375rem" }}>
          Inspect candidate manifestos and confirm your selection.
        </p>
      </div>

      {candidates.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          No candidates found for this position.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {candidates.map(candidate => {
            const avatarSrc = candidate.photo
              ? getOptimizedCloudinaryUrl(candidate.photo, 200)
              : FALLBACK_AVATAR;

            return (
              <div
                key={candidate.id}
                className="card card-team-red"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "1.25rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={avatarSrc}
                        alt={candidate.name}
                        style={{ width: "42px", height: "42px", borderRadius: "var(--radius-full)", objectFit: "cover", border: "1px solid var(--border-color)" }}
                        onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
                      />
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{candidate.name}</h3>
                        {candidate.party && (
                          <span style={{ fontSize: "0.75rem", color: "var(--accent-warning)", textTransform: "uppercase", fontWeight: 600 }}>
                            {candidate.party}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="badge badge-blue mono" style={{ fontSize: "0.7rem" }}>
                      #{candidate.id.substring(0, 6)}
                    </span>
                  </div>

                  <p style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    minHeight: "56px",
                    background: "var(--bg-elevated)",
                    padding: "10px",
                    borderRadius: "var(--radius-default)",
                    border: "1px solid var(--border-color)",
                    margin: "0 0 1rem"
                  }}>
                    "{candidate.motto || candidate.manifesto || "Dedicated to collegiate excellence and transparent governance."}"
                  </p>
                </div>

                <button
                  disabled={alreadyVoted || votingId === candidate.id}
                  onClick={() => handleVote(candidate.id)}
                  className={`btn ${alreadyVoted ? "btn-tertiary" : "btn-primary"}`}
                  style={{ width: "100%", minHeight: "44px" }}
                >
                  {votingId === candidate.id
                    ? "Signing on Chain..."
                    : alreadyVoted
                    ? "Already Voted"
                    : `Vote for ${candidate.name}`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}