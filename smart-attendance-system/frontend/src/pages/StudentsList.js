import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function StudentsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const basePath = user?.role === "ADMIN" ? "/admin" : "/teacher";

  const load = () => {
    api.get(`${basePath}/students`)
      .then((res) => setStudents(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load students"));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This also removes their attendance history. This cannot be undone.`)) return;
    setError(""); setMessage("");
    try {
      await api.delete(`${basePath}/student/${id}`);
      setMessage(`${name} deleted.`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete student");
    }
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand"><span className="mark">A</span> Attendance Register</div>
      </div>
      <div className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2>All students <span className="text-muted" style={{ fontSize: "1rem", fontFamily: "Inter" }}>({students.length} total)</span></h2>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>Back</button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="ledger">
            <thead>
              <tr><th>Roll</th><th>Name</th><th>Semester</th><th>Section</th><th>Face registered</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="roll">{s.rollNo}</td>
                  <td>{s.name}</td>
                  <td>{s.semester}</td>
                  <td>{s.section}</td>
                  <td>
                    <span className={`stamp ${s.faceRegistered ? "stamp-present" : "stamp-pending"}`}>
                      {s.faceRegistered ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }}
                      onClick={() => handleDelete(s.id, s.name)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: "center", padding: 32 }} className="text-muted">No students yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
