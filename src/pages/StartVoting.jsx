import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Pause, XCircle, Clock, ArrowRight } from "lucide-react";
import ElectionTimer from "../components/ElectionTimer";
import useNotification from "../hooks/useNotification";
import { isValidCollegeEmail } from "../utils/authUtils";

export default function StartVoting() {
  const [loading, setLoading] = useState(false);
  const [electionStatus, setElectionStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    let unsubscribeElection = null;

    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/");
        return;
      }

      if (!isValidCollegeEmail(user.email)) {
        await signOut(auth);
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
      
      // Redirect if already voted
      if (data.votingSessionCompleted === true) {
        navigate("/already-voted");
        return;
      }
      
      // Redirect if already started voting
      if (data.votingSessionStarted === true) {
        navigate("/voting-session");
        return;
      }
      
      // Redirect if profile not complete
      if (!data.department || !data.year || !data.dob) {
        navigate("/complete-profile");
        return;
      }

      // Listen to election status in real-time
      const electionDocRef = doc(db, "settings", "election");
      unsubscribeElection = onSnapshot(
        electionDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const electionData = docSnap.data();
            setElectionStatus(electionData.electionStatus || "not_started");
          } else {
            setElectionStatus("not_started");
          }
          setCheckingStatus(false);
        },
        (error) => {
          console.error("Error listening to election status:", error);
          setElectionStatus("not_started");
          setCheckingStatus(false);
        }
      );
    };

    checkUserStatus();

    return () => {
      if (unsubscribeElection) {
        unsubscribeElection();
      }
    };
  }, [navigate]);

  const handleStartVoting = async () => {
    if (electionStatus !== "active") {
      showNotification("Voting is not currently active. Please wait for the Returning Officer to commence the election.", "warning");
      return;
    }

    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      
      await updateDoc(docRef, {
        votingSessionStarted: true,
        sessionStartTime: serverTimestamp()
      });

      navigate("/voting-session");
    } catch (error) {
      console.error("Error starting voting session:", error);
      showNotification("Failed to start voting session. Please try again.", "error");
      setLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (checkingStatus) return null;
    
    switch (electionStatus) {
      case "active":
        return {
          icon: <CheckCircle2 size={16} color="#22C55E" />,
          color: "#4ADE80",
          bg: "rgba(34, 197, 94, 0.15)",
          border: "#22C55E",
          text: "ELECTION ACTIVE - Cryptographic ballot booth is open"
        };
      case "paused":
        return {
          icon: <Pause size={16} color="#F59E0B" />,
          color: "#FBBF24",
          bg: "rgba(245, 158, 11, 0.15)",
          border: "#F59E0B",
          text: "ELECTION PAUSED - Voting temporarily suspended by Returning Officer"
        };
      case "ended":
        return {
          icon: <XCircle size={16} color="#DC2626" />,
          color: "#F87171",
          bg: "rgba(220, 38, 38, 0.15)",
          border: "#DC2626",
          text: "ELECTION CONCLUDED - Polls are officially sealed"
        };
      default:
        return {
          icon: <Clock size={16} color="#A3A3A3" />,
          color: "var(--text-muted)",
          bg: "var(--bg-elevated)",
          border: "var(--border-color)",
          text: "ELECTION SCHEDULED - Standby for official session start"
        };
    }
  };

  const statusInfo = getStatusMessage();
  const canVote = electionStatus === "active" && !loading;

  return (
    <div style={{
      maxWidth: "600px",
      margin: "2rem auto",
      padding: "0 1rem"
    }}>
      <div className="card card-team-red" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
        {/* Main Countdown Timer */}
        <div style={{ marginBottom: "1.5rem" }}>
          <ElectionTimer />
        </div>
        
        <h2 style={{ margin: "0 0 0.5rem" }}>Ready to Cast Your Ballot?</h2>
        
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "0.9375rem",
          lineHeight: 1.6,
          maxWidth: "460px",
          margin: "0 auto 1.5rem"
        }}>
          Initiating the session starts a timed cryptographic ballot window. You will vote sequentially on each certified constituency.
        </p>

        {statusInfo && (
          <div style={{
            color: statusInfo.color,
            backgroundColor: statusInfo.bg,
            padding: "10px 14px",
            borderRadius: "var(--radius-default)",
            marginBottom: "1.75rem",
            border: `1px solid ${statusInfo.border}`,
            fontWeight: 600,
            fontSize: "0.8125rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            letterSpacing: "0.04em",
            textTransform: "uppercase"
          }}>
            {statusInfo.icon}
            <span>{statusInfo.text}</span>
          </div>
        )}

        <button 
          onClick={handleStartVoting}
          disabled={!canVote}
          className="btn btn-primary"
          style={{
            minHeight: "48px",
            padding: "0 2rem",
            fontSize: "0.9375rem",
            width: "100%",
            maxWidth: "340px",
            margin: "0 auto"
          }}
        >
          <span>{loading ? "Initializing Ballot..." : "Initiate Voting Session"}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
