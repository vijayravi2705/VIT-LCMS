import Sidebar from "../components/Sidebar";

export default function StudentLayout({ children, scrollRef }) {
  return (
    <div className="app-layout">
      {/* Sidebar wrapper */}
      <aside className="sidebar">
        <Sidebar role="student" />
      </aside>

      {/* Single, scrollable main */}
      <main className="main scrollable-main" ref={scrollRef}>
        {children}
      </main>
    </div>
  );
}
