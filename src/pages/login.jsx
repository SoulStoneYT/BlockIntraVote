import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import useNotification from "../hooks/useNotification";

const adminEmails = [
  "adityachaudhari237@nhitm.ac.in",
  "friend1@nhitm.ac.in",
  "user4@nhitm.ac.in"
];

export default function Login() {
  const [name, setName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [email, setEmail] = useState("");
  const [authenticating, setAuthenticating] = useState(false);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const isOnline = () => (typeof navigator !== "undefined" ? navigator.onLine : true);

  const fallbackRedirect = useCallback((user) => {
    if (user?.email && adminEmails.map((e) => e.toLowerCase()).includes(user.email.toLowerCase())) {
      navigate("/admin");
    } else {
      navigate("/complete-profile");
    }
  }, [navigate]);

  // Auto login session detection with role-based redirect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!isOnline()) {
          showNotification("You are offline. Please connect to the internet and reload the page.", "warning");
          return;
        }

        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const role = userData.role;

            if (role === "admin") {
              navigate("/admin");
            } else {
              // Voter role - check voting status
              if (userData.votingSessionCompleted === true) {
                navigate("/already-voted");
              } else if (userData.votingSessionStarted === false) {
                if (userData.department && userData.year && userData.dob) {
                  navigate("/start-voting");
                } else {
                  navigate("/complete-profile");
                }
              } else {
                navigate("/voting-session");
              }
            }
          } else {
            fallbackRedirect(user);
          }
        } catch (err) {
          if (err.code !== "permission-denied" && err.code !== "unavailable" && err.code !== "network-request-failed") {
            console.error("Firestore error in auth state listener:", err);
          }
          fallbackRedirect(user);
          return;
        }
      }
    });

    return () => unsubscribe();
  }, [fallbackRedirect, navigate, showNotification]);

  const redirectUser = async (user) => {
    if (!user) return false;
    if (!isOnline()) {
      showNotification("You are offline. Login succeeded, but we cannot fetch your profile until you reconnect.", "warning");
      return false;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const role = userData.role;

        if (role === "admin") {
          navigate("/admin");
        } else if (userData.votingSessionCompleted === true) {
          navigate("/already-voted");
        } else if (userData.votingSessionStarted === false) {
          if (userData.department && userData.year && userData.dob) {
            navigate("/start-voting");
          } else {
            navigate("/complete-profile");
          }
        } else {
          navigate("/voting-session");
        }
      } else {
        fallbackRedirect(user);
      }
      return true;
    } catch (err) {
      if (err.code !== "permission-denied" && err.code !== "unavailable" && err.code !== "network-request-failed") {
        console.error("Firestore error in redirectUser:", err);
      }
      fallbackRedirect(user);
      return false;
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (authenticating) return;

    const cleanEmail = email.trim();
    const cleanEnrollment = enrollment.trim();
    const cleanName = name.trim();

    if (!cleanName || !cleanEnrollment || !cleanEmail) {
      showNotification("Please fill in all mandatory fields.", "error");
      return;
    }

    if (!isOnline()) {
      showNotification("You are offline. Please connect to the internet before logging in.", "warning");
      return;
    }

    setAuthenticating(true);
    let userCredential = null;

    try {
      userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanEnrollment);
    } catch (signInError) {
      if (signInError.code === "auth/network-request-failed") {
        showNotification("Network error during login. Please check your internet connection.", "error");
        setAuthenticating(false);
        return;
      }

      // If credentials do not match or user is not found, attempt registration
      if (
        signInError.code === "auth/user-not-found" ||
        signInError.code === "auth/invalid-credential" ||
        signInError.code === "auth/wrong-password"
      ) {
        try {
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanEnrollment);
          const user = userCredential.user;
          const role = adminEmails.map((adm) => adm.toLowerCase()).includes(cleanEmail.toLowerCase())
            ? "admin"
            : "voter";

          await setDoc(doc(db, "users", user.uid), {
            name: cleanName,
            enrollmentNumber: cleanEnrollment,
            collegeEmail: cleanEmail,
            role: role,
            department: "",
            year: "",
            dob: null,
            votingSessionStarted: false,
            votingSessionCompleted: false,
            sessionStartTime: null,
            votedPositions: []
          });
        } catch (createError) {
          if (createError.code === "auth/email-already-in-use") {
            showNotification(
              "Incorrect Student ID / Credentials for this registered email.",
              "error"
            );
          } else {
            showNotification(createError.message, "error");
          }
          setAuthenticating(false);
          return;
        }
      } else {
        showNotification(signInError.message, "error");
        setAuthenticating(false);
        return;
      }
    }

    if (userCredential?.user) {
      await redirectUser(userCredential.user);
    } else {
      showNotification("Authentication failed. Please verify your credentials.", "error");
    }
    setAuthenticating(false);
  };

  return (
    <div className="login-container">
      <div className="login-card card card-team-red">
        {/* Institutional Branding Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            width: "48px",
            height: "48px",
            margin: "0 auto 10px",
            borderRadius: "var(--radius-default)",
            background: "var(--accent-primary)",
            boxShadow: "var(--glow-red-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF"
          }}>
            <Lock size={22} />
          </div>

          <div className="badge badge-blue" style={{ marginBottom: "8px" }}>
            <ShieldCheck size={12} />
            <span>SECURE CRYPTOGRAPHIC AUTHENTICATION</span>
          </div>

          <h2 style={{ margin: "0 0 0.35rem" }}>Voter Portal Login</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5 }}>
            Authenticate with your collegiate credentials to verify voter eligibility and access your ballot.
          </p>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <div className="field-card">
            <label className="field-label" htmlFor="name">
              Full Legal Name <span style={{ color: "var(--accent-error)" }} aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              aria-required="true"
              placeholder="e.g. Aditya Chaudhari"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="field-card">
            <label className="field-label" htmlFor="enrollment">
              Student ID / Roll No (PRN) <span style={{ color: "var(--accent-error)" }} aria-hidden="true">*</span>
            </label>
            <input
              id="enrollment"
              type="text"
              required
              aria-required="true"
              placeholder="e.g. 21102B0001"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              autoComplete="username"
              className="mono"
            />
          </div>

          <div className="field-card">
            <label className="field-label" htmlFor="email">
              Collegiate Email Address <span style={{ color: "var(--accent-error)" }} aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              aria-required="true"
              placeholder="e.g. student@nhitm.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Institutional domain emails only (.ac.in / .edu).
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={authenticating}
            aria-busy={authenticating}
          >
            <span>{authenticating ? "Verifying Credentials..." : "Authenticate & Access Ballot"}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
