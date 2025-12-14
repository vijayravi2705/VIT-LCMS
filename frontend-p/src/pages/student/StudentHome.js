// src/pages/student/StudentHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../assets/styles/studenthome.css";
import StudentLayout from "../layouts/StudentLayout";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "react-router-dom";

export default function StudentHome() {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem("token");
    const api = axios.create({
      baseURL: "http://localhost:4000/api",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    async function load() {
      try {
        const [p, s] = await Promise.all([
          api.get("/student/profile"),
          api.get("/student/summary"),
        ]);
        if (!mounted) return;
        setProfile(p.data?.profile || null);
        setSummary(s.data?.summary || null);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setErr("Could not load your dashboard. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const studentName = useMemo(() => {
    if (profile?.full_name) return profile.full_name;
    const fallback = localStorage.getItem("username");
    return fallback || "Student";
  }, [profile]);

  const stats = useMemo(() => {
    const resolved = Number(summary?.resolved || 0);
    const pending = Number(summary?.pending || 0);
    const rejected = Number(summary?.rejected || 0);
    const total = Number(summary?.total || resolved + pending + rejected);
    const pct = (v) => (total ? Math.round((v / total) * 100) : 0);
    const data = [
      { name: "Resolved", value: resolved, color: "#10b981" },
      { name: "Pending", value: pending, color: "#f59e0b" },
      { name: "Rejected", value: rejected, color: "#ef4444" },
    ];
    return { total, pct, data };
  }, [summary]);

  const actions = [
    { to: "complaint", title: "📄 File New Complaint", desc: "Submit a new complaint easily." },
    { to: "status", title: "📊 Check Status", desc: "Track progress of your complaints." },
    { to: "history", title: "🕑 Complaint History", desc: "View all your past complaints." },
    { to: "profile", title: "🏠 Hostel Details", desc: "View your hostel & mess info." },
  ];

  return (
    <StudentLayout>
      <div className="sth-wrap">
        <div className="sth-container">
          {/* Header / KPIs */}
          <section className="sth-welcome">
            <h1 className="sth-title">Welcome, {studentName} 🎓</h1>

            {loading ? (
              <div className="sth-kpi-row">
                <KPI label="Total Complaints" value="…" barPct={0} />
                <KPI label="Resolved" value="…" barPct={0} />
                <KPI label="Pending" value="…" barPct={0} />
              </div>
            ) : err ? (
              <div className="sth-error">{err}</div>
            ) : (
              <div className="sth-kpi-row">
                <KPI label="Total Complaints" value={stats.total} barPct={100} />
                <KPI label="Resolved" value={summary?.resolved || 0} barPct={stats.pct(summary?.resolved || 0)} />
                <KPI label="Pending" value={summary?.pending || 0} barPct={stats.pct(summary?.pending || 0)} />
              </div>
            )}
          </section>

          {/* Main grid */}
          <section className="sth-grid">
            {/* Left: Hostel card + Quick shortcuts */}
            <div className="sth-left">
              <Link to="profile" className="sth-link">
                <div className="sth-card">
                  <h3>🏠 Hostel Details</h3>
                  {loading ? (
                    <>
                      <p>Loading…</p>
                    </>
                  ) : profile ? (
                    <>
                      <p><b>Block:</b> {profile.block_code || "-"}</p>
                      <p><b>Room No:</b> {profile.room_no || "-"}</p>
                      <p><b>Mess Type:</b> {profile.mess_type || "-"}</p>
                      <p><b>Mess Caterer:</b> {profile.mess_caterer || "-"}</p>
                    </>
                  ) : (
                    <p>No profile found.</p>
                  )}
                </div>
              </Link>

              <div className="sth-card">
                <h3>⚡ Quick Shortcuts</h3>
                <div className="sth-actions">
                  {actions.map((a) => (
                    <Link key={`quick-${a.to}`} to={a.to} className="sth-chip">
                      {a.title.split(" ")[0]} <span>{a.title.replace(/^[^\s]+\s/, "")}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Action cards */}
            <div className="sth-right">
              {actions.slice(0, 3).map((a) => (
                <Link key={a.to} to={a.to} className="sth-link">
                  <div className="sth-card sth-click">
                    <h3>{a.title}</h3>
                    <p>{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Right-most: Chart */}
            <div className="sth-rightmost">
              <div className="sth-card sth-chart">
                <h3>📈 Complaint Stats</h3>
                <div className="sth-chart-box">
                  {loading ? (
                    <div className="sth-chart-placeholder">Loading chart…</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={92}
                          startAngle={90}
                          endAngle={-270}
                          labelLine={false}
                        >
                          {stats.data.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                            padding: "10px 12px",
                          }}
                          itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                          labelStyle={{
                            color: "#2563eb",
                            fontWeight: 700,
                            marginBottom: "6px",
                          }}
                          formatter={(value, name) => [`${value}`, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Recent list (optional, if you want to show the 5 latest) */}
        {summary?.recent?.length ? (
  <section className="sth-card" style={{ marginTop: 16 }}>
    <h3>🗂️ Recent Complaints</h3>

    {/* Header row */}
    <div className="sth-recent-head">
      <span>ID</span>
      <span>Date & Time</span>
      <span>Category</span>
      <span>Status</span>
      <span>Title</span>
    </div>

    <div className="sth-recent">
      {summary.recent.map((c) => (
        <Link
          key={c.complaint_id}
          className="sth-recent-row"
          to={`/student/status?focus=${encodeURIComponent(c.complaint_id)}`}
          title="Open in status page"
        >
          <span className="mono">{c.complaint_id}</span>
          <span className="muted">{new Date(c.created_on).toLocaleString()}</span>
          <span className="chip">{c.category}</span>
          <span className={`pill ${String(c.status).replace("_", "-")}`}>{c.status}</span>
          <span className="title">{c.title}</span>
        </Link>
      ))}
    </div>
  </section>
) : null}

        </div>
      </div>
    </StudentLayout>
  );
}

function KPI({ label, value, barPct = 0 }) {
  return (
    <div className="sth-kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="bar">
        <span style={{ width: `${Math.min(Math.max(barPct, 0), 100)}%` }} />
      </div>
    </div>
  );
}
