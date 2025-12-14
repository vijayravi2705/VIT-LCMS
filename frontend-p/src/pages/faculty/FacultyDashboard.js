// src/pages/faculty/FacultyDashboard.jsx
import React, { useMemo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/facultyDashboard.css";
import FacultyLayout from "../layouts/FacultyLayout";
import api from "../../utils/api";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

function useSmoothScroll() {
  const ref = useRef(null);
  const scrollBy = (d) => ref.current?.scrollBy({ top: d, behavior: "smooth" });
  const toTop = () => ref.current?.scrollTo({ top: 0, behavior: "smooth" });
  const toBottom = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  return { ref, scrollBy, toTop, toBottom };
}

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { ref: pageRef } = useSmoothScroll();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ myReports: 0, pending: 0, resolved: 0 });
  const [items, setItems] = useState([]);
  const [emergencyRecent, setEmergencyRecent] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [a, c] = await Promise.all([
          api.get("/analytics/faculty-dashboard"),
          api.get("/complaints", { params: { limit: 200 } }),
        ]);
        if (!mounted) return;
        setMetrics({
          myReports: Number(a.data?.myReports || 0),
          pending: Number(a.data?.pending || 0),
          resolved: Number(a.data?.resolved || 0),
        });
        setEmergencyRecent(
          (a.data?.emergencyRecent || []).map((r) => ({
            id: r.complaint_id,
            title: r.title,
            category: r.category,
            status: String(r.status || "").replace(/_/g, " ").replace(/\b\w/g, s => s.toUpperCase()),
            updatedAt: r.created_on,
          }))
        );
        setItems(c.data?.items || []);
      } finally {
        setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const statusBreakdown = useMemo(() => {
    const groups = ["submitted", "in_review", "in_progress", "resolved"];
    const map = Object.fromEntries(groups.map((g) => [g, 0]));
    items.forEach((it) => {
      const s = String(it.status || "").toLowerCase();
      if (map[s] !== undefined) map[s] += 1;
    });
    const label = {
      submitted: "Submitted",
      in_review: "In Review",
      in_progress: "In Progress",
      resolved: "Resolved",
    };
    return groups.map((g) => ({ name: label[g], value: map[g] }));
  }, [items]);

  const categoryBreakdown = useMemo(() => {
    const m = new Map();
    items.forEach((it) => {
      const k = it.category || "Other";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [items]);

  const COLORS = ["#60a5fa", "#22c55e", "#f59e0b", "#ef4444"];
  const go = (p) => navigate(p);

  return (
    <FacultyLayout scrollRef={pageRef}>
      <div className="fd-wrapper" role="main" aria-label="Faculty dashboard">
        <div className="fd-head">
          <div>
            <h1 className="fd-title">Faculty Dashboard</h1>
            <p className="fd-sub">Quick view of reports, actions and emergency cases.</p>
          </div>
          <div className="fd-actions">
            <button className="fd-primary" onClick={() => go("/faculty/report")}>+ File New Report</button>
            <button className="fd-ghost" onClick={() => go("/faculty/complaints")}>View All Complaints</button>
          </div>
        </div>

        <div className="fd-kpis">
          <div className="kpi-card clickable" onClick={() => go("/faculty/history")}>
            <div className="kpi-label">My Reports Filed</div>
            <div className="kpi-value">{loading ? "…" : metrics.myReports}</div>
            <div className="kpi-meta">Filed by you</div>
          </div>
          <div className="kpi-card clickable" onClick={() => go("/faculty/complaints?filter=pending")}>
            <div className="kpi-label">Total Pending</div>
            <div className="kpi-value">{loading ? "…" : metrics.pending}</div>
            <div className="kpi-meta">Submitted • In Review • In Progress</div>
          </div>
          <div className="kpi-card clickable" onClick={() => go("/faculty/history?filter=resolved")}>
            <div className="kpi-label">Resolved Cases</div>
            <div className="kpi-value">{loading ? "…" : metrics.resolved}</div>
            <div className="kpi-meta">Closed successfully</div>
          </div>
        </div>

        <div className="fd-charts">
          <div className="fd-card">
            <div className="fd-card-head"><h3>Status Breakdown</h3></div>
            <div className="fd-chart-body">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart margin={{ top: 16, right: 50, bottom: 16, left: 50 }}>
                  <Pie
                    data={statusBreakdown}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={76}
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="fd-card">
            <div className="fd-card-head"><h3>Complaints by Category</h3></div>
            <div className="fd-chart-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryBreakdown} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} domain={[0, "dataMax + 1"]} tickMargin={8} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#barGradient)" />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#00c6ff" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="fd-card fd-table" aria-label="Emergency – Recently Updated" style={{ marginTop: 16 }}>
          <div className="fd-card-head">
            <h3>Emergency – Recently Updated</h3>
            <span className="fd-muted">Latest first • High priority only</span>
          </div>
          <div className="fd-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: "center" }}>Loading…</td></tr>
                ) : emergencyRecent.length ? (
                  emergencyRecent.map((c) => (
                    <tr key={c.id} className="row-link" onClick={() => go(`/faculty/complaints?focus=${encodeURIComponent(c.id)}`)}>
                      <td className="mono">{String(c.id).slice(0, 12)}…</td>
                      <td>{c.title}</td>
                      <td><span className="chip">{c.category}</span></td>
                      <td><span className={`pill ${String(c.status).replace(" ","-").toLowerCase()}`}>{c.status}</span></td>
                      <td className="muted">{new Date(c.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ textAlign: "center" }}>No emergency cases right now 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
