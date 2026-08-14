import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [studentCount, setStudentCount] = useState(null);
  const [todayStatus, setTodayStatus] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    api.get("/teacher/classes").then((res) => setClasses(res.data)).catch((err) => setError(err.response?.data?.error || "Failed to load classes"));
    api.get("/teacher/students").then((res) => setStudentCount(res.data.length)).catch(() => {});
    api.get("/teacher/attendance/today").then((res) => setTodayStatus(res.data)).catch(() => {});
    api.get("/teacher/attendance/weekly").then((res) => setWeekly(res.data)).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Delete this class session? Its attendance record will be permanently removed too.")) return;
    setError(""); setMessage("");
    try {
      await api.delete(`/teacher/class/${id}`);
      setMessage("Class deleted.");
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete class");
    }
  };

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const classesToday = classes.filter((c) => c.classDate === todayDateStr).length;
  const presentToday = todayStatus.filter((s) => s.status === "PRESENT").length;
  const markedToday = todayStatus.filter((s) => s.status !== "NOT_MARKED").length;
  const todayPct = markedToday > 0 ? Math.round((presentToday / markedToday) * 100) : null;

  const initials = (user?.name || "T").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const navItem = (icon, label, onClick, active = false) => (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="ic">{icon}</span> {label}
    </button>
  );

  return (
    <div className="dash-shell">
      <aside className="sidebar">
        <div className="brand"><span className="mark">A</span> Smart Attendance</div>
        <nav>
          {navItem("▣", "Dashboard", () => navigate("/teacher"), true)}
          {navItem("👥", "All students", () => navigate("/teacher/students"))}
          {navItem("📅", "Today's attendance", () => navigate("/teacher/today"))}
          {navItem("＋", "Create class", () => navigate("/teacher/create-class"))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div>
              <div className="uname">{user?.name}</div>
              <div className="urole">Teacher</div>
            </div>
          </div>
          {navItem("↪", "Logout", logout)}
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h2 style={{ fontSize: "1.3rem" }}>Good day, {user?.name?.split(" ")[0]} 👋</h2>
            <p className="text-muted" style={{ margin: 0 }}>Here's your classroom attendance overview.</p>
          </div>
          <button className="btn btn-brass" onClick={() => navigate("/teacher/create-class")}>+ Create class</button>
        </div>

        <div className="dash-content">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon si-green">▣</div>
              <div><div className="stat-num">{classes.length}</div><div className="stat-label">Total classes</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-blue">👥</div>
              <div><div className="stat-num">{studentCount ?? "—"}</div><div className="stat-label">Total students</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-gold">%</div>
              <div><div className="stat-num">{todayPct !== null ? `${todayPct}%` : "—"}</div><div className="stat-label">Today's attendance</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon si-red">📅</div>
              <div><div className="stat-num">{classesToday}</div><div className="stat-label">Classes today</div></div>
            </div>
          </div>

          <div className="card section-gap chart-card">
            <div style={{ flex: "1.4", minWidth: 260 }}>
              <div className="card-title" style={{ border: "none", marginBottom: 4 }}>Attendance — last 7 days</div>
              <p className="text-muted" style={{ marginTop: 0, marginBottom: 14 }}>Based on classes you've actually processed.</p>
              <div className="bar-chart">
                <div className="bar-chart-row">
                  {weekly.map((d) => (
                    <div key={d.date} className={`bar-col ${d.percentage < 0 ? "no-data" : ""}`}>
                      {d.percentage >= 0 && <div className="bar-pct">{d.percentage}%</div>}
                      <div className="bar" style={{ height: `${d.percentage >= 0 ? Math.max(d.percentage, 4) : 100}%` }} />
                      <div className="bar-label">{d.dayLabel}</div>
                    </div>
                  ))}
                  {weekly.length === 0 && <p className="text-muted">No attendance data yet.</p>}
                </div>
              </div>
            </div>

            <div className="donut-wrap">
              <div className="card-title" style={{ border: "none", marginBottom: 10, textAlign: "center" }}>Today</div>
              {(() => {
                const present = todayStatus.filter((s) => s.status === "PRESENT").length;
                const absent = todayStatus.filter((s) => s.status === "ABSENT").length;
                const total = present + absent;
                const pct = total > 0 ? Math.round((present / total) * 100) : 0;
                const circumference = 2 * Math.PI * 46;
                const presentLen = total > 0 ? (present / total) * circumference : 0;
                return (
                  <>
                    <svg width="140" height="140" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="46" fill="none" stroke="#e9dfc5" strokeWidth="14" />
                      {total > 0 && (
                        <circle cx="60" cy="60" r="46" fill="none" stroke="#1f4736" strokeWidth="14"
                          strokeDasharray={`${presentLen} ${circumference - presentLen}`}
                          strokeLinecap="round" transform="rotate(-90 60 60)" />
                      )}
                      <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1c1c1c" fontFamily="Fraunces, serif">{total > 0 ? `${pct}%` : "—"}</text>
                      <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#4a4a45">{total > 0 ? "present" : "no data"}</text>
                    </svg>
                    <div className="donut-legend">
                      <span className="item"><span className="dot" style={{ background: "#1f4736" }} /> Present {present}</span>
                      <span className="item"><span className="dot" style={{ background: "#e9dfc5" }} /> Absent {absent}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-title" style={{ margin: "20px 24px 0", border: "none", paddingBottom: 12 }}>My classes</div>
            {classes.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📚</div>
                <h4>No classes yet</h4>
                <p>Create your first classroom session to start taking AI-powered attendance.</p>
                <button className="btn btn-brass" onClick={() => navigate("/teacher/create-class")}>+ Create class</button>
              </div>
            ) : (
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Date</th><th>Semester</th><th>Section</th><th>Time</th><th>Status</th><th colSpan="2"></th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">{c.classDate}</td>
                      <td>{c.semester}</td>
                      <td>{c.section}</td>
                      <td className="mono">{c.classTime}</td>
                      <td>
                        <span className={`status-badge ${c.status === "PROCESSED" ? "done" : "active"}`}>
                          {c.status === "PROCESSED" ? "● Completed" : "○ Pending"}
                        </span>
                      </td>
                      <td>
                        {c.status !== "PROCESSED" ? (
                          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                            onClick={() => navigate(`/teacher/class/${c.id}/attendance`)}>Start attendance</button>
                        ) : (
                          <button className="btn btn-outline" style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                            onClick={() => navigate(`/teacher/class/${c.id}/view`)}>View report</button>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-danger-outline" style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                          onClick={() => handleDeleteClass(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
