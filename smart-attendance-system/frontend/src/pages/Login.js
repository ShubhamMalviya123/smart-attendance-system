import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data);
      if (response.data.role === "ADMIN") navigate("/admin");
      else navigate("/teacher");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-blob b1" />
      <div className="login-blob b2" />

      <div className="login-inner">
        {/* Left hero panel - desktop only */}
        <div className="login-hero">
          <div className="eyebrow">Smart AI Classroom</div>
          <h1>AI-powered classroom<br />attendance system</h1>
          <p>Detect and verify every student present through facial recognition — no proxy, no manual roll-calls.</p>

          <div className="login-feature"><span className="tick">✓</span> Face Recognition</div>
          <div className="login-feature"><span className="tick">✓</span> Real-time Attendance</div>
          <div className="login-feature"><span className="tick">✓</span> Secure Records</div>
        </div>

        {/* Login card */}
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="ai-badge" style={{ marginBottom: 16 }}>
              <span>✦</span> AI ATTENDANCE SYSTEM
            </div>
            <h2 style={{ fontSize: "1.55rem", marginBottom: 6 }}>Smart AI Attendance</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              Secure attendance management powered by intelligent face recognition.
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field login-input-group">
              <label>Email</label>
              <span className="icon">👤</span>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
              />
            </div>

            <div className="field login-input-group">
              <label>Password</label>
              <span className="icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: 10 }}>
              {loading ? "Signing in…" : "Sign in to Dashboard →"}
            </button>
          </form>

          <div className="ai-status-line">
            <span className="status-dot" /> AI System Operational
          </div>

          <div className="login-footer">
            <div className="name">Smart AI Classroom Attendance System</div>
            <div className="meta">Secure &nbsp;·&nbsp; AI-powered &nbsp;·&nbsp; Real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
