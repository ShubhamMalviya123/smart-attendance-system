import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function ViewAttendance() {
  const { classSessionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teacher/class/${classSessionId}/attendance`)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, [classSessionId]);

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand"><span className="mark">A</span> Attendance Register</div>
      </div>
      <div className="page" style={{ maxWidth: 720 }}>
        <h2 style={{ marginBottom: 20 }}>Attendance record</h2>

        {loading && <p className="text-muted">Loading…</p>}
        {error && <div className="alert alert-error">{error}</div>}

        {result && (
          <div className="card">
            <div className="card-title">Summary</div>
            <p className="text-muted" style={{ marginBottom: 16 }}>
              Total {result.totalStudents} · Present {result.presentCount} · Absent {result.absentCount}
            </p>

            <table className="ledger">
              <thead><tr><th>Roll</th><th>Name</th><th>Status</th><th>Confidence</th></tr></thead>
              <tbody>
                {result.presentStudents.map((s) => (
                  <tr key={s.rollNo}>
                    <td className="roll">{s.rollNo}</td><td>{s.name}</td>
                    <td><span className="stamp stamp-present">Present</span></td>
                    <td className="mono">{s.confidenceScore != null ? (s.confidenceScore * 100).toFixed(1) + "%" : "—"}</td>
                  </tr>
                ))}
                {result.absentStudents.map((s) => (
                  <tr key={s.rollNo}>
                    <td className="roll">{s.rollNo}</td><td>{s.name}</td>
                    <td><span className="stamp stamp-absent">Absent</span></td>
                    <td>—</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate("/teacher")}>
              Back to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
