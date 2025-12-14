// src/pages/layouts/WardenLayout.jsx
import React from "react";
import Sidebar from "../components/Sidebar";

export default function WardenLayout({ children, scrollRef }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Sidebar role="warden" />
      </aside>

      {/* Main content (scrollable) */}
      <main className="main scrollable-main" ref={scrollRef}>
        {children}
      </main>
    </div>
  );
}
