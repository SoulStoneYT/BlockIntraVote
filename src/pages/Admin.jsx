import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  writeBatch
} from "firebase/firestore";
import ElectionControl from "./admin/ElectionControl";
import CandidateManagement from "./admin/CandidateManagement";
import LiveVoteStats from "../components/LiveVoteStats";
import useNotification from "../hooks/useNotification";
import useConfirm from "../hooks/useConfirm";
import defaultContractConfig from "../contracts/contractConfig.json";
import {
  ShieldCheck,
  Activity,
  BarChart3,
  LogOut,
  Users,
  Vote,
  TrendingUp,
  FileText,
  Plus,
  X,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit3,
  Trash2,
  ArrowRight,
  Copy,
  Check,
  Cloud,
  LayoutDashboard,
  MoreHorizontal,
  FlaskConical,
  Layers
} from "lucide-react";

const adminEmails = [
  "adityachaudhari237@nhitm.ac.in",
  "friend1@nhitm.ac.in",
  "user4@nhitm.ac.in"
];

export default function Admin() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { showConfirm } = useConfirm();

  // Core Data State
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [votes, setVotes] = useState([]);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);

  // Position form & inline editing
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [newPositionDescription, setNewPositionDescription] = useState("");
  const [editingPositionId, setEditingPositionId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Position drag and drop state
  const [draggedPositionId, setDraggedPositionId] = useState(null);
  const [dragOverPositionId, setDragOverPositionId] = useState(null);

  // Mobile Bottom Sheet "More" Drawer state
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

  const [loading, setLoading] = useState(true);

  // Security Role Guard: Ensure only authenticated admins can access this dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        showNotification("Please sign in with administrative credentials.", "warning");
        navigate("/");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const userData = docSnap.exists() ? docSnap.data() : null;
        const role = userData?.role;

        if (role !== "admin" && !adminEmails.includes(user.email)) {
          showNotification("Access denied: Administrative privileges required.", "error");
          navigate("/complete-profile");
          return;
        }
      } catch {
        if (!adminEmails.includes(user.email)) {
          navigate("/");
          return;
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, showNotification]);

  // Load Dashboard Data (Positions, Candidates, Votes, Users)
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Positions
      const positionsSnapshot = await getDocs(collection(db, "positions"));
      const positionsList = positionsSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setPositions(positionsList);

      // 2. Candidates
      const candidatesSnapshot = await getDocs(collection(db, "candidates"));
      const candidatesList = candidatesSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      setCandidates(candidatesList);

      // 3. Votes
      const votesSnapshot = await getDocs(collection(db, "votes"));
      const votesList = votesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setVotes(votesList);

      // 4. Registered Users
      const usersSnapshot = await getDocs(collection(db, "users"));
      setRegisteredUsersCount(usersSnapshot.size || 0);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showNotification("Error refreshing dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshData = async () => {
    await loadDashboardData();
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Add Position
  const handleAddPosition = async (e) => {
    e?.preventDefault();
    if (!newPositionTitle.trim()) {
      showNotification("Please enter a position title", "warning");
      return;
    }

    try {
      const newOrder = positions.length;
      await addDoc(collection(db, "positions"), {
        title: newPositionTitle.trim(),
        description: newPositionDescription.trim(),
        order: newOrder,
        isActive: true,
        createdAt: new Date()
      });

      setNewPositionTitle("");
      setNewPositionDescription("");
      setShowPositionForm(false);
      showNotification("Position added to ballot sequence!", "success");
      await refreshData();
    } catch (error) {
      console.error("Error adding position:", error);
      showNotification("Failed to add position", "error");
    }
  };

  // Reorder Position via Arrow Buttons (Mobile & Desktop)
  const handleMovePosition = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= positions.length) return;

    const updated = [...positions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Instant local update
    setPositions(updated);

    try {
      const batch = writeBatch(db);
      updated.forEach((pos, idx) => {
        batch.update(doc(db, "positions", pos.id), { order: idx });
      });
      await batch.commit();
      showNotification(`Sequence updated: "${temp.title}" moved to Step #${targetIndex + 1}.`, "info");
    } catch (err) {
      console.error("Error saving position order:", err);
      showNotification("Failed to save position order", "error");
      await refreshData();
    }
  };

  // Drag and Drop for Positions
  const handlePositionDragStart = (e, positionId) => {
    setDraggedPositionId(positionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", positionId);
  };

  const handlePositionDragOver = (e, positionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (positionId !== dragOverPositionId) {
      setDragOverPositionId(positionId);
    }
  };

  const handlePositionDrop = async (e, targetPosition) => {
    e.preventDefault();
    setDragOverPositionId(null);

    if (!draggedPositionId || draggedPositionId === targetPosition.id) {
      setDraggedPositionId(null);
      return;
    }

    const sourceIdx = positions.findIndex((p) => p.id === draggedPositionId);
    const targetIdx = positions.findIndex((p) => p.id === targetPosition.id);

    if (sourceIdx === -1 || targetIdx === -1) {
      setDraggedPositionId(null);
      return;
    }

    const updated = [...positions];
    const [moved] = updated.splice(sourceIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setPositions(updated);
    setDraggedPositionId(null);

    try {
      const batch = writeBatch(db);
      updated.forEach((pos, idx) => {
        batch.update(doc(db, "positions", pos.id), { order: idx });
      });
      await batch.commit();
      showNotification(`Position order saved: "${moved.title}" is now Step #${targetIdx + 1}.`, "info");
    } catch (err) {
      console.error("Error saving drag reorder:", err);
      showNotification("Failed to save position sequence", "error");
      await refreshData();
    }
  };

  // Inline Position Editing
  const handleStartEditPosition = (pos) => {
    setEditingPositionId(pos.id);
    setEditTitle(pos.title || "");
    setEditDescription(pos.description || "");
  };

  const handleCancelEditPosition = () => {
    setEditingPositionId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEditPosition = async (positionId) => {
    if (!editTitle.trim()) {
      showNotification("Position title cannot be empty", "warning");
      return;
    }

    try {
      await updateDoc(doc(db, "positions", positionId), {
        title: editTitle.trim(),
        description: editDescription.trim()
      });
      showNotification("Position updated successfully!", "success");
      setEditingPositionId(null);
      await refreshData();
    } catch (error) {
      console.error("Error updating position:", error);
      showNotification("Failed to update position", "error");
    }
  };

  // Toggle Position Active/Inactive
  const handleTogglePosition = async (position) => {
    try {
      await updateDoc(doc(db, "positions", position.id), {
        isActive: !position.isActive
      });
      await refreshData();
      showNotification(
        `Position "${position.title}" is now ${!position.isActive ? "Active" : "Inactive"}.`,
        "info"
      );
    } catch (error) {
      console.error("Error toggling position:", error);
      showNotification("Failed to update position status", "error");
    }
  };

  // Delete Position
  const handleDeletePosition = async (positionId) => {
    const positionCandidates = candidates.filter((c) => c.positionId === positionId);
    let promptMsg = "Are you sure you want to delete this position?";
    if (positionCandidates.length > 0) {
      promptMsg = `Warning: This position currently has ${positionCandidates.length} candidate(s) enrolled. Deleting it will leave their nomination records unassigned. Are you sure?`;
    }

    const confirmed = await showConfirm(promptMsg, {
      title: "Delete Election Position",
      confirmText: "Delete Position"
    });

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "positions", positionId));
      showNotification("Position removed from ballot schedule.", "info");
      await refreshData();
    } catch (error) {
      console.error("Error deleting position:", error);
      showNotification("Failed to delete position", "error");
    }
  };

  // Copy Contract Address helper
  const copyContractAddress = () => {
    navigator.clipboard.writeText(defaultContractConfig.address);
    setCopiedContract(true);
    showNotification("Contract address copied to clipboard!", "success");
    setTimeout(() => setCopiedContract(false), 2500);
  };

  // Smooth scroll helper for mobile navigation
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileMoreOpen(false);
  };

  if (loading) {
    return (
      <div className="admin-loading-screen" style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem"
      }}>
        <div className="spinner-large" />
        <p style={{ color: "var(--text-secondary)", fontFamily: "var(--font-headline)", letterSpacing: "0.03em" }}>
          INITIALIZING ELECTION COMMISSION COMMAND CENTER...
        </p>
      </div>
    );
  }

  // Calculate Metrics
  const activePositions = positions.filter((p) => p.isActive !== false).length;
  const votesCount = votes.length;
  const turnoutPercent =
    registeredUsersCount > 0 ? Math.min(100, Math.round((votesCount / registeredUsersCount) * 100)) : 0;

  // Recent 4 votes for audit preview
  const recentVotes = [...votes]
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
    .slice(0, 4);

  const contractShortAddr = `${defaultContractConfig.address.substring(0, 6)}...${defaultContractConfig.address.substring(
    defaultContractConfig.address.length - 4
  )}`;

  return (
    <div className="admin-page-container" style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "1rem 1rem 4rem",
      color: "var(--text-primary)"
    }}>
      {/* 1. COMPACT TOP SYSTEM BAR (Responsive, no wrap overflow) */}
      <header className="top-system-bar">
        <div className="system-status-tags">
          <div className="system-tag system-tag--blockchain" title="Connected to Local Hardhat Node">
            <span className="live-dot" />
            <span className="tag-label" style={{ fontFamily: "var(--font-mono)" }}>
              EVM Chain #{defaultContractConfig.chainId}
            </span>
          </div>

          <div className="system-tag system-tag--role" title="Authenticated Administrative Officer" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <ShieldCheck size={13} />
            <span>Chief Returning Officer</span>
          </div>
        </div>

        <div className="system-top-actions">
          <Link to="/blockchain-explorer" className="top-action-link" title="Audit Public Ledger" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Activity size={13} /> Ledger
          </Link>
          <Link to="/results" className="top-action-link" title="Election Standings" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <BarChart3 size={13} /> Standings
          </Link>
          <button type="button" onClick={handleLogout} className="top-signout-btn" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      {/* 2. ADMIN HEADING */}
      <div className="admin-page-heading" style={{ marginBottom: "1.5rem" }}>
        <div className="heading-sub" style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "var(--accent-secondary)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "4px"
        }}>
          Institutional Governance Portal · GIGW 3.0 Standard
        </div>
        <h1 className="heading-title" style={{
          fontFamily: "var(--font-headline)",
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          margin: "0 0 0.5rem"
        }}>
          Election Commission Administration
        </h1>
        <p className="heading-desc" style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          maxWidth: "760px"
        }}>
          Manage live ballot schedules, register verified candidate profiles, and monitor real-time cryptographic vote tallies.
        </p>
      </div>

      {/* 3. HERO ELECTION STATUS CARD */}
      <ElectionControl
        stats={{
          votesCast: votesCount,
          turnout: turnoutPercent,
          activePositions,
          totalPositions: positions.length
        }}
      />

      {/* 4. STATISTICS GRID (Clean 4-column desktop, 2x2 mobile) */}
      <section className="stats-metric-grid" aria-label="Election Key Metrics" style={{ marginTop: "1.5rem" }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon" style={{ color: "var(--accent-secondary)" }}><Users size={16} /></span>
            <span className="metric-label">Registered Voters</span>
          </div>
          <div className="metric-value" style={{ fontFamily: "var(--font-headline)" }}>{registeredUsersCount}</div>
          <span className="metric-footnote">Eligible student accounts</span>
        </div>

        <div className="metric-card" style={{ borderLeftColor: "var(--accent-primary)" }}>
          <div className="metric-header">
            <span className="metric-icon" style={{ color: "var(--accent-primary)" }}><Vote size={16} /></span>
            <span className="metric-label">Ballots Cast</span>
          </div>
          <div className="metric-value" style={{ fontFamily: "var(--font-headline)" }}>{votesCount}</div>
          <span className="metric-footnote">On-chain verified entries</span>
        </div>

        <div className="metric-card" style={{ borderLeftColor: "var(--accent-success)" }}>
          <div className="metric-header">
            <span className="metric-icon" style={{ color: "var(--accent-success)" }}><TrendingUp size={16} /></span>
            <span className="metric-label">Voter Turnout</span>
          </div>
          <div className="metric-value" style={{ fontFamily: "var(--font-headline)" }}>{turnoutPercent}%</div>
          <div className="turnout-progress-track">
            <div className="turnout-progress-fill" style={{ width: `${turnoutPercent}%` }} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeftColor: "var(--accent-warning)" }}>
          <div className="metric-header">
            <span className="metric-icon" style={{ color: "var(--accent-warning)" }}><FileText size={16} /></span>
            <span className="metric-label">Constituencies</span>
          </div>
          <div className="metric-value" style={{ fontFamily: "var(--font-headline)" }}>
            {activePositions}
            <span className="metric-value-sub">/{positions.length}</span>
          </div>
          <span className="metric-footnote">{candidates.length} total nominees</span>
        </div>
      </section>

      {/* 5. MANAGEMENT SECTION (Positions & Candidates) */}
      <div className="management-two-col-layout" style={{ marginTop: "1.5rem" }}>
        {/* Left Column: Manage Positions with Drag Handles and Mobile Touch Controls */}
        <section id="positions-management-section" className="admin-section-box">
          <div className="section-header-compact">
            <div>
              <h3 className="section-title">Ballot Positions</h3>
              <p className="section-subtitle">
                Sequence determines voter ballot steps. Drag handles or use touch arrows to arrange.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn primary"
              onClick={() => {
                setShowPositionForm(!showPositionForm);
                if (editingPositionId) handleCancelEditPosition();
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {showPositionForm ? (
                <>
                  <X size={14} /> Cancel
                </>
              ) : (
                <>
                  <Plus size={14} /> Add Position
                </>
              )}
            </button>
          </div>

          {/* Add Position Form */}
          {showPositionForm && (
            <div className="admin-card add-position-form-card" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <Layers size={16} style={{ color: "var(--accent-primary)" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-primary)", fontFamily: "var(--font-headline)", letterSpacing: "0.02em" }}>
                  Add New Election Position
                </h4>
              </div>
              <form onSubmit={handleAddPosition} style={{ display: "grid", gap: "10px" }}>
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Position Title (e.g. President, Vice President)"
                  value={newPositionTitle}
                  onChange={(e) => setNewPositionTitle(e.target.value)}
                  autoFocus
                  required
                />
                <input
                  className="admin-input"
                  type="text"
                  placeholder="Eligibility or Instructions (Optional, e.g. Open to 3rd & 4th Year)"
                  value={newPositionDescription}
                  onChange={(e) => setNewPositionDescription(e.target.value)}
                />
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="admin-btn tertiary"
                    onClick={() => setShowPositionForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Plus size={14} /> Save Position
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Positions List */}
          {positions.length === 0 ? (
            <div className="admin-card empty-card" style={{ marginTop: "1rem" }}>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No voting positions configured yet. Click <strong>"+ Add Position"</strong> above.
              </p>
            </div>
          ) : (
            <div className="positions-list-container" style={{ marginTop: "1rem" }}>
              {positions.map((position, index) => {
                const isEditing = editingPositionId === position.id;
                const candidateCount = candidates.filter((c) => c.positionId === position.id).length;
                const isDragged = draggedPositionId === position.id;
                const isDragOver = dragOverPositionId === position.id;

                return (
                  <div
                    key={position.id}
                    className={`position-row-item ${isDragged ? "is-dragged" : ""} ${
                      isDragOver ? "is-drag-over" : ""
                    }`}
                    draggable={!isEditing}
                    onDragStart={(e) => handlePositionDragStart(e, position.id)}
                    onDragOver={(e) => handlePositionDragOver(e, position.id)}
                    onDrop={(e) => handlePositionDrop(e, position)}
                  >
                    {isEditing ? (
                      /* Inline Edit Form */
                      <div className="inline-edit-position-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <span className="step-badge" style={{ fontFamily: "var(--font-mono)" }}>
                            Step #{index + 1}
                          </span>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            Editing Position
                          </strong>
                        </div>
                        <input
                          className="admin-input"
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Position Title"
                          required
                        />
                        <input
                          className="admin-input"
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Instructions / Eligibility (Optional)"
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                          <button
                            type="button"
                            className="admin-btn tertiary"
                            onClick={handleCancelEditPosition}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="admin-btn primary"
                            onClick={() => handleSaveEditPosition(position.id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Row */
                      <>
                        <div className="position-main-info">
                          {/* Drag Handle & Touch Arrow Column */}
                          <div className="position-drag-col">
                            <div
                              className="drag-handle"
                              title="Drag to change voter ballot sequence"
                              aria-label="Drag handle"
                            >
                              <GripVertical size={16} />
                            </div>
                            <div className="mobile-order-arrows">
                              <button
                                type="button"
                                className="arrow-btn"
                                disabled={index === 0}
                                onClick={() => handleMovePosition(index, "up")}
                                aria-label={`Move ${position.title} up`}
                                title="Move up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <span className="step-badge" style={{ fontFamily: "var(--font-mono)" }}>
                                #{index + 1}
                              </span>
                              <button
                                type="button"
                                className="arrow-btn"
                                disabled={index === positions.length - 1}
                                onClick={() => handleMovePosition(index, "down")}
                                aria-label={`Move ${position.title} down`}
                                title="Move down"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Position Details */}
                          <div className="position-text-details">
                            <div className="position-title-row">
                              <strong className="position-name">{position.title}</strong>
                              <span
                                className={`status-pill ${
                                  position.isActive !== false ? "status-pill--active" : "status-pill--inactive"
                                }`}
                              >
                                {position.isActive !== false ? "Active" : "Inactive"}
                              </span>
                              <span className="candidate-count-tag" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Users size={12} /> {candidateCount} nominee{candidateCount !== 1 ? "s" : ""}
                              </span>
                            </div>

                            {position.description && (
                              <p className="position-desc">{position.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Position Action Buttons */}
                        <div className="position-actions-bar">
                          <button
                            type="button"
                            className="action-icon-btn edit"
                            onClick={() => handleStartEditPosition(position)}
                            title="Edit Title and Description"
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn secondary"
                            onClick={() => handleTogglePosition(position)}
                            title={position.isActive !== false ? "Deactivate position" : "Activate position"}
                          >
                            {position.isActive !== false ? "Pause" : "Activate"}
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn delete"
                            onClick={() => handleDeletePosition(position.id)}
                            title="Delete position"
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Column: Candidate Management (Cloudinary upload, drag handles, search/filter) */}
        <CandidateManagement
          positions={positions}
          candidates={candidates}
          onRefresh={refreshData}
        />
      </div>

      {/* 6. RECENT ACTIVITY & AUDIT SUMMARY */}
      <section className="admin-section-box" style={{ marginTop: "1.5rem" }}>
        <div className="section-header-compact">
          <div>
            <h3 className="section-title">Cryptographic Ledger Activity</h3>
            <p className="section-subtitle">Real-time chronologic record of recently mined student ballots</p>
          </div>
          <Link to="/blockchain-explorer" className="admin-btn secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            View Full Audit Ledger <ArrowRight size={14} />
          </Link>
        </div>

        {recentVotes.length === 0 ? (
          <div className="admin-card empty-card" style={{ marginTop: "1rem" }}>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No votes recorded yet. Cast ballots will appear here with cryptographic Keccak-256 voter hashes.
            </p>
          </div>
        ) : (
          <div className="recent-activity-list" style={{ marginTop: "1rem" }}>
            {recentVotes.map((v) => {
              const matchedPos = positions.find((p) => p.id === v.positionId);
              const matchedCand = candidates.find((c) => c.id === v.candidateId);
              const voterShort = v.voterHash
                ? `${v.voterHash.substring(0, 10)}...${v.voterHash.substring(v.voterHash.length - 6)}`
                : `User #${v.userId?.substring(0, 6)}...`;

              return (
                <div key={v.id} className="activity-row">
                  <div className="activity-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Activity size={16} style={{ color: "var(--accent-secondary)" }} />
                  </div>
                  <div className="activity-details">
                    <div className="activity-title-line">
                      <span className="activity-voter" style={{ fontFamily: "var(--font-mono)" }}>{voterShort}</span>
                      <span className="activity-badge badge badge-green">Ballot Mined</span>
                    </div>
                    <div className="activity-meta">
                      <span>Position: <strong>{matchedPos?.title || v.positionId}</strong></span>
                      <span>·</span>
                      <span>Nominee: <strong>{matchedCand?.name || v.candidateId}</strong></span>
                      {v.blockNumber && (
                        <>
                          <span>·</span>
                          <span className="block-pill badge badge-neutral" style={{ fontFamily: "var(--font-mono)" }}>
                            Block #{v.blockNumber}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. SYSTEM / BLOCKCHAIN STATUS & LIVE STATS */}
      <div className="system-and-stats-row" style={{ marginTop: "1.5rem" }}>
        {/* Compact Blockchain & Node Status Card */}
        <div className="system-info-card card card-team-blue">
          <h4 className="system-info-title" style={{ fontFamily: "var(--font-headline)", letterSpacing: "0.03em" }}>
            EVM System Topology
          </h4>
          <div className="system-info-grid">
            <div className="info-pair">
              <span className="info-label">Smart Contract</span>
              <div className="info-val-copy">
                <code style={{ fontFamily: "var(--font-mono)" }}>{contractShortAddr}</code>
                <button
                  type="button"
                  onClick={copyContractAddress}
                  className="copy-btn"
                  title="Copy full contract address"
                >
                  {copiedContract ? <Check size={13} color="#22C55E" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="info-pair">
              <span className="info-label">EVM Consensus</span>
              <span className="info-val" style={{ color: "var(--accent-success)", fontFamily: "var(--font-mono)" }}>
                <span className="live-dot" style={{ width: "6px", height: "6px" }} />
                Hardhat Localhost (31337)
              </span>
            </div>

            <div className="info-pair">
              <span className="info-label">Database Store</span>
              <span className="info-val" style={{ color: "#38bdf8" }}>
                <span className="live-dot" style={{ width: "6px", height: "6px", backgroundColor: "#38bdf8", boxShadow: "0 0 6px #38bdf8" }} />
                Google Cloud Firestore
              </span>
            </div>

            <div className="info-pair">
              <span className="info-label">Photo Storage</span>
              <span className="info-val" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Cloud size={14} style={{ color: "var(--text-muted)" }} />
                Cloudinary CDN
              </span>
            </div>
          </div>
        </div>

        {/* Live Vote Chart Visualization */}
        <div className="live-charts-card">
          <LiveVoteStats positions={positions} candidates={candidates} />
        </div>
      </div>

      {/* FIXED MOBILE BOTTOM NAVIGATION (< 768px Phones) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="nav-icon"><LayoutDashboard size={18} /></span>
          <span className="nav-text">Overview</span>
        </button>

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => scrollToSection("election-status-section")}
        >
          <span className="nav-icon"><Vote size={18} /></span>
          <span className="nav-text">Election</span>
        </button>

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => scrollToSection("candidates-management-section")}
        >
          <span className="nav-icon"><Users size={18} /></span>
          <span className="nav-text">Nominees</span>
        </button>

        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => setMobileMoreOpen(true)}
        >
          <span className="nav-icon"><MoreHorizontal size={18} /></span>
          <span className="nav-text">More</span>
        </button>
      </nav>

      {/* MOBILE "MORE" BOTTOM SHEET DRAWER */}
      {mobileMoreOpen && (
        <div className="mobile-sheet-overlay" onClick={() => setMobileMoreOpen(false)}>
          <div className="mobile-sheet-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-headline)", letterSpacing: "0.02em", fontSize: "1.1rem" }}>
                Administrative Actions
              </h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setMobileMoreOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "inline-flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sheet-links-list" style={{ display: "grid", gap: "8px" }}>
              <Link
                to="/blockchain-explorer"
                className="sheet-link"
                onClick={() => setMobileMoreOpen(false)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Activity size={16} /> Cryptographic Audit Ledger
                </span>
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/results"
                className="sheet-link"
                onClick={() => setMobileMoreOpen(false)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <BarChart3 size={16} /> Live Election Standings
                </span>
                <ArrowRight size={14} />
              </Link>

              <button
                type="button"
                className="sheet-link"
                onClick={() => {
                  scrollToSection("dev-tools-section");
                  setMobileMoreOpen(false);
                }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <FlaskConical size={16} /> Developer & Testing Tools
                </span>
                <ArrowRight size={14} />
              </button>

              <button
                type="button"
                className="sheet-link sheet-link--danger"
                onClick={handleLogout}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <LogOut size={16} /> Sign Out of Dashboard
                </span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
