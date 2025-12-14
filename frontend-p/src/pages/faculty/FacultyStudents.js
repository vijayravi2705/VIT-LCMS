// src/pages/faculty/FacultyStudents.jsx
import React, { useEffect, useMemo, useState } from "react";
import FacultyLayout from "../layouts/FacultyLayout";
import "../assets/styles/facultystudent.css";
import api from "../../utils/api";

const Stat = ({ tone = "info", children }) => <span className={`stat stat-${tone}`}>{children}</span>;
const Chip = ({ tone = "muted", children }) => <span className={`chip chip-${tone}`}>{children}</span>;
const formatDT = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const StudentDrawer = ({ student, onClose }) => {
  const [viewComplaint, setViewComplaint] = useState(null);
  useEffect(() => { setViewComplaint(null); }, [student]);
  const handleClose = () => { setViewComplaint(null); onClose?.(); };
  if (!student) return null;

  const hasProctor =
    student.proctor &&
    (student.proctor.name ||
      student.proctor.email ||
      student.proctor.phone ||
      student.proctor.office ||
      student.proctor.hours);

  const against = student.complaintsAgainst ?? [];
  const by = student.complaintsBy ?? [];

  const StatusChip = ({ status }) => {
    const tone =
      status === "Resolved"
        ? "green"
        : status?.toLowerCase().includes("progress") || status === "In Review"
        ? "amber"
        : "indigo";
    return <Chip tone={tone}>{status}</Chip>;
  };

  const ComplaintRow = ({ c, onOpenSheet, clickable = true }) => {
    const handleClick = () => {
      if (!clickable || !onOpenSheet) return;
      onOpenSheet(c);
    };
    return (
      <div
        className="compl-row"
        style={{
          border: "1px dashed #dbe3ef",
          borderRadius: 12,
          padding: 12,
          margin: "10px 0",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(2,8,23,.03)",
          transition: "transform .18s, box-shadow .18s, border-color .18s",
        }}
      >
        <div
          className="compl-head"
          onClick={handleClick}
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : -1}
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "120px minmax(160px,1fr) auto auto minmax(160px,auto) 40px",
            gap: 12,
            alignItems: "center",
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: clickable ? "pointer" : "default",
            textAlign: "left",
          }}
          aria-label={clickable ? `Open details for ${c.id}` : undefined}
        >
          <span className="mono muted">{c.id}</span>
          <span
            style={{
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {c.title}
          </span>
          <Chip tone="blue">{c.category}</Chip>
          <StatusChip status={c.status} />
          <span className="muted">{formatDT(c.updatedAt)}</span>
         
        </div>
      </div>
    );
  };

  const ComplaintSheet = ({ complaint, onClose }) => {
    if (!complaint) return null;
    return (
      <>
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.35)",
            backdropFilter: "blur(3px)",
            zIndex: 90,
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            left: "50%",
            top: "8vh",
            transform: "translateX(-50%)",
            width: "min(820px, 92vw)",
            maxHeight: "84vh",
            overflow: "auto",
            background: "#fff",
            border: "1px solid rgba(2,8,23,.1)",
            borderRadius: 18,
            boxShadow: "0 22px 60px rgba(2,8,23,.18)",
            padding: 18,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>
              {complaint.title} <span className="mono muted" style={{ fontSize: ".9rem" }}>({complaint.id})</span>
            </h3>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <Chip tone="blue">{complaint.category}</Chip>
            <StatusChip status={complaint.status} />
            <Chip tone="muted">{formatDT(complaint.updatedAt)}</Chip>
          </div>

          <div className="timeline" style={{ marginTop: 12 }}>
            {(complaint.timeline ?? []).map((t, i) => (
              <div className="t-item" key={i}>
                <div className="t-dot" />
                <div className="t-content">
                  <div className="t-top">
                    <span className="mono">{formatDT(t.t)}</span>
                    <Chip tone="muted">{t.by}</Chip>
                  </div>
                  <p>{t.what}</p>
                </div>
              </div>
            ))}
            {complaint.decision && (
              <div className="decision">
                <b>Decision:</b> {complaint.decision.result} <span className="muted">• {complaint.decision.notes}</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  async function fetchComplaint(id) {
    try {
      const { data } = await api.get(`/faculty/students/complaints/${id}`);
      setViewComplaint(data.complaint || null);
    } catch {
      setViewComplaint(null);
    }
  }

  return (
    <>
      <div className="fx-dim" onClick={handleClose} />
      <section className="fx-drawer" role="dialog" aria-modal="true">
        <header className="fx-drawer-head">
          <div className="id-row">
            <img
              className="avatar-lg"
              src={
                student.avatar ||
                `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(
                  student.full_name || student.vit_id || "Student"
                )}`
              }
              alt={student.full_name || student.vit_id}
            />
            <div>
              <h2>{student.full_name}</h2>
              <div className="muted mono">{student.vit_id}</div>
            </div>
          </div>
          <div className="drawer-stats">
            <Stat tone="info">● {student.stats?.total ?? 0} <b>Total</b></Stat>
            <Stat tone="warn">● {student.stats?.open ?? 0} <b>Open</b></Stat>
            <Stat tone="ok">● {student.stats?.resolved ?? 0} <b>Resolved</b></Stat>
            <button className="icon-btn" onClick={handleClose} aria-label="Close">✕</button>
          </div>
        </header>

        <div className="fx-drawer-body">
          <div className="card row">
            <div className="grid-2">
              <h4><u>Contact Details</u> :-</h4>
              <br />
              <div><b>Email:</b> {student.email}</div>
              <div><b>Phone:</b> {student.phone}</div>
            </div>
          </div>

          <div className="card academics-card">
            <div className="academics-header">
              <h4><u>Academics Details</u> :-</h4>
            </div>
            <br />
            <div className="academics-body">
              <div className="academics-left">
                <div><b>Department/School:</b> {student.school}</div>
                <div><b>Course:</b> {student.course}</div>
              </div>
              <div className="academics-right">
                <div><b>Proctor / Advisor:</b> {student.proctor?.name || "-"}</div>
                {hasProctor && (
                  <div className="muted">
                    {student.proctor?.email && <>• {student.proctor.email}<br /></>}
                    {student.proctor?.phone && <>• {student.proctor.phone}<br /></>}
                    {student.proctor?.office && <>• {student.proctor.office}<br /></>}
                    {student.proctor?.hours && <>• {student.proctor.hours}</>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card row">
            <div className="grid-2">
              <h4><u>Hostel Details</u> :-</h4>
              <br />
              <div><b>Block:</b> {student.block_code}</div>
              <div><b>Room:</b> {student.room_no}</div>
            </div>
          </div>

          <div className="card">
            <div className="row-head">
              <h4>Complaints Against</h4>
              <Chip tone="muted">{against.length} item(s)</Chip>
            </div>
            {against.length === 0 ? (
              <div className="muted">No complaints against this student.</div>
            ) : (
              <div>
                {against.map((c) => (
                  <ComplaintRow key={c.id} c={c} clickable={false} />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="row-head">
              <h4>Complaints Filed By</h4>
              <Chip tone="muted">{by.length} item(s)</Chip>
            </div>
            {by.length === 0 ? (
              <div className="muted">No complaints filed by this student.</div>
            ) : (
              <div>
                {by.map((c) => (
                  <ComplaintRow key={c.id} c={c} clickable={true} onOpenSheet={(cc) => fetchComplaint(cc.id)} />
                ))}
              </div>
            )}
          </div>

          <ComplaintSheet complaint={viewComplaint} onClose={() => setViewComplaint(null)} />
        </div>
      </section>
    </>
  );
};

export default function FacultyStudents() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = q.trim();
    if (!s) {
      setList([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/faculty/students/search?q=${encodeURIComponent(s)}`);
        setList(data.items || []);
      } catch {
        setList([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  async function openStudent(vit) {
    try {
      const { data } = await api.get(`/faculty/students/${vit}/bundle`);
      const profile = data.profile || {};
      const sBy = data.stats?.by || { total: 0, open: 0, resolved: 0 };
      const sAg = data.stats?.against || { total: 0, open: 0, resolved: 0 };
      const mergedStats = {
        total: Number(sBy.total || 0) + Number(sAg.total || 0),
        open: Number(sBy.open || sBy.open_ || 0) + Number(sAg.open || sAg.open_ || 0),
        resolved: Number(sBy.resolved || 0) + Number(sAg.resolved || 0),
      };
      setSelected({
        ...profile,
        stats: mergedStats,
        complaintsBy: data.complaintsBy || [],
        complaintsAgainst: data.complaintsAgainst || [],
      });
    } catch {
      setSelected(null);
      alert("Failed to load profile");
    }
  }

  const results = useMemo(() => list, [list]);

  return (
    <FacultyLayout>
      <div className="fx-page">
        <header className="fx-header">
          <h1 className="fx-title">Student Profiles</h1>
          <p className="fx-sub">Search by Reg No, Name, Email, or Phone.</p>
        </header>

        <div className="fx-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Reg No / Name / Email / Phone…"
            autoFocus
          />
        </div>

        <div className="fx-result-list">
          {q && loading && <div className="hint muted">Searching…</div>}
          {q && !loading && results.length === 0 && <div className="hint muted">No matches. Try a different keyword.</div>}
          {results.map((s) => (
            <button className="result-card" key={s.vit_id} onClick={() => openStudent(s.vit_id)}>
              <div className="rc-main">
                <div className="rc-top">
                  <span className="name">{s.full_name}</span>
                  <span className="muted mono"><br />{s.vit_id}</span>
                </div>
                <div className="muted small">{s.school}</div>
              </div>
              <div className="rc-stats">
                <Stat tone="info">● {(s.stats?.total ?? s.total) ?? 0} Total</Stat>
                <Stat tone="warn">● {(s.stats?.open ?? s.open) ?? 0} Open</Stat>
                <Stat tone="ok">● {(s.stats?.resolved ?? s.resolved) ?? 0} Resolved</Stat>
              </div>
            </button>
          ))}
        </div>

        {selected && <StudentDrawer key={selected.vit_id} student={selected} onClose={() => setSelected(null)} />}
      </div>
    </FacultyLayout>
  );
}
