import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import CreateClass from "./pages/CreateClass";
import TakeAttendance from "./pages/TakeAttendance";
import ViewAttendance from "./pages/ViewAttendance";
import StudentsList from "./pages/StudentsList";
import TodayAttendance from "./pages/TodayAttendance";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/create-class"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <CreateClass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/class/:classSessionId/attendance"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TakeAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/class/:classSessionId/view"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <ViewAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <StudentsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/today"
        element={
          <ProtectedRoute allowedRoles={["TEACHER", "ADMIN"]}>
            <TodayAttendance />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
