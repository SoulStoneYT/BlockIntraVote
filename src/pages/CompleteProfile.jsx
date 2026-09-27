import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { UserCheck, ArrowRight } from "lucide-react";
import useNotification from "../hooks/useNotification";
import { isValidCollegeEmail } from "../utils/authUtils";

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Design"
];

const years = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year"
];

export default function CompleteProfile() {
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const checkUserProfile = async () => {
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

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Redirect if profile is already complete
        if (data.votingSessionStarted === false && 
            data.votingSessionCompleted === false &&
            data.department && data.year && data.dob) {
          navigate("/start-voting");
          return;
        }
      }
      setLoading(false);
    };

    checkUserProfile();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!department || !year || !dob) {
      showNotification("Please fill in all mandatory profile fields.", "warning");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const dobTimestamp = new Date(dob);
      
      await setDoc(docRef, {
        department: department,
        year: year,
        dob: dobTimestamp,
        votingSessionStarted: false,
        votingSessionCompleted: false,
        sessionStartTime: null,
        votedPositions: []
      }, { merge: true });

      navigate("/start-voting");
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("Failed to update profile. Please try again.", "error");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
        Loading student voter record...
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card card card-team-blue">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div className="badge badge-blue" style={{ marginBottom: "8px" }}>
            <UserCheck size={12} />
            <span>VOTER REGISTRY VERIFICATION</span>
          </div>

          <h2 style={{ margin: "0 0 0.35rem" }}>Complete Your Profile</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
            Provide your academic department, year, and date of birth to certify voter eligibility.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-card">
            <label className="field-label" htmlFor="dept-select">
              Academic Department <span style={{ color: "var(--accent-error)" }} aria-hidden="true">*</span>
            </label>
            <select 
              id="dept-select"
              value={department}
              required
              aria-required="true"
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="field-card">
            <label className="field-label" htmlFor="year-select">
              Academic Year <span style={{ color: "var(--accent-error)" }} aria-hidden="true">*</span>
            </label>
            <select 
              id="year-select"
              value={year}
              required
              aria-required="true"
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">-- Select Academic Year --</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          <div className="field-card">
            <label className="field-label" htmlFor="dob-input">
              Date of Birth <span style={{ color: "var(--accent-error)" }} aria-hidden="true">*</span>
            </label>
            <input 
              id="dob-input"
              type="date"
              required
              aria-required="true"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mono"
            />
          </div>

          <button 
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            <span>Confirm & Proceed to Ballot</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
