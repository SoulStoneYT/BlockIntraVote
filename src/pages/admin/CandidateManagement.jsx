import { useState, useRef } from "react";
import { db } from "../../firebase";
import { addDoc, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { collection } from "firebase/firestore";
import useNotification from "../../hooks/useNotification";
import useConfirm from "../../hooks/useConfirm";
import {
  uploadImageToCloudinary,
  getOptimizedCloudinaryUrl
} from "../../services/cloudinaryService";
import {
  Plus,
  X,
  Cloud,
  Edit3,
  UserPlus,
  Upload,
  Link2,
  CheckCircle2,
  Camera,
  Search,
  Building2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCcw
} from "lucide-react";

const FALLBACK_AVATAR =
  "https://res.cloudinary.com/demo/image/upload/c_fill,g_face,w_200,h_200,q_auto,f_auto/v1/samples/people/smiling-man.jpg";

export default function CandidateManagement({ positions = [], candidates = [], onRefresh }) {
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState(null);

  // Form states
  const [selectedPosition, setSelectedPosition] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateParty, setCandidateParty] = useState("");
  const [candidatePhoto, setCandidatePhoto] = useState("");
  const [candidateMotto, setCandidateMotto] = useState("");

  // Photo mode: "file" (local system) vs "url" (external link)
  const [photoMode, setPhotoMode] = useState("file");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Custom Cloudinary settings modal / prompt if not in env
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  const [cloudNameInput, setCloudNameInput] = useState(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "");
  const [uploadPresetInput, setUploadPresetInput] = useState(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "");

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");

  // Drag and Drop state
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [dragOverCandidateId, setDragOverCandidateId] = useState(null);

  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();
  const { showConfirm } = useConfirm();

  // Reset form
  const resetForm = () => {
    setCandidateName("");
    setCandidateParty("");
    setCandidatePhoto("");
    setCandidateMotto("");
    setSelectedPosition("");
    setEditingCandidateId(null);
    setShowCandidateForm(false);
    setUploadProgress(0);
    setUploadingPhoto(false);
  };

  // Start editing a candidate
  const handleStartEdit = (candidate) => {
    setEditingCandidateId(candidate.id);
    setSelectedPosition(candidate.positionId || "");
    setCandidateName(candidate.name || "");
    setCandidateParty(candidate.party || "");
    setCandidatePhoto(candidate.photo || "");
    setCandidateMotto(candidate.motto || "");
    setShowCandidateForm(true);
    // Scroll smoothly to form
    const formElem = document.getElementById("candidate-form-anchor");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Handle local file selection and direct Cloudinary upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("Please select a valid image file (PNG, JPG, WEBP).", "warning");
      return;
    }

    // Check Cloudinary keys
    const activeCloudName = cloudNameInput || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const activePreset = uploadPresetInput || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!activeCloudName || !activePreset) {
      setShowCloudinaryConfig(true);
      showNotification("Please specify your Cloudinary Cloud Name and Unsigned Preset to upload.", "info");
      return;
    }

    setUploadingPhoto(true);
    setUploadProgress(10);

    try {
      const result = await uploadImageToCloudinary(file, {
        cloudName: activeCloudName,
        uploadPreset: activePreset,
        onProgress: (p) => setUploadProgress(p)
      });

      // Save optimized Cloudinary secure URL
      setCandidatePhoto(result.secure_url);
      showNotification("Photo uploaded successfully to Cloudinary!", "success");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      showNotification(err.message || "Failed to upload photo to Cloudinary. Check credentials or use direct URL.", "error");
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  // Submit candidate (Add or Update)
  const handleSubmitCandidate = async (e) => {
    e?.preventDefault();

    if (!selectedPosition) {
      showNotification("Please select an election position", "warning");
      return;
    }
    if (!candidateName.trim()) {
      showNotification("Please enter candidate full name", "warning");
      return;
    }

    try {
      if (editingCandidateId) {
        // Update existing candidate
        const candidateRef = doc(db, "candidates", editingCandidateId);
        await updateDoc(candidateRef, {
          positionId: selectedPosition,
          name: candidateName.trim(),
          party: candidateParty.trim(),
          photo: candidatePhoto.trim(),
          motto: candidateMotto.trim(),
          updatedAt: new Date()
        });
        showNotification(`Candidate "${candidateName}" updated successfully.`, "success");
      } else {
        // Add new candidate with calculated order
        const positionCandidates = candidates.filter((c) => c.positionId === selectedPosition);
        const newOrder = positionCandidates.length;

        await addDoc(collection(db, "candidates"), {
          positionId: selectedPosition,
          name: candidateName.trim(),
          party: candidateParty.trim(),
          photo: candidatePhoto.trim(),
          motto: candidateMotto.trim(),
          order: newOrder,
          createdAt: new Date()
        });
        showNotification(`Candidate "${candidateName}" registered on ballot!`, "success");
      }

      resetForm();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error saving candidate:", error);
      showNotification("Failed to save candidate", "error");
    }
  };

  // Delete candidate
  const handleDeleteCandidate = async (candidate) => {
    const confirmed = await showConfirm(
      `Are you sure you want to remove candidate "${candidate.name}" from nomination? Existing vote references for this candidate will be preserved.`,
      { title: "Delete Candidate Nomination", confirmText: "Delete Candidate" }
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "candidates", candidate.id));
      showNotification(`Candidate "${candidate.name}" removed from registry.`, "info");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Error deleting candidate:", error);
      showNotification("Failed to delete candidate", "error");
    }
  };

  // Reorder candidate via Arrow Buttons (Touch & Desktop friendly)
  const handleMoveCandidate = async (positionId, currentIndex, direction) => {
    const positionCandidates = candidates
      .filter((c) => c.positionId === positionId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= positionCandidates.length) return;

    const reordered = [...positionCandidates];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    try {
      const batch = writeBatch(db);
      reordered.forEach((c, idx) => {
        batch.update(doc(db, "candidates", c.id), { order: idx });
      });
      await batch.commit();
      showNotification(`Ballot sequence updated for ${temp.name}.`, "info");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error reordering candidate:", err);
      showNotification("Failed to reorder candidate", "error");
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, candidateId) => {
    setDraggedCandidateId(candidateId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", candidateId);
  };

  const handleDragOver = (e, candidateId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (candidateId !== dragOverCandidateId) {
      setDragOverCandidateId(candidateId);
    }
  };

  const handleDrop = async (e, targetCandidate, positionId) => {
    e.preventDefault();
    setDragOverCandidateId(null);

    if (!draggedCandidateId || draggedCandidateId === targetCandidate.id) {
      setDraggedCandidateId(null);
      return;
    }

    const positionCandidates = candidates
      .filter((c) => c.positionId === positionId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    const sourceIndex = positionCandidates.findIndex((c) => c.id === draggedCandidateId);
    const targetIndex = positionCandidates.findIndex((c) => c.id === targetCandidate.id);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedCandidateId(null);
      return;
    }

    const reordered = [...positionCandidates];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setDraggedCandidateId(null);

    try {
      const batch = writeBatch(db);
      reordered.forEach((c, idx) => {
        batch.update(doc(db, "candidates", c.id), { order: idx });
      });
      await batch.commit();
      showNotification(`Ballot order updated: ${moved.name} dropped to position #${targetIndex + 1}.`, "info");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error saving drag reorder:", err);
      showNotification("Failed to update candidate sequence", "error");
    }
  };

  // Filter candidates based on search & position filter
  const filteredCandidates = candidates.filter((c) => {
    const matchesPosition = positionFilter === "all" || c.positionId === positionFilter;
    const matchesSearch =
      searchQuery === "" ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.party?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.motto?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPosition && matchesSearch;
  });

  return (
    <section id="candidates-management-section" className="candidate-management-section">
      <div className="section-header-compact">
        <div>
          <h3 className="section-title">Candidate Nominations & Manifestos</h3>
          <p className="section-subtitle">
            Manage certified student candidates, upload profile portraits to Cloudinary, and drag handles to organize ballot order.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn primary"
          onClick={() => {
            if (showCandidateForm) {
              resetForm();
            } else {
              setShowCandidateForm(true);
            }
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {showCandidateForm ? (
            <>
              <X size={15} /> Close Form
            </>
          ) : (
            <>
              <Plus size={15} /> Add Candidate
            </>
          )}
        </button>
      </div>

      {/* Cloudinary Quick Settings Dialog / Drawer */}
      {showCloudinaryConfig && (
        <div className="admin-card admin-card--info" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-secondary)", fontWeight: 700 }}>
              <Cloud size={16} />
              <span>Cloudinary Upload Configuration</span>
            </div>
            <button
              type="button"
              className="admin-btn tertiary"
              style={{ minHeight: "32px", padding: "4px 8px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
              onClick={() => setShowCloudinaryConfig(false)}
            >
              <X size={13} /> Close
            </button>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Enter your Cloudinary Cloud Name and an Unsigned Upload Preset (from Cloudinary Console &gt; Settings &gt; Upload presets).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Cloud Name (e.g. dm123xyz)"
              value={cloudNameInput}
              onChange={(e) => setCloudNameInput(e.target.value)}
            />
            <input
              type="text"
              className="admin-input"
              placeholder="Unsigned Upload Preset (e.g. ml_default)"
              value={uploadPresetInput}
              onChange={(e) => setUploadPresetInput(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Candidate Add / Edit Form Anchor */}
      <div id="candidate-form-anchor" />
      {showCandidateForm && (
        <div className="admin-card candidate-form-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {editingCandidateId ? <Edit3 size={18} style={{ color: "var(--accent-secondary)" }} /> : <UserPlus size={18} style={{ color: "var(--accent-primary)" }} />}
              <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-primary)", fontFamily: "var(--font-headline)", letterSpacing: "0.02em" }}>
                {editingCandidateId ? "Edit Candidate Nomination" : "Add New Candidate to Ballot"}
              </h4>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {editingCandidateId ? "Update details" : "Register certified contender"}
            </span>
          </div>

          <form onSubmit={handleSubmitCandidate} className="admin-form">
            <div className="form-grid-2col">
              {/* Position Selection */}
              <div>
                <label className="form-label" htmlFor="candidate-position-select">
                  Contesting Position <span style={{ color: "var(--accent-primary)" }}>*</span>
                </label>
                <select
                  id="candidate-position-select"
                  className="admin-select"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  required
                >
                  <option value="">-- Choose Position --</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title} {pos.isActive === false ? "(Inactive)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Candidate Full Name */}
              <div>
                <label className="form-label" htmlFor="candidate-name-input">
                  Candidate Full Name <span style={{ color: "var(--accent-primary)" }}>*</span>
                </label>
                <input
                  id="candidate-name-input"
                  className="admin-input"
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2col">
              {/* Party / Slate */}
              <div>
                <label className="form-label" htmlFor="candidate-party-input">
                  Political Slate / Party / Independent (Optional)
                </label>
                <input
                  id="candidate-party-input"
                  className="admin-input"
                  type="text"
                  placeholder="e.g. Tech Pioneers, Youth Alliance, Independent"
                  value={candidateParty}
                  onChange={(e) => setCandidateParty(e.target.value)}
                />
              </div>

              {/* Photo Mode Switcher */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Candidate Portrait Photo
                  </label>
                  <div className="photo-mode-tabs">
                    <button
                      type="button"
                      className={`tab-btn ${photoMode === "file" ? "active" : ""}`}
                      onClick={() => setPhotoMode("file")}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <Upload size={12} /> Upload from Device
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${photoMode === "url" ? "active" : ""}`}
                      onClick={() => setPhotoMode("url")}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <Link2 size={12} /> Paste URL
                    </button>
                  </div>
                </div>

                {photoMode === "file" ? (
                  /* Local file picker with Cloudinary upload */
                  <div className="cloudinary-dropzone">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    {uploadingPhoto ? (
                      <div className="upload-progress-container">
                        <div className="spinner-small" />
                        <span style={{ fontSize: "0.85rem", color: "var(--accent-secondary)", fontWeight: 600 }}>
                          Uploading to Cloudinary... {uploadProgress}%
                        </span>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : candidatePhoto ? (
                      <div className="photo-preview-row">
                        <img
                          src={getOptimizedCloudinaryUrl(candidatePhoto, 120)}
                          alt="Candidate Preview"
                          className="candidate-preview-avatar"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_AVATAR;
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            fontSize: "0.82rem",
                            color: "var(--accent-success)",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            <CheckCircle2 size={14} /> Cloudinary Photo Ready
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", wordBreak: "break-all", display: "block" }}>
                            {candidatePhoto.substring(0, 45)}...
                          </span>
                        </div>
                        <button
                          type="button"
                          className="admin-btn tertiary"
                          style={{ minHeight: "36px", padding: "4px 10px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          onClick={() => {
                            setCandidatePhoto("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <RotateCcw size={12} /> Change
                        </button>
                      </div>
                    ) : (
                      <div
                        className="dropzone-box"
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                      >
                        <Camera size={26} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          Click to select candidate portrait from computer
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          PNG, JPG, WEBP · Auto-centered square portrait via Cloudinary
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* URL Input */
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      className="admin-input"
                      type="url"
                      placeholder="https://res.cloudinary.com/... or image link"
                      value={candidatePhoto}
                      onChange={(e) => setCandidatePhoto(e.target.value)}
                    />
                    {candidatePhoto && (
                      <img
                        src={getOptimizedCloudinaryUrl(candidatePhoto, 80)}
                        alt="Preview"
                        style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", objectFit: "cover", border: "1px solid var(--border-color)" }}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_AVATAR;
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Motto / Vision */}
            <div>
              <label className="form-label" htmlFor="candidate-motto-input">
                Candidate Manifesto / Motto (Displayed on the back of voter card)
              </label>
              <textarea
                id="candidate-motto-input"
                className="admin-textarea"
                rows={2}
                placeholder="Key campaign promise, goals, or collegiate mission statement..."
                value={candidateMotto}
                onChange={(e) => setCandidateMotto(e.target.value)}
              />
            </div>

            {/* Form Action Buttons (Mobile-first full width) */}
            <div className="form-actions-row">
              <button type="button" className="admin-btn tertiary" onClick={resetForm}>
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn primary"
                disabled={uploadingPhoto}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                {editingCandidateId ? (
                  <>
                    <Edit3 size={15} /> Save Candidate Changes
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Register Candidate on Ballot
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Position Filter Bar */}
      <div className="candidate-filter-bar">
        <div className="search-box-wrapper">
          <span className="search-icon" style={{ display: "inline-flex", alignItems: "center" }}>
            <Search size={15} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search candidates by name, party, or motto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="position-filter-wrapper">
          <select
            className="filter-select"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            aria-label="Filter candidates by position"
          >
            <option value="all">All Positions ({candidates.length})</option>
            {positions.map((p) => {
              const count = candidates.filter((c) => c.positionId === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.title} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Candidate Listings Grouped by Position */}
      {candidates.length === 0 ? (
        <div className="admin-card empty-card">
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            No candidates registered yet. Click <strong>"+ Add Candidate"</strong> to enroll candidates.
          </p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="admin-card empty-card">
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            No candidates matched your search criteria: "<strong>{searchQuery}</strong>".
          </p>
        </div>
      ) : (
        <div className="positions-candidate-groups">
          {positions
            .filter((position) => positionFilter === "all" || positionFilter === position.id)
            .map((position) => {
              const positionCandidates = filteredCandidates
                .filter((c) => c.positionId === position.id)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

              if (positionCandidates.length === 0) return null;

              return (
                <div key={position.id} className="position-group-card">
                  {/* Position Header with Count */}
                  <div className="position-group-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="position-badge" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Building2 size={13} /> {position.title}
                      </span>
                      <span className="candidate-count-pill">
                        {positionCandidates.length} Contender{positionCandidates.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="drag-hint">Grab handles to reorder ballot positions</span>
                  </div>

                  {/* Candidate List with Drag Handles and Mobile Touch Controls */}
                  <div className="candidate-items-list">
                    {positionCandidates.map((candidate, idx) => {
                      const isDragged = draggedCandidateId === candidate.id;
                      const isDragOver = dragOverCandidateId === candidate.id;
                      const avatarSrc = candidate.photo
                        ? getOptimizedCloudinaryUrl(candidate.photo, 100)
                        : FALLBACK_AVATAR;

                      return (
                        <div
                          key={candidate.id}
                          className={`candidate-admin-item ${isDragged ? "is-dragged" : ""} ${
                            isDragOver ? "is-drag-over" : ""
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, candidate.id)}
                          onDragOver={(e) => handleDragOver(e, candidate.id)}
                          onDrop={(e) => handleDrop(e, candidate, position.id)}
                        >
                          {/* Left: Drag Handle and Ballot Order Badge */}
                          <div className="candidate-drag-handle-col">
                            <div
                              className="drag-handle"
                              title="Drag to change ballot placement"
                              aria-label="Drag handle"
                            >
                              <GripVertical size={16} />
                            </div>

                            <div className="mobile-order-arrows">
                              <button
                                type="button"
                                className="arrow-btn"
                                disabled={idx === 0}
                                onClick={() => handleMoveCandidate(position.id, idx, "up")}
                                aria-label={`Move ${candidate.name} up`}
                                title="Move up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <span className="ballot-num-pill" style={{ fontFamily: "var(--font-mono)" }}>
                                #{idx + 1}
                              </span>
                              <button
                                type="button"
                                className="arrow-btn"
                                disabled={idx === positionCandidates.length - 1}
                                onClick={() => handleMoveCandidate(position.id, idx, "down")}
                                aria-label={`Move ${candidate.name} down`}
                                title="Move down"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Avatar Thumbnail with Cloudinary face center */}
                          <div className="candidate-avatar-thumb">
                            <img
                              src={avatarSrc}
                              alt={candidate.name}
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_AVATAR;
                              }}
                            />
                          </div>

                          {/* Center: Info */}
                          <div className="candidate-info-col">
                            <div className="candidate-name-row">
                              <strong className="candidate-name">{candidate.name}</strong>
                              {candidate.party && (
                                <span className="candidate-party-badge">{candidate.party}</span>
                              )}
                            </div>

                            {candidate.motto ? (
                              <p className="candidate-motto-text">
                                "{candidate.motto}"
                              </p>
                            ) : (
                              <span className="no-motto-text">No manifesto motto provided</span>
                            )}
                          </div>

                          {/* Right: Actions */}
                          <div className="candidate-actions-col">
                            <button
                              type="button"
                              className="action-icon-btn edit"
                              onClick={() => handleStartEdit(candidate)}
                              aria-label={`Edit ${candidate.name}`}
                              title="Edit candidate information"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              onClick={() => handleDeleteCandidate(candidate)}
                              aria-label={`Delete ${candidate.name}`}
                              title="Delete candidate"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </section>
  );
}