import Sidebar from "../components/Sidebar";

export default function FacultyLayout({ children, scrollRef }) {
  return (
    <div className="app-layout">
      {/* Wrap the sidebar so we can style it reliably */}
      <aside className="sidebar">
        <Sidebar role="faculty" />
      </aside>

      {/* Single, scrollable main */}
      <main className="main scrollable-main" ref={scrollRef}>
        {children}
      </main>
    </div>
  );
}
