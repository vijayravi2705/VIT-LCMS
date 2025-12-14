
// src/pages/Dashboard.jsx
import React, { useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// --- Student pages (direct imports)
import StudentHome from "./student/StudentHome";
import StudentComplaint from "./student/StudentComplaint";
import StudentHistory from "./student/StudentHistory";

// --- Faculty pages (DIRECT IMPORTS - create these files or keep placeholders below)
import FacultyDashboard from "./faculty/FacultyDashboard";
import FacultyComplaints from "./faculty/FacultyComplaints";
import FacultyReport from "./faculty/FacultyReport";
import FacultyHistory from "./faculty/FacultyHistory";
import FacultyAnalytics from "./faculty/FacultyAnalytics";
import FacultyStudents from "./faculty/FacultyStudents";

// --- WARDEN PAGES (DIRECT IMPORTS) ---
// Create these files or keep fallbacks below:
import WardenDashboard  from "./warden/WardenDashboard";
import WardenComplaint from "./warden/WardenComplaint";
import WardenReport     from "./warden/WardenReport";
import WardenHistory    from "./warden/WardenHistory";
import WardenDirectory  from "./warden/WardenDirectory";



import SecurityReport from "./security/SecurityReport";
// ----------------------------------------------------------

const Page = ({ title }) => <h2 style={{ margin: 16 }}>{title}</h2>;
const VALID_ROLES = ["student", "faculty", "warden", "security"];



// ...imports unchanged...

export default function Dashboard({ role }) {
  const location = useLocation();

  const activeRole = useMemo(() => {
    const seg = location.pathname.split("/")[1];
    const urlRole = VALID_ROLES.includes(seg) ? seg : null;
    const propRole = VALID_ROLES.includes(role || "") ? role : null;
    const lsRole = VALID_ROLES.includes(localStorage.getItem("userRole") || "")
      ? localStorage.getItem("userRole")
      : null;
    return propRole || urlRole || lsRole || "student";
  }, [role, location.pathname]);

  if (!VALID_ROLES.includes(activeRole)) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar role={activeRole} />

      <main style={{ flex: 1, padding: "20px" }}>
        {/* STUDENT ROUTES */}
        {activeRole === "student" && (
          <Routes>
            <Route index element={<StudentHome />} />
            <Route path="complaint" element={<StudentComplaint />} />
            
            <Route path="history" element={<StudentHistory />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Routes>
        )}

        {/* FACULTY ROUTES */}
        {activeRole === "faculty" && (
          <Routes>
            <Route index element={<FacultyDashboard />} />
            <Route path="complaints" element={<FacultyComplaints />} />
            <Route path="report" element={<FacultyReport />} />
            <Route path="history" element={<FacultyHistory />} />
            <Route path="analytics" element={<FacultyAnalytics />} />
            <Route path="students" element={<FacultyStudents />} />
            <Route path="*" element={<Navigate to="/faculty" replace />} />
          </Routes>
        )}

        {/* WARDEN ROUTES */}
        {activeRole === "warden" && (
          <Routes>
            <Route index element={<WardenDashboard />} />
            <Route path="complaints" element={<WardenComplaint />}/>
            <Route path="report" element={<WardenReport />} />
            <Route path="history" element={<WardenHistory />} />
            <Route path="directory" element={<WardenDirectory/>}/>
            <Route path="*" element={<Navigate to="/warden" replace />} />
          </Routes>
        )}

        {/* SECURITY ROUTES */}
        {activeRole === "security" && (
          <Routes>
            <Route index element={<SecurityReport />} />
            <Route path="report" element={<SecurityReport />} />
            <Route path="*" element={<Navigate to="/security" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
