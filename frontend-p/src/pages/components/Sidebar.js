// src/components/Sidebar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  ClipboardList,
  User,
  History,
  LogOut,
  Shield,
  Briefcase,
  UserSearch,
  BarChart2,
  Users,
  UserCog,
} from "lucide-react";
import "../assets/styles/sidebar.css";

export default function Sidebar({ role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  const menus = {
    student: [
      { name: "Home", path: "/student", icon: <Home size={20} /> },
      { name: "Complaint Box", path: "/student/complaint", icon: <FileText size={20} /> },
      { name: "History", path: "/student/history", icon: <History size={20} /> },
      { name: "Logout", action: handleLogout, icon: <LogOut size={20} /> },
    ],
    faculty: [
      { name: "Dashboard", path: "/faculty", icon: <Home size={20} /> },
      { name: "Student Profiles", path: "/faculty/students", icon: <UserSearch size={20} /> },
      { name: "File Report", path: "/faculty/report", icon: <ClipboardList size={20} /> },
      { name: "Complaints", path: "/faculty/complaints", icon: <FileText size={20} /> },
      { name: "Report History", path: "/faculty/history", icon: <History size={20} /> },
      { name: "Analytics", path: "/faculty/analytics", icon: <BarChart2 size={20} /> },
      { name: "Logout", action: handleLogout, icon: <LogOut size={20} /> },
    ],


    warden: [
      { name: "Dashboard", path: "/warden", icon: <Home size={20} /> },
      { name: "Complaints", path: "/warden/complaints", icon: <FileText size={20} /> },
      { name: "File Report", path: "/warden/report", icon: <ClipboardList size={20} /> },
      { name: "Directory", path: "/warden/directory", icon: <Users size={20} /> },
      { name: "History", path: "/warden/history", icon: <History size={20} /> },
      { name: "Logout", action: handleLogout, icon: <LogOut size={20} /> },
    ],

security: [
  { name: "File Report", path: "/security/report", icon: <ClipboardList size={20} /> },
  { name: "Logout", action: handleLogout, icon: <LogOut size={20} /> },
],

  };

  return (
    <aside className={`sidebar ${role}`}>
      <h2 className="sidebar-title">{role.toUpperCase()} Dashboard</h2>
      <ul className="sidebar-menu">
        {menus[role]?.map((item, i) => (
          <li key={i}>
            {item.path ? (
              <Link to={item.path} className="menu-item">
                {item.icon}
                <span className="menu-text">{item.name}</span>
              </Link>
            ) : (
              <button onClick={item.action} className="menu-item">
                {item.icon}
                <span className="menu-text">{item.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
