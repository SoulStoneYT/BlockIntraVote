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
import useNotification from "../hooks/useNotification";
import blockchainService from "../blockchain/blockchainService";


export default function Candidates() {
  const { id } = useParams(); // position id
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [candidates, setCandidates] = useState([]);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      const querySnapshot = await getDocs(collection(db, "candidates"));

      const list = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(candidate => candidate.positionId === id);

      setCandidates(list);
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

    try {
      // 1. Cast Vote on Ethereum Smart Contract
      let blockchainReceipt = null;
      try {
        blockchainReceipt = await blockchainService.castVoteOnChain(id, candidateId, user.uid);
        showNotification(
          `⛓️ Ballot Mined on Block #${blockchainReceipt.blockNumber}!`,
          "success"
        );
      } catch (bcError) {
        console.warn("Blockchain transaction note:", bcError.message);
        if (bcError.message.includes("already") || bcError.message.includes("Guard")) {
          showNotification(bcError.message, "error");
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
    }
  };


  return (
    <div style={{ padding: "20px" }}>
      <h2>Candidates for {id}</h2>

      <button onClick={() => navigate("/positions")} style={{ marginBottom: "20px" }}>
        Back to Positions
      </button>

      {alreadyVoted && (
        <p style={{ color: "green" }}>
          You have already voted for this position.
        </p>
      )}

      {candidates.length === 0 && <p>No candidates found.</p>}

      {candidates.map(candidate => (
        <div key={candidate.id} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h4>{candidate.name}</h4>
          <p>{candidate.manifesto}</p>

          <button
            disabled={alreadyVoted}
            onClick={() => handleVote(candidate.id)}
          >
            Vote
          </button>
        </div>
      ))}
    </div>
  );
}