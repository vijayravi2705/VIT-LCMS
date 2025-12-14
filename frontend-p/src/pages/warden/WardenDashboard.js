// src/pages/warden/WardenDashboard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/styles/wardendash.css";
import WardenLayout from "../layouts/WardenLayout";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../../utils/api";

const API_BASE = "/warden/dashboard";
const COLORS = ["#60a5fa", "#22c55e", "#f59e0b", "#ef4444"];

function useSmoothScroll() {
  const ref = useRef(null);
  const scrollBy = (distance) =>
    ref.current?.scrollBy({ top: distance, behavior: "smooth" });
  const toTop = () => ref.current?.scrollTo({ top: 0, behavior: "smooth" });
  const toBottom = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  return { ref, scrollBy, toTop, toBottom };
}

const mapStatusSeries = (rows) =>
  (rows || []).map((row) => ({
    name: row.name || row.status || "Unknown",
    value: Number(row.value ?? row.count ?? 0),
  }));

const mapCategorySeries = (rows) =>
  (rows || []).map((row) => ({
    name: row.name || row.category || "Unlabelled",
    value: Number(row.value ?? row.count ?? 0),
  }));

const fmtDate = (value) => {
  if (!value) return "—";
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toLocaleString();
};

export default function WardenDashboard() {
  const navigate = useNavigate();
  const { ref: pageRef } = useSmoothScroll();

  const [summary, setSummary] = useState(null);
  const [statusRows, setStatusRows] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [summaryRes, statusRes, categoryRes, emergencyRes] = await Promise.all([
          api.get(`${API_BASE}/summary`),
          api.get(`${API_BASE}/status`),
          api.get(`${API_BASE}/categories`, { params: { months: 6 } }),
          api.get(`${API_BASE}/emergencies`, { params: { limit: 20 } }),
        ]);

        if (cancelled) return;

        if (summaryRes.data?.ok) {
          const { ok: _, ...rest } = summaryRes.data;
          setSummary(rest);
        } else {
          setSummary(null);
        }

        setStatusRows(statusRes.data?.items || statusRes.data || []);
        setCategoryRows(categoryRes.data?.items || categoryRes.data || []);
        setEmergencies(emergencyRes.data?.items || emergencyRes.data || []);
        setError("");
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load warden dashboard:", err);
        setError("Failed to load dashboard. Please try again shortly.");
        setSummary(null);
        setStatusRows([]);
        setCategoryRows([]);
        setEmergencies([]);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusBreakdown = useMemo(() => mapStatusSeries(statusRows), [statusRows]);
  const categoryBreakdown = useMemo(() => mapCategorySeries(categoryRows), [categoryRows]);

  const go = (path) => navigate(path);

  return (
    <WardenLayout scrollRef={pageRef}>
      <div className="wdds-wrapper" role="main" aria-label="Warden dashboard">
        <div className="wdds-head">
          <div>
            <h1 className="wdds-title">Warden Dashboard</h1>
            <p className="wdds-sub">Quick view of reports, actions, and emergency cases.</p>
          </div>
          <div className="wdds-actions">
            <button className="wdds-primary" onClick={() => go("/warden/report")}>
              + File New Report
            </button>
            <button className="wdds-ghost" onClick={() => go("/warden/complaints")}>
              View All Complaints
            </button>
          </div>
        </div>

        {error && <div className="wdds-error">{error}</div>}

        <div className="wdds-kpis">
          <div className="kpi-card">
            <div className="kpi-label">My Reports Filed</div>
            <div className="kpi-value">{summary?.my_reports ?? "—"}</div>
            <div className="kpi-meta">Filed by you</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Total Pending</div>
            <div className="kpi-value">{summary?.pending ?? "—"}</div>
            <div className="kpi-meta">Submitted • In Review • In Progress</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Resolved Cases</div>
            <div className="kpi-value">{summary?.resolved ?? "—"}</div>
            <div className="kpi-meta">Closed successfully</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Total Complaints</div>
            <div className="kpi-value">{summary?.total ?? "—"}</div>
            <div className="kpi-meta">Block: {summary?.block || "—"}</div>
          </div>
        </div>

        <div className="wdds-charts">
          <div className="wdds-card">
            <div className="wdds-card-head">
              <h3>Status Breakdown</h3>
            </div>
            <div className="wdds-chart-body">
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
                    {statusBreakdown.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="wdds-card">
            <div className="wdds-card-head">
              <h3>Complaints by Category</h3>
            </div>
            <div className="wdds-chart-body">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryBreakdown} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
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
<br></br>
        <div className="wdds-card wdds-table" aria-label="Emergency – Recently Updated">
          <div className="wdds-card-head">
            <h3>Emergency – Recently Updated</h3>
            <span className="wdds-muted">Latest first • High priority only</span>
          </div>
          <div className="wdds-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {emergencies.length > 0 ? (
                  emergencies.map((row) => (
                    <tr
                      key={row.complaint_id}
                      className="row-link"
                      onClick={() =>
                        go(`/warden/complaints?focus=${encodeURIComponent(row.complaint_id)}`)
                      }
                    >
                      <td className="mono">{String(row.complaint_id).slice(0, 12)}…</td>
                      <td>{row.title_preview || row.title || "—"}</td>
                      <td>
                        <span className="chip">{row.category || "—"}</span>
                      </td>
                      <td>
                        <span
                          className={`pill ${String(row.status || "")
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`}
                        >
                          {row.status || "—"}
                        </span>
                      </td>
                      <td className="muted">{fmtDate(row.updated_on)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      No emergency cases 🎉
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WardenLayout>
  );
}
