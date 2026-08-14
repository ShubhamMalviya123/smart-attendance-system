import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyTeacher = { name: "", email: "", password: "" };
const emptyStudent = { rollNo: "", name: "", email: "", branch: "", semester: "", section: "" };
const emptySubject = { subjectName: "", subjectCode: "", teacherId: "", semester: "" };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  const [teacherForm, setTeacherForm] = useState(emptyTeacher);
  const [editingTeacherId, setEditingTeacherId] = useState(null);

  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [editingStudentId, setEditingStudentId] = useState(null);

  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [editingSubjectId, setEditingSubjectId] = useState(null);

  const [faceRollNo, setFaceRollNo] = useState("");
  const [faceImages, setFaceImages] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [todayStatus, setTodayStatus] = useState([]);
  const [weekly, setWeekly] = useState([]);

  const showResult = (msg, isError = false) => {
    setError(isError ? msg : "");
    setMessage(isError ? "" : msg);
  };

  const loadAll = () => {
    api.get("/admin/teachers").then((res) => setTeachers(res.data)).catch(() => {});
    api.get("/admin/students").then((res) => setStudents(res.data)).catch(() => {});
    api.get("/admin/subjects").then((res) => setSubjects(res.data)).catch(() => {});
    api.get("/admin/attendance/today").then((res) => setTodayStatus(res.data)).catch(() => {});
    api.get("/admin/attendance/weekly").then((res) => setWeekly(res.data)).catch(() => {});
  };

  useEffect(() => { loadAll(); }, []);

  // ---------- Teacher: add / edit ----------
  const submitTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacherId) {
        await api.put(`/admin/teacher/${editingTeacherId}`, teacherForm);
        showResult("Teacher updated.");
      } else {
        await api.post("/admin/teacher", teacherForm);
        showResult("Teacher added to the register.");
      }
      setTeacherForm(emptyTeacher);
      setEditingTeacherId(null);
      loadAll();
    } catch (err) { showResult(err.response?.data?.error || "Failed to save teacher", true); }
  };
  const startEditTeacher = (t) => {
    setEditingTeacherId(t.id);
    setTeacherForm({ name: t.name, email: t.email, password: "" });
    setActiveSection("teachers");
  };
  const cancelEditTeacher = () => { setEditingTeacherId(null); setTeacherForm(emptyTeacher); };

  // ---------- Student: add / edit ----------
  const submitStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await api.put(`/admin/student/${editingStudentId}`, studentForm);
        showResult("Student updated.");
      } else {
        await api.post("/admin/student", studentForm);
        showResult("Student added to the register.");
      }
      setStudentForm(emptyStudent);
      setEditingStudentId(null);
      loadAll();
    } catch (err) { showResult(err.response?.data?.error || "Failed to save student", true); }
  };
  const startEditStudent = (s) => {
    setEditingStudentId(s.id);
    setStudentForm({ rollNo: s.rollNo, name: s.name, email: s.email || "", branch: s.branch || "", semester: s.semester, section: s.section });
    setActiveSection("students");
  };
  const cancelEditStudent = () => { setEditingStudentId(null); setStudentForm(emptyStudent); };

  // ---------- Subject: add / edit ----------
  const submitSubject = async (e) => {
    e.preventDefault();
    try {
      if (editingSubjectId) {
        await api.put(`/admin/subject/${editingSubjectId}`, subjectForm);
        showResult("Subject updated.");
      } else {
        await api.post("/admin/subject", subjectForm);
        showResult("Subject added.");
      }
      setSubjectForm(emptySubject);
      setEditingSubjectId(null);
      loadAll();
    } catch (err) { showResult(err.response?.data?.error || "Failed to save subject", true); }
  };
  const startEditSubject = (s) => {
    setEditingSubjectId(s.id);
    setSubjectForm({ subjectName: s.subjectName, subjectCode: s.subjectCode || "", teacherId: s.teacherId, semester: s.semester });
    setActiveSection("subjects");
  };
  const cancelEditSubject = () => { setEditingSubjectId(null); setSubjectForm(emptySubject); };

  const registerFace = async (e) => {
    e.preventDefault();
    if (faceImages.length < 1 || faceImages.length > 5) { showResult("Please select 1 to 5 images", true); return; }
    const formData = new FormData();
    for (let i = 0; i < faceImages.length; i++) formData.append("images", faceImages[i]);
    try {
      await api.post(`/admin/student/${faceRollNo}/register-face`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      showResult(`Face registered for roll no ${faceRollNo}`);
      setFaceRollNo(""); setFaceImages([]);
      loadAll();
    } catch (err) { showResult(err.response?.data?.error || "Face registration failed", true); }
  };

  const deleteTeacher = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This also removes their subjects and classes.`)) return;
    try { await api.delete(`/admin/teacher/${id}`); showResult(`${name} deleted.`); loadAll(); }
    catch (err) { showResult(err.response?.data?.error || "Failed to delete teacher", true); }
  };
  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This also removes their attendance history.`)) return;
    try { await api.delete(`/admin/student/${id}`); showResult(`${name} deleted.`); loadAll(); }
    catch (err) { showResult(err.response?.data?.error || "Failed to delete student", true); }
  };
  const deleteSubject = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}"? This also removes its classes.`)) return;
    try { await api.delete(`/admin/subject/${id}`); showResult(`${name} deleted.`); loadAll(); }
    catch (err) { showResult(err.response?.data?.error || "Failed to delete subject", true); }
  };

  const initials = (user?.name || "A").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const present = todayStatus.filter((s) => s.status === "PRESENT").length;
  const absent = todayStatus.filter((s) => s.status === "ABSENT").length;
  const totalMarked = present + absent;
  const todayPct = totalMarked > 0 ? Math.round((present / totalMarked) * 100) : null;

  const goTo = (key) => { setActiveSection(key); setMessage(""); setError(""); };

  return (
    <div className="dash-shell">
      <aside className="sidebar">
        <div className="brand"><span className="mark">A</span> Smart Attendance</div>
        <nav>
          <button className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`} onClick={() => goTo("dashboard")}><span className="ic">▣</span> Dashboard</button>
          <button className={`nav-item ${activeSection === "teachers" ? "active" : ""}`} onClick={() => goTo("teachers")}><span className="ic">👨‍🏫</span> Teachers</button>
          <button className={`nav-item ${activeSection === "students" ? "active" : ""}`} onClick={() => goTo("students")}><span className="ic">👨‍🎓</span> Students</button>
          <button className={`nav-item ${activeSection === "subjects" ? "active" : ""}`} onClick={() => goTo("subjects")}><span className="ic">📚</span> Subjects</button>
          <button className={`nav-item ${activeSection === "face" ? "active" : ""}`} onClick={() => goTo("face")}><span className="ic">🪪</span> Register face</button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div><div className="uname">{user?.name}</div><div className="urole">Admin</div></div>
          </div>
          <button className="nav-item" onClick={logout}><span className="ic">↪</span> Logout</button>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h2 style={{ fontSize: "1.3rem", textTransform: "capitalize" }}>{activeSection === "dashboard" ? "Admin Dashboard" : activeSection}</h2>
            <p className="text-muted" style={{ margin: 0 }}>
              {activeSection === "dashboard" ? "Overview of your institute." : `Manage ${activeSection} for the whole college.`}
            </p>
          </div>
        </div>

        <div className="dash-content">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {/* ---------------- DASHBOARD ---------------- */}
          {activeSection === "dashboard" && (
            <>
              <div className="stat-grid">
                <div className="stat-card"><div className="stat-icon si-green">👨‍🏫</div>
                  <div><div className="stat-num">{teachers.length}</div><div className="stat-label">Total teachers</div></div></div>
                <div className="stat-card"><div className="stat-icon si-blue">👨‍🎓</div>
                  <div><div className="stat-num">{students.length}</div><div className="stat-label">Total students</div></div></div>
                <div className="stat-card"><div className="stat-icon si-gold">📚</div>
                  <div><div className="stat-num">{subjects.length}</div><div className="stat-label">Total subjects</div></div></div>
                <div className="stat-card"><div className="stat-icon si-red">%</div>
                  <div><div className="stat-num">{todayPct !== null ? `${todayPct}%` : "—"}</div><div className="stat-label">Today's attendance</div></div></div>
              </div>

              <div className="card chart-card">
                <div style={{ flex: "1.4", minWidth: 260 }}>
                  <div className="card-title" style={{ border: "none", marginBottom: 4 }}>Attendance — last 7 days</div>
                  <p className="text-muted" style={{ marginTop: 0, marginBottom: 14 }}>Institute-wide, based on processed classes.</p>
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
                  <svg width="140" height="140" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="46" fill="none" stroke="#e9dfc5" strokeWidth="14" />
                    {totalMarked > 0 && (
                      <circle cx="60" cy="60" r="46" fill="none" stroke="#1f4736" strokeWidth="14"
                        strokeDasharray={`${(present / totalMarked) * 2 * Math.PI * 46} ${2 * Math.PI * 46}`}
                        strokeLinecap="round" transform="rotate(-90 60 60)" />
                    )}
                    <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill="#1c1c1c" fontFamily="Fraunces, serif">{totalMarked > 0 ? `${todayPct}%` : "—"}</text>
                    <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#4a4a45">{totalMarked > 0 ? "present" : "no data"}</text>
                  </svg>
                  <div className="donut-legend">
                    <span className="item"><span className="dot" style={{ background: "#1f4736" }} /> Present {present}</span>
                    <span className="item"><span className="dot" style={{ background: "#e9dfc5" }} /> Absent {absent}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------------- TEACHERS ---------------- */}
          {activeSection === "teachers" && (
            <div className="grid-2">
              <div className="card">
                <div className="card-title">{editingTeacherId ? "Edit teacher" : "Add teacher"}</div>
                <form onSubmit={submitTeacher}>
                  <div className="field"><label>Name</label>
                    <input className="input" required value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} /></div>
                  <div className="field"><label>Email</label>
                    <input className="input" type="email" required value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} /></div>
                  <div className="field"><label>{editingTeacherId ? "New password (leave blank to keep current)" : "Password"}</label>
                    <input className="input" type="password" required={!editingTeacherId} value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} /></div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-primary btn-block">{editingTeacherId ? "Save changes" : "Add teacher"}</button>
                    {editingTeacherId && <button type="button" className="btn btn-outline" onClick={cancelEditTeacher}>Cancel</button>}
                  </div>
                </form>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="card-title" style={{ margin: "20px 24px 0", border: "none" }}>All teachers ({teachers.length})</div>
                <table className="ledger">
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th></th></tr></thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td className="mono">{t.id}</td><td>{t.name}</td><td>{t.email}</td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => startEditTeacher(t)}>Edit</button>
                          <button className="btn btn-danger-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => deleteTeacher(t.id, t.name)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {teachers.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", padding: 24 }} className="text-muted">No teachers yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------- STUDENTS ---------------- */}
          {activeSection === "students" && (
            <div className="grid-2">
              <div className="card">
                <div className="card-title">{editingStudentId ? "Edit student" : "Add student"}</div>
                <form onSubmit={submitStudent}>
                  <div className="field"><label>Roll no</label>
                    <input className="input mono" required value={studentForm.rollNo} onChange={(e) => setStudentForm({ ...studentForm, rollNo: e.target.value })} /></div>
                  <div className="field"><label>Name</label>
                    <input className="input" required value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} /></div>
                  <div className="field"><label>Email</label>
                    <input className="input" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} /></div>
                  <div className="field"><label>Branch</label>
                    <input className="input" value={studentForm.branch} onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })} /></div>
                  <div className="field"><label>Semester</label>
                    <input className="input" placeholder="e.g. MCA 3rd" required value={studentForm.semester} onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })} /></div>
                  <div className="field"><label>Section</label>
                    <input className="input" placeholder="e.g. A" required value={studentForm.section} onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })} /></div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-primary btn-block">{editingStudentId ? "Save changes" : "Add student"}</button>
                    {editingStudentId && <button type="button" className="btn btn-outline" onClick={cancelEditStudent}>Cancel</button>}
                  </div>
                </form>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="card-title" style={{ margin: "20px 24px 0", border: "none" }}>All students ({students.length})</div>
                <table className="ledger">
                  <thead><tr><th>Roll</th><th>Name</th><th>Sem</th><th>Sec</th><th>Face</th><th></th></tr></thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id}>
                        <td className="roll">{s.rollNo}</td><td>{s.name}</td><td>{s.semester}</td><td>{s.section}</td>
                        <td><span className={`stamp ${s.faceRegistered ? "stamp-present" : "stamp-pending"}`}>{s.faceRegistered ? "Yes" : "No"}</span></td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => startEditStudent(s)}>Edit</button>
                          <button className="btn btn-danger-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => deleteStudent(s.id, s.name)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center", padding: 24 }} className="text-muted">No students yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------- SUBJECTS ---------------- */}
          {activeSection === "subjects" && (
            <div className="grid-2">
              <div className="card">
                <div className="card-title">{editingSubjectId ? "Edit subject" : "Add subject"}</div>
                <form onSubmit={submitSubject}>
                  <div className="field"><label>Subject name</label>
                    <input className="input" placeholder="e.g. DSA" required value={subjectForm.subjectName} onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })} /></div>
                  <div className="field"><label>Subject code</label>
                    <input className="input mono" value={subjectForm.subjectCode} onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })} /></div>
                  <div className="field"><label>Teacher ID</label>
                    <input className="input mono" type="number" required value={subjectForm.teacherId} onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })} />
                    <div className="text-muted" style={{ marginTop: 4 }}>See the Teachers page for valid IDs.</div></div>
                  <div className="field"><label>Semester</label>
                    <input className="input" required value={subjectForm.semester} onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })} /></div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-primary btn-block">{editingSubjectId ? "Save changes" : "Add subject"}</button>
                    {editingSubjectId && <button type="button" className="btn btn-outline" onClick={cancelEditSubject}>Cancel</button>}
                  </div>
                </form>
              </div>

              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="card-title" style={{ margin: "20px 24px 0", border: "none" }}>All subjects ({subjects.length})</div>
                <table className="ledger">
                  <thead><tr><th>ID</th><th>Name</th><th>Code</th><th>Teacher ID</th><th>Sem</th><th></th></tr></thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id}>
                        <td className="mono">{s.id}</td><td>{s.subjectName}</td><td className="mono">{s.subjectCode}</td>
                        <td className="mono">{s.teacherId}</td><td>{s.semester}</td>
                        <td style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => startEditSubject(s)}>Edit</button>
                          <button className="btn btn-danger-outline" style={{ padding: "5px 12px", fontSize: "0.8rem" }} onClick={() => deleteSubject(s.id, s.subjectName)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {subjects.length === 0 && <tr><td colSpan="6" style={{ textAlign: "center", padding: 24 }} className="text-muted">No subjects yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------- REGISTER FACE ---------------- */}
          {activeSection === "face" && (
            <div className="card" style={{ maxWidth: 460 }}>
              <div className="card-title">Register student face</div>
              <p className="text-muted" style={{ marginTop: -8, marginBottom: 16 }}>Upload 1–5 clear photos of one student.</p>
              <form onSubmit={registerFace}>
                <div className="field"><label>Roll no</label>
                  <input className="input mono" required value={faceRollNo} onChange={(e) => setFaceRollNo(e.target.value)} /></div>
                <div className="field"><label>Photos</label>
                  <input className="input" type="file" accept="image/*" multiple required onChange={(e) => setFaceImages(Array.from(e.target.files))} /></div>
                <button className="btn btn-brass btn-block">Register face</button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
