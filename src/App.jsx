import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Vote from "./pages/Vote";
import Positions from "./pages/Positions";
import Candidates from "./pages/Candidates";
import AlreadyVoted from "./pages/AlreadyVoted";
import CompleteProfile from "./pages/CompleteProfile";
import StartVoting from "./pages/StartVoting";
import VotingSession from "./pages/VotingSession";
import Results from "./pages/Results";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import BlockchainStatusBadge from "./components/BlockchainStatusBadge";

function App() {
  return (
    <div>
      <div style={{ padding: "8px 16px", background: "#0f172a" }}>
        <BlockchainStatusBadge />
      </div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/position/:id" element={<Candidates />} />
        <Route path="/already-voted" element={<AlreadyVoted />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/start-voting" element={<StartVoting />} />
        <Route path="/voting-session" element={<VotingSession />} />
        <Route path="/results" element={<Results />} />
        <Route path="/blockchain-explorer" element={<BlockchainExplorer />} />
      </Routes>
    </div>
  );
}

export default App;

