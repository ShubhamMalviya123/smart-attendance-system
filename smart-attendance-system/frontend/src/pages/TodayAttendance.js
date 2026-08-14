import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function TodayAttendance() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/teacher/attendance/today")
      .then((res) => setStudents(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load today's attendance"))
      .finally(() => setLoading(false));
  }, []);

  const presentCount = students.filter((s) => s.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.status === "ABSENT").length;
  const notMarkedCount = students.filter((s) => s.status === "NOT_MARKED").length;

  const stampFor = (status) => {
    if (status === "PRESENT") return <span className="stamp stamp-present">Present</span>;
    if (status === "ABSENT") return <span className="stamp stamp-absent">Absent</span>;
    return <span className="stamp stamp-pending">Not marked</span>;
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand"><span className="mark">A</span> Attendance Register</div>
      </div>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2>Today's attendance</h2>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>Back</button>
        </div>
        <p className="text-muted section-gap">
          {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          &nbsp;·&nbsp; Present {presentCount} &nbsp;·&nbsp; Absent {absentCount} &nbsp;·&nbsp; Not marked {notMarkedCount}
        </p>

        {loading && <p className="text-muted">Loading…</p>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="ledger">
            <thead>
              <tr><th>Roll</th><th>Name</th><th>Semester</th><th>Section</th><th>Status</th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="roll">{s.rollNo}</td>
                  <td>{s.name}</td>
                  <td>{s.semester}</td>
                  <td>{s.section}</td>
                  <td>{stampFor(s.status)}</td>
                </tr>
              ))}
              {students.length === 0 && !loading && (
                <tr><td colSpan="5" style={{ textAlign: "center", padding: 32 }} className="text-muted">No students in the system yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
