// src/layouts/SecurityLayout.jsx
import React from "react";
import Sidebar from "../components/Sidebar";

export default function SecurityLayout({ children, scrollRef }) {
  return (
    <div className="app-layout">
      {/* Sidebar wrapper */}
      <aside className="sidebar">
        <Sidebar role="security" />
      </aside>

      {/* Single, scrollable main */}
      <main className="main scrollable-main" ref={scrollRef}>
        {children}
      </main>
    </div>
  );
}
