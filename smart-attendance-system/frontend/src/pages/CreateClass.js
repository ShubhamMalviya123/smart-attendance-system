import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function CreateClass() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subjectId: "", semester: "", section: "", classDate: "", classTime: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/teacher/class", form);
      navigate(`/teacher/class/${res.data.id}/attendance`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create class");
    }
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand"><span className="mark">A</span> Attendance Register</div>
      </div>
      <div className="page-narrow">
        <h2 style={{ marginBottom: 20 }}>Create class</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field"><label>Subject ID</label>
              <input className="input mono" type="number" required
                value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} />
              <div className="text-muted" style={{ marginTop: 4 }}>The subject's database ID, not its code.</div>
            </div>
            <div className="field"><label>Semester</label>
              <input className="input" placeholder="e.g. MCA 3rd" required
                value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </div>
            <div className="field"><label>Section</label>
              <input className="input" placeholder="e.g. A" required
                value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
            </div>
            <div className="field"><label>Date</label>
              <input className="input" type="date" required
                value={form.classDate} onChange={(e) => setForm({ ...form, classDate: e.target.value })} />
            </div>
            <div className="field"><label>Time</label>
              <input className="input" type="time" required
                value={form.classTime} onChange={(e) => setForm({ ...form, classTime: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
              Create &amp; take attendance
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
