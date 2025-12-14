import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart, Bar,
  CartesianGrid,
  XAxis, YAxis,
  Tooltip, Legend,
  AreaChart, Area,
  ScatterChart, Scatter, ZAxis,
  Treemap,
  FunnelChart, Funnel, LabelList,
  ComposedChart, LineChart, Line, PieChart, Pie, Cell, ReferenceLine
} from "recharts";
import "../assets/styles/facultyanalytics.css";
import FacultyLayout from "../layouts/FacultyLayout";
import api from "../../utils/api";

export default function FacultyAnalytics() {
  const [data, setData] = useState(null);
  const [expOpen, setExpOpen] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api.get("/faculty/analytics")
      .then((res) => { if (alive) setData(res.data?.data || null); })
      .catch(() => setData(null));
    return () => { alive = false; };
  }, []);

  if (!data) {
    return (
      <FacultyLayout>
        <div className="fad-page"><h2>Loading Analytics...</h2></div>
      </FacultyLayout>
    );
  }

  const COLORS = ["#2563eb","#10b981","#f59e0b","#ef4444","#6366f1","#06b6d4","#84cc16","#9333ea","#f472b6"];

  const totals = {
    complaints: data.total_complaints,
    resolved: data.resolved,
    active: data.active,
    rejected: data.rejected,
  };

  const lifecycleFlow = Array.isArray(data.lifecycle_flow) ? data.lifecycle_flow : [];
  const severityTrend  = Array.isArray(data.severity_trend) ? data.severity_trend : [];
  const catTime        = Array.isArray(data.category_time) ? data.category_time : [];
  const hostelDist     = Array.isArray(data.hostel_block_category) ? data.hostel_block_category : [];
  const wardenLoad     = Array.isArray(data.warden_workload) ? data.warden_workload : [];
  const bubbleData     = Array.isArray(data.category_severity_bubble) ? data.category_severity_bubble : [];
  const genderData     = Array.isArray(data.gender) ? data.gender : [];
  const hostelTypeData = Array.isArray(data.hostel_type) ? data.hostel_type : [];
  const courseData     = Array.isArray(data.course) ? data.course : [];
  const categoryTotals = Array.isArray(data.category) ? data.category : [];
  const blockTotals    = Array.isArray(data.block) ? data.block : [];

  const hours = useMemo(() => {
    const s = new Set(catTime.map(r => String(r.hour).padStart(2,"0")));
    return Array.from(s).sort();
  }, [catTime]);

  const categories = useMemo(() => {
    const s = new Set(catTime.map(r => r.category));
    return Array.from(s);
  }, [catTime]);

  const heatmapMatrix = useMemo(() => {
    const map = new Map();
    catTime.forEach(r => {
      const h = String(r.hour).padStart(2,"0");
      map.set(`${r.category}||${h}`, (map.get(`${r.category}||${h}`) || 0) + Number(r.count||0));
    });
    return categories.flatMap(cat =>
      hours.map(h => ({
        cat,
        hour: h,
        value: map.get(`${cat}||${h}`) || 0
      }))
    );
  }, [catTime, categories, hours]);

  const funnelSeries = useMemo(() => {
    const byStage = Object.fromEntries(lifecycleFlow.map(r => [r.stage, Number(r.count||0)]));
    const submitted   = byStage.submitted   || 0;
    const in_review   = byStage.in_review   || 0;
    const in_progress = byStage.in_progress || 0;
    const resolved    = byStage.resolved    || 0;
    return [
      { name: "Submitted",  value: submitted },
      { name: "In Review",  value: in_review },
      { name: "In Progress",value: in_progress },
      { name: "Resolved",   value: resolved },
    ];
  }, [lifecycleFlow]);

  const courseTop = useMemo(() => {
    const arr = [...courseData].map(d => ({...d, count: Number(d.count||0)}));
    arr.sort((a,b)=>b.count-a.count);
    return arr.slice(0,10);
  }, [courseData]);

  const download = (filename, content, mime) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  const exportJSON = () => {
    download("faculty_analytics.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8");
    setExpOpen(false);
  };

  return (
    <FacultyLayout>
      <div className="fad-page" ref={pageRef}>
        <header className="fad-header">
          <div>
            <h1 className="fad-title">Analytics & Insights</h1>
            <p className="fad-sub">Comprehensive visualization of complaints, distribution, and operations.</p>
          </div>
          <button className="fad-export" onClick={()=>setExpOpen(v=>!v)}>Export</button>
          {expOpen && (
            <div className="fad-export-menu">
              <div onClick={exportJSON}>Export Full Data (JSON)</div>
            </div>
          )}
        </header>

        <section className="fad-grid-4">
          <div className="fad-card"><h3>Total Complaints</h3><div className="fad-kpi">{totals.complaints}</div></div>
          <div className="fad-card"><h3>Resolved</h3><div className="fad-kpi">{totals.resolved}</div></div>
          <div className="fad-card"><h3>Active</h3><div className="fad-kpi">{totals.active}</div></div>
          <div className="fad-card"><h3>Rejected</h3><div className="fad-kpi">{totals.rejected}</div></div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Complaint Lifecycle Flow</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lifecycleFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" /><YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Lifecycle Funnel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={funnelSeries} isAnimationActive>
                  <LabelList position="right" fill="#0f172a" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-1">
          <div className="fad-card">
            <h3>Severity Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={severityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                <Area dataKey="emergency" stackId="sev" stroke="#ef4444" fill="#fecaca" />
                <Area dataKey="high"      stackId="sev" stroke="#f59e0b" fill="#fde68a" />
                <Area dataKey="medium"    stackId="sev" stroke="#10b981" fill="#a7f3d0" />
                <Area dataKey="low"       stackId="sev" stroke="#6366f1" fill="#c7d2fe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-1">
          <div className="fad-card">
            <h3>Category × Time of Day Pattern</h3>
            <div className="fad-heatmap">
              <div className="hm-leftcol">
                <div className="hm-corner" />
                {categories.map(c => <div key={c} className="hm-cat">{c}</div>)}
              </div>
              <div className="hm-grid">
                <div className="hm-hours">
                  {hours.map(h => <div key={h} className="hm-hour">{h}</div>)}
                </div>
                {categories.map(c => (
                  <div key={c} className="hm-row">
                    {hours.map(h => {
                      const cell = heatmapMatrix.find(x => x.cat===c && x.hour===h);
                      const v = cell?.value || 0;
                      const alpha = Math.min(1, v/Math.max(1, Math.max(...heatmapMatrix.map(x=>x.value)) || 1));
                      return <div key={h} className="hm-cell" title={`${c} @ ${h}:00 → ${v}`} style={{ background:`rgba(37,99,235,${0.12 + 0.88*alpha})` }}/>;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Warden Workload</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={wardenLoad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="warden" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="total_complaints" fill="#2563eb" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Category × Severity Bubble Map</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="category" />
                <YAxis type="category" dataKey="severity" />
                <ZAxis dataKey="count" range={[60, 400]} />
                <Tooltip />
                <Scatter data={bubbleData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Gender-wise Complaints</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={genderData} dataKey="count" nameKey="gender" outerRadius={100} label>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Hostel Type Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hostelTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hostel_type" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="count" fill="#2563eb" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Course / Department (Top 10)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseTop} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="course" width={140} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6,6,6,6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Category Totals</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="count" fill="#6366f1" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-1">
          <div className="fad-card">
            <h3>Complaints by Block</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={blockTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="assigned_block" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="count" fill="#06b6d4" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </FacultyLayout>
  );
}
