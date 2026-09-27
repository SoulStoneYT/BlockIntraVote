import { useState, useEffect, useCallback } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Pause, AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import ElectionTimer from "../components/ElectionTimer";
import CandidateCard from "../components/CandidateCard";
import useNotification from "../hooks/useNotification";
import blockchainService from "../blockchain/blockchainService";

const TOTAL_TIME = 600; // 10 minutes in seconds

export default function VotingSession() {
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(TOTAL_TIME);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [votedCandidateId, setVotedCandidateId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Prevent browser back navigation
  useEffect(() => {
    const preventBack = (e) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", preventBack);
    return () => window.removeEventListener("popstate", preventBack);
  }, []);

  // Subscribe to election status changes in real-time
  useEffect(() => {
    const electionDocRef = doc(db, "settings", "election");
    const unsubscribe = onSnapshot(electionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const status = docSnap.data().electionStatus;
        
        if (status === "paused") {
          setIsPaused(true);
        } else if (status === "active") {
          setIsPaused(false);
        }
        
        if (status === "ended") {
          setIsEnded(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Check user status and load positions
  useEffect(() => {
    const initializeSession = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        navigate("/");
        return;
      }

      const data = docSnap.data();

      // Security checks
      if (data.role === "admin") {
        navigate("/admin");
        return;
      }

      if (data.votingSessionCompleted === true) {
        navigate("/already-voted");
        return;
      }

      if (data.votingSessionStarted !== true) {
        navigate("/start-voting");
        return;
      }

      // Calculate remaining time
      if (data.sessionStartTime) {
        const startTime = data.sessionStartTime.toDate ? data.sessionStartTime.toDate() : new Date(data.sessionStartTime);
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const remaining = TOTAL_TIME - elapsed;

        if (remaining <= 0) {
          await updateDoc(docRef, {
            votingSessionCompleted: true
          });
          navigate("/already-voted");
          return;
        }

        setRemainingTime(remaining);
      }

      // Fetch active positions
      const positionsQuery = query(collection(db, "positions"), where("isActive", "==", true));
      const positionsSnapshot = await getDocs(positionsQuery);
      
      const positionsData = positionsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      
      // Filter out already voted positions and sort by ballot sequence
      const votedPositions = data.votedPositions || [];
      const remainingPositions = positionsData
        .filter(p => !votedPositions.includes(p.id))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      
      setPositions(remainingPositions);
      setLoading(false);
    };

    initializeSession();
  }, [navigate]);

  // Fetch candidates for current position and sort by ballot order
  useEffect(() => {
    const fetchCandidates = async () => {
      if (positions.length === 0) return;

      const currentPosition = positions[currentIndex];
      if (!currentPosition) return;

      const candidatesQuery = query(
        collection(db, "candidates"), 
        where("positionId", "==", currentPosition.id)
      );
      const candidatesSnapshot = await getDocs(candidatesQuery);
      
      const candidatesData = candidatesSnapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      
      setCandidates(candidatesData);
    };

    fetchCandidates();
  }, [currentIndex, positions]);

  // Timer countdown
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(async () => {
      if (isPaused) return;

      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          const completeVoting = async () => {
            const user = auth.currentUser;
            if (user) {
              const docRef = doc(db, "users", user.uid);
              await updateDoc(docRef, {
                votingSessionCompleted: true
              });
            }
            navigate("/already-voted");
          };
          completeVoting();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, navigate, isPaused]);

  const handleVote = useCallback(async (candidateId) => {
    if (voting || positions.length === 0 || isPaused) return;
    
    setVoting(true);
    setVotedCandidateId(candidateId);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setVoting(false);
        setVotedCandidateId(null);
        return;
      }

      const currentPosition = positions[currentIndex];

      // 1. Cast Vote on Ethereum Smart Contract
      let blockchainReceipt = null;
      try {
        blockchainReceipt = await blockchainService.castVoteOnChain(
          currentPosition.id,
          candidateId,
          user.uid
        );
        showNotification(
          `Ballot Mined on Block #${blockchainReceipt.blockNumber}! Tx: ${blockchainReceipt.txHash.substring(0, 10)}...`,
          "success"
        );
      } catch (bcError) {
        console.warn("Blockchain transaction note:", bcError.message);
        if (bcError.message.includes("already") || bcError.message.includes("Guard")) {
          showNotification(bcError.message, "error");
          setVoting(false);
          setVotedCandidateId(null);
          return;
        }
        showNotification("Vote cast and recorded on fallback ledger.", "warning");
      }
      
      // 2. Save vote to Firestore with cryptographic receipt
      await addDoc(collection(db, "votes"), {
        positionId: currentPosition.id,
        candidateId: candidateId,
        userId: user.uid,
        timestamp: new Date(),
        onChainVerified: !!blockchainReceipt,
        txHash: blockchainReceipt ? blockchainReceipt.txHash : null,
        blockNumber: blockchainReceipt ? blockchainReceipt.blockNumber : null,
        voterHash: blockchainReceipt ? blockchainReceipt.voterHash : null
      });

      // Update user's votedPositions
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const currentVotedPositions = userDoc.data().votedPositions || [];
      
      await updateDoc(userDocRef, {
        votedPositions: [...currentVotedPositions, currentPosition.id]
      });

      // Move to next position or complete
      if (currentIndex < positions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setVoting(false);
        setVotedCandidateId(null);
      } else {
        await updateDoc(userDocRef, {
          votingSessionCompleted: true
        });
        navigate("/already-voted");
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      showNotification("Failed to cast vote. Please try again.", "error");
      setVoting(false);
      setVotedCandidateId(null);
    }
  }, [voting, positions, currentIndex, navigate, isPaused, showNotification]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading ballot constituency...
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "70vh",
        textAlign: "center",
        padding: "20px"
      }}>
        <h2>No Active Positions</h2>
        <p style={{ color: "var(--text-muted)" }}>There are no active voting positions configured for this session.</p>
      </div>
    );
  }

  const currentPosition = positions[currentIndex];
  const progress = ((currentIndex) / positions.length) * 100;
  const canVote = !isPaused;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem 1rem 3rem" }}>
      {/* Pause Banner */}
      {isPaused && !isEnded && (
        <div style={{
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          border: "1px solid var(--accent-warning)",
          color: "#FBBF24",
          padding: "10px 14px",
          borderRadius: "var(--radius-default)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.875rem",
          fontWeight: 700,
          marginBottom: "1rem"
        }}>
          <Pause size={16} />
          <span>VOTING TEMPORARILY PAUSED - Please standby. The Returning Officer will resume voting shortly.</span>
        </div>
      )}

      {/* Election Ended Banner */}
      {isEnded && (
        <div style={{
          backgroundColor: "rgba(220, 38, 38, 0.15)",
          border: "1px solid var(--accent-error)",
          color: "#F87171",
          padding: "10px 14px",
          borderRadius: "var(--radius-default)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.875rem",
          fontWeight: 700,
          marginBottom: "1rem"
        }}>
          <AlertTriangle size={16} />
          <span>Election Concluded - You may complete your current position ballot before your timer expires.</span>
        </div>
      )}

      {/* Control Ribbon (design.md: 4px radius, #141414, Anton title) */}
      <div className="card card-team-blue" style={{ marginBottom: "1.5rem", padding: "1rem 1.25rem" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "0.75rem"
        }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: "4px" }}>
              <span>STEP {currentIndex + 1} OF {positions.length}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: "1.75rem" }}>
              {currentPosition?.title || "Loading position..."}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <ElectionTimer compact />

            {/* Individual session timer */}
            <div style={{
              background: remainingTime <= 60 ? "rgba(220, 38, 38, 0.15)" : "rgba(34, 197, 94, 0.15)",
              border: `1px solid ${remainingTime <= 60 ? "#DC2626" : "#22C55E"}`,
              color: remainingTime <= 60 ? "#F87171" : "#4ADE80",
              padding: "4px 10px",
              borderRadius: "var(--radius-xs)",
              fontSize: "0.8125rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <Clock size={13} />
              <span>SESSION: {formatTime(remainingTime)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar (design.md sharp track with dynamic glow) */}
        <div style={{
          height: "4px",
          borderRadius: "var(--radius-xs)",
          backgroundColor: "var(--border-color)",
          overflow: "hidden"
        }}>
          <div style={{
            height: "100%",
            width: `${progress}%`,
            backgroundColor: "var(--accent-primary)",
            boxShadow: progress > 0 ? "0 0 10px rgba(220, 38, 38, 0.7)" : "none",
            transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
          }} />
        </div>
      </div>

      {/* Main Ballot Area with Step Slide Animation */}
      <div key={currentPosition?.id || currentIndex} className="step-slide-container">
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9rem",
          marginBottom: "1rem",
          textAlign: "center"
        }}>
          Review certified nominee manifestos and click <strong>Vote</strong> to cast your verified cryptographic ballot.
        </p>

        {/* Candidates Cards */}
        <div className="candidate-grid" style={{ opacity: canVote ? 1 : 0.7 }}>
          {candidates.map((candidate, idx) => (
            <CandidateCard
              key={candidate.id}
              index={idx}
              candidate={candidate}
              onVote={handleVote}
              canVote={canVote}
              voting={voting}
              isVotedFor={voting && votedCandidateId === candidate.id}
              isOtherVoting={voting && votedCandidateId !== null && votedCandidateId !== candidate.id}
            />
          ))}
        </div>

        {/* Footnote */}
        <div style={{
          textAlign: "center",
          marginTop: "2rem",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          <ShieldCheck size={14} color="#22C55E" />
          <span>Position {currentIndex + 1} of {positions.length} · Ballots sealed with Keccak-256</span>
        </div>
      </div>
    </div>
  );
}
