// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login";
import Dashboard from "./pages/Dashboard";
import { getRoleFromToken, isTokenValid } from "./utils/jwt";

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("vitId");
    return <Navigate to="/login" replace />;
  }
  const roleFromJwt = getRoleFromToken(token);
  const userRole = roleFromJwt || localStorage.getItem("userRole");
  if (role && userRole && role !== userRole) {
    return <Navigate to={`/${userRole}`} replace />;
  }
  return children;
}

function RootRedirect() {
  const token = localStorage.getItem("token");
  if (token && isTokenValid(token)) {
    const roleFromJwt = getRoleFromToken(token);
    const userRole = roleFromJwt || localStorage.getItem("userRole") || "login";
    return <Navigate to={`/${userRole}`} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/student/*" element={<ProtectedRoute role="student"><Dashboard /></ProtectedRoute>} />
        <Route path="/faculty/*" element={<ProtectedRoute role="faculty"><Dashboard /></ProtectedRoute>} />
        <Route path="/warden/*" element={<ProtectedRoute role="warden"><Dashboard /></ProtectedRoute>} />
        <Route path="/security/*" element={<ProtectedRoute role="security"><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
