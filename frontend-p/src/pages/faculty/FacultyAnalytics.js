import React, { useMemo, useState, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  Brush,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import "../assets/styles/facultyanalytics.css";
import FacultyLayout from "../layouts/FacultyLayout";

export default function FacultyAnalytics() {
  const [range, setRange] = useState("Last 6 Months");
  const [expOpen, setExpOpen] = useState(false);
  const pageRef = useRef(null);

  const monthlyTrend = [
    { month: "Apr", total: 18, resolved: 10, reopened: 1, emergency: 2, high: 4, med: 8, low: 4, avgHrsToResolve: 42, firstRespHrs: 6 },
    { month: "May", total: 25, resolved: 18, reopened: 2, emergency: 3, high: 6, med: 10, low: 6, avgHrsToResolve: 36, firstRespHrs: 5 },
    { month: "Jun", total: 32, resolved: 22, reopened: 3, emergency: 4, high: 8, med: 12, low: 8, avgHrsToResolve: 28, firstRespHrs: 4 },
    { month: "Jul", total: 30, resolved: 28, reopened: 1, emergency: 1, high: 7, med: 12, low: 10, avgHrsToResolve: 22, firstRespHrs: 3 },
    { month: "Aug", total: 44, resolved: 38, reopened: 4, emergency: 5, high: 12, med: 18, low: 9, avgHrsToResolve: 26, firstRespHrs: 3 },
    { month: "Sep", total: 40, resolved: 34, reopened: 3, emergency: 4, high: 10, med: 18, low: 8, avgHrsToResolve: 24, firstRespHrs: 2 },
    { month: "Oct", total: 36, resolved: 30, reopened: 2, emergency: 3, high: 9, med: 16, low: 8, avgHrsToResolve: 23, firstRespHrs: 2 },
  ];

  const categoryData = [
    { name: "Safety", value: 40 },
    { name: "Maintenance", value: 28 },
    { name: "Food", value: 18 },
    { name: "Harassment", value: 10 },
    { name: "Other", value: 8 },
  ];

  const reasonByRole = [
    { reason: "Maintenance Delay", student: 18, faculty: 11 },
    { reason: "Food Quality", student: 14, faculty: 2 },
    { reason: "Safety Concern", student: 8, faculty: 4 },
    { reason: "Harassment", student: 5, faculty: 7 },
    { reason: "Facility Issue", student: 10, faculty: 12 },
  ];

  const topFaculty = [
    { name: "Dr. Kavitha", reports: 22 },
    { name: "Prof. Arun", reports: 18 },
    { name: "Dr. Rekha", reports: 16 },
    { name: "Prof. Nirmal", reports: 12 },
    { name: "Dr. Hemanth", reports: 9 },
  ];

  const topStudents = [
    { name: "Aarav Menon (22BIT0346)", reports: 6 },
    { name: "Sneha R (22CSE1456)", reports: 5 },
    { name: "Nisha Varma (22CSE1203)", reports: 4 },
    { name: "Pranav S (22EEE2211)", reports: 4 },
    { name: "Isha Kapoor (22IT0687)", reports: 3 },
  ];

  const lateComers = [
    { student: "Sneha R", count: 4, reason: "Event Practice" },
    { student: "Rahul K", count: 3, reason: "Lab Overrun" },
    { student: "Nisha V", count: 2, reason: "Library Delay" },
    { student: "Arun M", count: 2, reason: "Bus Delay" },
  ];

  const departmentPerformance = [
    { dept: "IT", score: 92, sla: 96 },
    { dept: "CSE", score: 88, sla: 93 },
    { dept: "EEE", score: 81, sla: 90 },
    { dept: "ECE", score: 79, sla: 89 },
    { dept: "MECH", score: 70, sla: 84 },
    { dept: "civil", score: 90, sla: 94 },
        { dept: "chemical", score: 80, sla: 84 },
                { dept: "bio", score: 67, sla: 74 },



  ];

  const hourlyActivity = [
    { hour: "06", reports: 2 },
    { hour: "08", reports: 6 },
    { hour: "10", reports: 10 },
    { hour: "12", reports: 8 },
    { hour: "14", reports: 6 },
    { hour: "16", reports: 7 },
    { hour: "18", reports: 12 },
    { hour: "20", reports: 9 },
    { hour: "22", reports: 11 },
  ];

  const weekdayActivity = [
    { day: "Mon", count: 26 },
    { day: "Tue", count: 22 },
    { day: "Wed", count: 24 },
    { day: "Thu", count: 28 },
    { day: "Fri", count: 35 },
    { day: "Sat", count: 30 },
    { day: "Sun", count: 20 },
  ];

  const backlogTrend = useMemo(() => {
    let running = 0;
    return monthlyTrend.map((m) => {
      running = Math.max(0, running + m.total - m.resolved);
      return { month: m.month, backlog: running };
    });
  }, [monthlyTrend]);

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#06b6d4", "#84cc16"];

  const kpi = useMemo(() => {
    const total = monthlyTrend.reduce((a, b) => a + b.total, 0);
    const resolved = monthlyTrend.reduce((a, b) => a + b.resolved, 0);
    const high = monthlyTrend.reduce((a, b) => a + b.high, 0);
    const emergency = monthlyTrend.reduce((a, b) => a + b.emergency, 0);
    const sla = Math.round((resolved / total) * 100);
    const backlog = backlogTrend[backlogTrend.length - 1]?.backlog || 0;
    const reopenRate = Math.round((monthlyTrend.reduce((a, b) => a + b.reopened, 0) / Math.max(1, resolved)) * 100);
    const avgResolve = Math.round(monthlyTrend.reduce((a, b) => a + b.avgHrsToResolve, 0) / monthlyTrend.length);
    const avgFirstResp = Math.round(monthlyTrend.reduce((a, b) => a + b.firstRespHrs, 0) / monthlyTrend.length);
    const actFaculty = topFaculty.length;
    const actStudents = topStudents.length;
    return { total, resolved, high, emergency, sla, backlog, reopenRate, avgResolve, avgFirstResp, actFaculty, actStudents };
  }, [monthlyTrend, backlogTrend, topFaculty.length, topStudents.length]);

  const lifecycleFunnel = useMemo(() => {
    const reported = kpi.total;
    const triaged = Math.round(reported * 0.92);
    const assigned = Math.round(reported * 0.86);
    const resolved = kpi.resolved;
    const verified = Math.round(resolved * 0.95);
    return [
      { name: "Reported", value: reported },
      { name: "Triaged", value: triaged },
      { name: "Assigned", value: assigned },
      { name: "Resolved", value: resolved },
      { name: "Verified", value: verified },
    ];
  }, [kpi]);

  const responseVsSeverity = [
    { severity: "Emergency", firstResp: 1.5, avgResolve: 16, count: 18 },
    { severity: "High", firstResp: 3, avgResolve: 28, count: 56 },
    { severity: "Medium", firstResp: 5, avgResolve: 34, count: 94 },
    { severity: "Low", firstResp: 7, avgResolve: 40, count: 53 },
  ];

  const slaByDeptRadial = departmentPerformance.map((d, i) => ({ name: d.dept, sla: d.sla, fill: COLORS[i % COLORS.length] }));

  const sentimentSeries = monthlyTrend.map((m, i) => ({
    month: m.month,
    neg: Math.max(0, Math.round(m.total * 0.15 + (i - 3))),
    neu: Math.max(0, Math.round(m.total * 0.55 + (3 - i))),
    pos: Math.max(0, Math.round(m.total * 0.30 + (i % 2 ? 2 : -2))),
  }));

  const stackedSeverity = monthlyTrend.map((m) => ({
    month: m.month,
    emergency: m.emergency,
    high: m.high,
    med: m.med,
    low: m.low,
  }));

  const heatmapMatrix = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = ["06","08","10","12","14","16","18","20","22"];
    const base = {};
    days.forEach((d, di) => hours.forEach((h, hi) => {
      base[`${d}-${h}`] = Math.max(0, Math.round((10 + di * 4 + hi * 3) * (1 + (d==="Fri"?0.3:0) + (h==="18"?0.4:0))));
    }));
    return days.map((d) => hours.map((h) => ({ day: d, hour: h, value: base[`${d}-${h}`] }))).flat();
  }, []);

  const treemapData = {
    name: "Categories",
    children: [
      { name: "Safety", size: 40 },
      { name: "Maintenance", size: 28 },
      { name: "Food", size: 18 },
      { name: "Harassment", size: 10 },
      { name: "Other", size: 8 },
    ],
  };

  const miniSpark = monthlyTrend.map((m) => ({ month: m.month, v: m.resolved - m.reopened }));

  const blockGender = [
    { block: "A", male: 14, female: 9, other: 1 },
    { block: "B", male: 22, female: 7, other: 0 },
    { block: "C", male: 10, female: 19, other: 1 },
    { block: "D", male: 8,  female: 6, other: 0 },
  ];

  const blockTotals = useMemo(
    () => blockGender.map(b => ({ ...b, total: b.male + b.female + b.other })),
    [blockGender]
  );

  const blockTotalsSorted = useMemo(() => {
    const arr = [...blockTotals];
    arr.sort((a,b)=>b.total - a.total);
    return arr;
  }, [blockTotals]);

  const genderShare = useMemo(() => {
    const sums = blockGender.reduce((acc,b)=>({
      male: acc.male + b.male,
      female: acc.female + b.female,
      other: acc.other + b.other
    }), {male:0,female:0,other:0});
    return [
      { name: "Male", value: sums.male },
      { name: "Female", value: sums.female },
      { name: "Other", value: sums.other },
    ];
  }, [blockGender]);

  const reopenTrend = useMemo(
    () => monthlyTrend.map(m => ({ month: m.month, rate: Math.round((m.reopened/Math.max(1,m.resolved))*100) })),
    [monthlyTrend]
  );

  const download = (filename, content, mime) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const toCSV = (rows) => {
    if (!rows?.length) return "";
    const headers = Object.keys(rows[0]);
    const esc = (v) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = headers.join(",");
    const body = rows.map(r => headers.map(h => esc(r[h])).join(",")).join("\n");
    return head + "\n" + body;
  };

  const exportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      range,
      kpi,
      datasets: {
        monthlyTrend,
        categoryData,
        reasonByRole,
        topFaculty,
        topStudents,
        lateComers,
        departmentPerformance,
        hourlyActivity,
        weekdayActivity,
        backlogTrend,
        stackedSeverity,
        heatmapMatrix,
        treemapData,
        miniSpark,
        blockGender,
        blockTotals,
        blockTotalsSorted,
        genderShare,
        reopenTrend,
      },
    };
    download("faculty_analytics.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    setExpOpen(false);
  };

  const exportCSVs = () => {
    const packs = [
      ["monthly_trend.csv", monthlyTrend],
      ["reason_by_role.csv", reasonByRole],
      ["dept_performance.csv", departmentPerformance],
      ["weekday_activity.csv", weekdayActivity],
      ["hourly_activity.csv", hourlyActivity],
      ["block_gender.csv", blockGender],
      ["reopen_trend.csv", reopenTrend],
    ];
    packs.forEach(([name, data], i) => {
      setTimeout(() => download(name, toCSV(data), "text/csv;charset=utf-8"), i * 120);
    });
    setExpOpen(false);
  };

  const exportKPIsCSV = () => {
    const rows = [kpi];
    download("kpi_summary.csv", toCSV(rows), "text/csv;charset=utf-8");
    setExpOpen(false);
  };

  return (
    <FacultyLayout>
      <div className="fad-page" ref={pageRef}>
        <header className="fad-header">
          <div>
            <h1 className="fad-title">Analytics & Insights</h1>
            <p className="fad-sub">Comprehensive visualization of complaints, behavior, and performance insights.</p>
          </div>
          <div className="fad-actions" style={{ position: "relative" }}>
            <div className="fad-tabs" role="group" aria-label="Range">
              <div className="fad-tab" data-active={range==="Last 3 Months"} onClick={()=>setRange("Last 3 Months")}>3M</div>
              <div className="fad-tab" data-active={range==="Last 6 Months"} onClick={()=>setRange("Last 6 Months")}>6M</div>
              <div className="fad-tab" data-active={range==="Last 12 Months"} onClick={()=>setRange("Last 12 Months")}>12M</div>
              <div className="fad-tab" data-active={range==="FY 2025"} onClick={()=>setRange("FY 2025")}>FY25</div>
            </div>
            <button className="fad-export" onClick={()=>setExpOpen(v=>!v)}>Export</button>
            {expOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  boxShadow: "0 12px 28px rgba(2,6,23,.12)",
                  minWidth: 220,
                  padding: 6,
                  zIndex: 30,
                }}
              >
                <div
                  role="button"
                  onClick={exportJSON}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                  onMouseDown={(e)=>e.preventDefault()}
                >
                  Export full data (JSON)
                </div>
                <div
                  role="button"
                  onClick={exportCSVs}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                  onMouseDown={(e)=>e.preventDefault()}
                >
                  Export datasets (CSV files)
                </div>
                <div
                  role="button"
                  onClick={exportKPIsCSV}
                  style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}
                  onMouseDown={(e)=>e.preventDefault()}
                >
                  Export KPI summary (CSV)
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="fad-kpis fad-kpis-wide">
          <div className="fad-kpi fad-kpi-blue"><div>Total Complaints</div><div>{kpi.total}</div></div>
          <div className="fad-kpi fad-kpi-green"><div>Resolved</div><div>{kpi.resolved}</div></div>
          <div className="fad-kpi fad-kpi-amber"><div>SLA %</div><div>{kpi.sla}%</div></div>
          <div className="fad-kpi fad-kpi-indigo"><div>Reopen Rate</div><div>{kpi.reopenRate}%</div></div>
          <div className="fad-kpi fad-kpi-purple"><div>Avg Resolve</div><div>{kpi.avgResolve}h</div></div>
          <div className="fad-kpi fad-kpi-sky"><div>Avg 1st Resp</div><div>{kpi.avgFirstResp}h</div></div>
          <div className="fad-kpi fad-kpi-gray"><div>Active Faculty</div><div>{kpi.actFaculty}</div></div>
          <div className="fad-kpi fad-kpi-red"><div>Backlog</div><div>{kpi.backlog}</div></div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area dataKey="total" fill="#93c5fd" stroke="#2563eb" strokeWidth={2} />
                <Line dataKey="resolved" stroke="#22c55e" strokeWidth={3} />
                <Line dataKey="avgHrsToResolve" yAxisId={1} stroke="#f59e0b" strokeDasharray="4 4" />
                <YAxis yAxisId={1} orientation="right" />
                <Brush dataKey="month" height={16} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Lifecycle Funnel</h3>
            <ResponsiveContainer width="100%" height={320}>
              <FunnelChart>
                <Tooltip />
                <Funnel dataKey="value" data={lifecycleFunnel} isAnimationActive>
                  <LabelList position="right" fill="#111827" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-3">
          <div className="fad-card">
            <h3>Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" outerRadius={90} label>
                  {categoryData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Dept SLA Gauge</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadialBarChart innerRadius="40%" outerRadius="90%" data={slaByDeptRadial} startAngle={180} endAngle={0}>
                <RadialBar minAngle={15} background dataKey="sla" />
<Legend
  verticalAlign="bottom"
  layout="horizontal"
  align="center"
  iconType="circle"
  wrapperStyle={{ paddingTop: 10 }}
/>                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Sentiment Mix</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={sentimentSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="neg" stackId="s" fill="#ef4444" radius={[6,6,0,0]} />
                <Bar dataKey="neu" stackId="s" fill="#a3a3a3" radius={[6,6,0,0]} />
                <Bar dataKey="pos" stackId="s" fill="#10b981" radius={[6,6,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Reason by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={reasonByRole}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="reason" />
                <YAxis /><Tooltip /><Legend />
                <Bar dataKey="student" fill="#60a5fa" radius={[6,6,0,0]} />
                <Bar dataKey="faculty" fill="#f87171" radius={[6,6,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Department Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={departmentPerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dept" />
                <PolarRadiusAxis />
                <Radar dataKey="score" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Severity Stacked</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stackedSeverity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" /><YAxis /><Tooltip /><Legend />
                <Area dataKey="low" stackId="sev" stroke="#6366f1" fill="#c7d2fe" />
                <Area dataKey="med" stackId="sev" stroke="#10b981" fill="#a7f3d0" />
                <Area dataKey="high" stackId="sev" stroke="#f59e0b" fill="#fde68a" />
                <Area dataKey="emergency" stackId="sev" stroke="#ef4444" fill="#fecaca" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Response vs Severity</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="firstResp" name="First Response (h)" />
                <YAxis dataKey="avgResolve" name="Avg Resolve (h)" />
                <ZAxis dataKey="count" range={[60, 400]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <ReferenceLine x={4} stroke="#94a3b8" />
                <ReferenceLine y={30} stroke="#94a3b8" />
                <Scatter data={responseVsSeverity} fill="#2563eb" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Frequent Late Comers</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lateComers} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="student" type="category" width={130} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Activity by Hour</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis /><Tooltip />
                <Area dataKey="reports" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Activity by Weekday</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekdayActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis /><Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Backlog Over Time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={backlogTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis /><Tooltip />
                <Area dataKey="backlog" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-2">
          <div className="fad-card">
            <h3>Category Treemap</h3>
            <ResponsiveContainer width="100%" height={280}>
              <Treemap data={treemapData.children} dataKey="size" stroke="#fff" fill="#60a5fa" />
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Mini Throughput Sparkline</h3>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={miniSpark}>
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Line dataKey="v" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="fad-grid-1">
          <div className="fad-card">
            <h3>Heatmap: Day × Hour Volume</h3>
            <div className="fad-heatmap">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d} className="row">
                  <div className="row-label">{d}</div>
                  {["06","08","10","12","14","16","18","20","22"].map((h) => {
                    const cell = heatmapMatrix.find((c) => c.day===d && c.hour===h) || { value: 0 };
                    const v = cell.value;
                    const alpha = Math.min(1, v / 80);
                    return <div key={h} className="cell" title={`${d} ${h}: ${v}`} style={{ background: `rgba(37,99,235,${0.15 + alpha*0.85})` }} />;
                  })}
                </div>
              ))}
              <div className="row hours">
                <div className="row-label" />
                {["06","08","10","12","14","16","18","20","22"].map((h) => <div key={h} className="hour-label">{h}</div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="fad-grid-3">
          <div className="fad-card">
            <h3>Complaints by Block (Gender Split)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={blockTotals}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="block" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="male" stackId="g" fill="#60a5fa" radius={[6,6,0,0]} />
                <Bar dataKey="female" stackId="g" fill="#f472b6" radius={[6,6,0,0]} />
                <Bar dataKey="other" stackId="g" fill="#a3a3a3" radius={[6,6,0,0]} />
                <Line dataKey="total" stroke="#2563eb" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Blocks by Total Complaints</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={blockTotalsSorted} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="block" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" radius={[6,6,6,6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="fad-card">
            <h3>Reopen Rate Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={reopenTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 'auto']} />
                <Tooltip />
                <Legend />
                <ReferenceLine y={10} stroke="#94a3b8" strokeDasharray="4 4" />
                <Line dataKey="rate" name="Reopen %" stroke="#ef4444" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </FacultyLayout>
  );
}
