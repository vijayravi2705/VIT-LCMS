import React, { useEffect, useMemo, useState } from "react";
import "../assets/styles/wardenhistory.css";
import WardenLayout from "../layouts/WardenLayout";

/** ---------------- Local log helpers ---------------- */
const LOG_KEY = "fcLogs";
const readLogs = (id) => {
  try {
    const all = JSON.parse(localStorage.getItem(LOG_KEY) || "{}");
    return all[id] || [];
  } catch {
    return [];
  }
};
const seedLogsIfMissing = (id, entries) => {
  try {
    const all = JSON.parse(localStorage.getItem(LOG_KEY) || "{}");
    if (!Array.isArray(all[id]) || all[id].length === 0) {
      all[id] = entries;
      localStorage.setItem(LOG_KEY, JSON.stringify(all));
    }
  } catch {
    // no-op
  }
};

/** ---------------- Sample case + logs (kept from your example) ---------------- */
const facultyFiledCase = {
  id: "CMP-LH-B-212-20251014-0935-01",
  title: "Harassment in corridor near LH B-212",
  cat: "Safety",
  priority: "High",
  status: "In Review",
  updated: "14 Oct, 10:20",

  reporterType: "faculty",
  facultyId: "VIT12345",
  facultyName: "Dr. Jane Doe",
  facultyDept: "EEE",
  facultyDesignation: "Assistant Professor",
  facultyContact: "+91 9XXXXXX987",

  reporter: "Sneha R",
  regno: "22CSE1456",
  reporterDept: "CSE",
  reporterContact: "+91 9XXXXXX312",

  hostelType: "LH",
  hostelBlock: "B",
  roomNumber: "212",
  location: "LH B-212 corridor",
  submittedAt: "14 Oct, 09:35",
  subcategory: "harassment",
  incidentDateTime: "2025-10-14 09:20",
  titleSubmitted: "Harassment in corridor near LH B-212",
  summary:
    "Student reported verbal harassment by two seniors outside corridor near B-212 during morning hours.",
  details:
    "Incident occurred around 09:20 while Sneha was heading to class. Two seniors allegedly passed threatening remarks. Nearby CCTV (LH-B-2F) may have partial coverage. Student is anxious; requested anonymity. I (faculty) escorted her to counselor after initial statement.",

  attachments: [
    { name: "student-statement.pdf" },
    { name: "corridor-cctv-ref.txt" },
    { name: "counselor-intake-note.png" },
  ],
  tags: ["harassment", "safety", "female-student"],

  victims: [
    {
      name: "Sneha R",
      reg: "22CSE1456",
      contact: "+91 9XXXXXX312",
      description: "Target of verbal harassment by two seniors.",
    },
  ],
  witnesses: [
    { name: "Block B floor warden", reg: "", contact: "" },
    { name: "Priya K", reg: "22ECE0912", contact: "" },
  ],
  accused: [{ name: "Unknown (two seniors)", role: "student", id: "", contact: "" }],

  assignedTo: "Dean Office",
  adminNotes: "",
};

const logsForFacultyFiledCase = [
  {
    ts: "2025-10-14T09:35:12.000Z",
    when: "14 Oct, 09:35",
    who: "Dr. Jane Doe",
    action: "Submitted",
    note: "Filed on behalf of student Sneha R (22CSE1456) after intake.",
    meta: { reporterType: "faculty", behalfOf: "22CSE1456" },
  },
  {
    ts: "2025-10-14T09:42:05.000Z",
    when: "14 Oct, 09:42",
    who: "Dr. Jane Doe",
    action: "Added tag",
    note: "+ harassment",
    meta: { tag: "harassment" },
  },
  {
    ts: "2025-10-14T09:45:21.000Z",
    when: "14 Oct, 09:45",
    who: "Dr. Jane Doe",
    action: "Escalated",
    note: "Status set to “In Review”. Initial routing to Dean Office.",
    meta: { to: "Dean Office" },
  },
  {
    ts: "2025-10-14T10:05:11.000Z",
    when: "14 Oct, 10:05",
    who: "Dean Office",
    action: "Edited case",
    note: "Priority: “Medium” → “High”; Assigned To: “—” → “Dean Office”",
    meta: { priorityFrom: "Medium", priorityTo: "High" },
  },
  {
    ts: "2025-10-14T10:12:44.000Z",
    when: "14 Oct, 10:12",
    who: "Security Team",
    action: "Edited case",
    note: "Added attachment: corridor-cctv-ref.txt (pull requested from LH-B-2F).",
  },
  {
    ts: "2025-10-14T10:20:03.000Z",
    when: "14 Oct, 10:20",
    who: "Counseling",
    action: "Edited case",
    note: "Added attachment: counselor-intake-note.png; victim informed of support options.",
  },
];

/** ---------------- Demo list (kept) ---------------- */
const demoComplaints = [
  {
    id: "CMP-MH-B-217-20251012-1905-02",
    title: "Assault reported",
    cat: "Safety",
    priority: "Emergency",
    status: "Submitted",
    updated: "12 Oct, 19:07",
    reporterType: "faculty",
    facultyId: "VIT12345",
    facultyName: "Dr. Jane Doe",
    facultyDept: "EEE",
    facultyDesignation: "Assistant Professor",
    facultyContact: "+91 9XXXXXX987",
    reporter: "Pranav S",
    regno: "22EEE2211",
    location: "MH B-217",
    submittedAt: "12 Oct, 19:05",
    subcategory: "violence",
    incidentDateTime: "2025-10-12 19:00",
    titleSubmitted: "Assault reported",
    summary: "Physical altercation between students.",
    details: "Resident tutor called. Need medical check and statements.",
    attachments: [{ name: "med-report.png" }, { name: "rt-note.txt" }],
    tags: [],
    victims: [{ name: "Pranav S", reg: "22EEE2211" }],
    witnesses: [{ name: "RT on duty", reg: "", contact: "" }],
    accused: [{ name: "Unknown", role: "student", id: "", contact: "" }],
    assignedTo: "Warden Office",
    adminNotes: "",
  },
  facultyFiledCase,
  {
    id: "CMP-MH-A-101-20251010-2250-01",
    title: "Ragging incident",
    cat: "Safety",
    priority: "Emergency",
    status: "In Review",
    updated: "10 Oct, 22:58",
    reporterType: "student",
    reporter: "Aarav Menon",
    regno: "22BIT0346",
    reporterDept: "EEE",
    reporterContact: "+91 98XXXXXX12",
    hostelType: "MH",
    hostelBlock: "A",
    roomNumber: "101",
    submittedAt: "10 Oct, 22:50",
    location: "MH A-101",
    subcategory: "ragging",
    incidentDateTime: "2025-10-10 22:40",
    titleSubmitted: "Ragging incident",
    summary: "Verbal abuse reported near hostel A-101.",
    details: "Student alleged verbal abuse by seniors.",
    attachments: [{ name: "corridor-cam.mp4" }],
    tags: ["ragging", "safety"],
    victims: [{ name: "Aarav Menon", reg: "22BIT0346" }],
    witnesses: [{ name: "Block A guard" }],
    accused: [{ name: "Unknown", role: "student" }],
    assignedTo: "Dean Office",
    adminNotes: "",
  },
];

/**
 * WardenHistory (wdh-*)
 * - Lists complaints relevant to wardens (we’ll reuse demo set)
 * - Search + status filter
 * - Read-only modal with tabs; logs from localStorage
 */
export default function WardenHistoryWDH({
  allComplaints = demoComplaints,
  profile = { wardenId: "WARDEN01", name: "Hostel Warden" },
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("overview"); // overview | incident | people | files | log

  useEffect(() => {
    seedLogsIfMissing(facultyFiledCase.id, logsForFacultyFiledCase);
  }, []);

  // For demo we're not limiting to a specific warden; in real code filter by block/assignment
  const items = useMemo(() => allComplaints || [], [allComplaints]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (filter !== "All") list = list.filter((h) => h.status === filter);

    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (x) =>
          x.id.toLowerCase().includes(t) ||
          x.title.toLowerCase().includes(t) ||
          (x.location || "").toLowerCase().includes(t) ||
          (x.assignedTo || "").toLowerCase().includes(t) ||
          (x.regno || "").toLowerCase().includes(t) ||
          (x.reporter || "").toLowerCase().includes(t)
      );
    }
    return list;
  }, [items, filter, q]);

  const openPanel = (it) => {
    setSelected(it);
    setLogs(readLogs(it.id));
    setTab("overview");
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <WardenLayout>
      <div className="wdh-page">
        <header className="wdh-header">
          <div>
            <h1 className="wdh-title">Warden History</h1>
            <p className="wdh-sub">Review closed and active cases under your purview.</p>
          </div>
          <div className="wdh-actions">
            <input
              className="wdh-search"
              placeholder="Search by ID, title, location, assignee…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="wdh-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option>All</option>
              <option>Submitted</option>
              <option>Pending</option>
              <option>In Review</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
          </div>
        </header>

        <div className="wdh-grid">
          {filtered.map((item) => (
            <article
              key={item.id}
              className={`wdh-card pr-${String(item.priority || "")
                .toLowerCase()
                .replace(" ", "-")}`}
              onClick={() => openPanel(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openPanel(item)}
            >
              <div className="wdh-rail" />
              <div className="wdh-main">
                <h3 className="wdh-card-title">{item.title}</h3>
                <div className="wdh-id">{item.id}</div>
                <div className="wdh-meta">
                  <span>{item.location || "—"}</span>
                  <span>•</span>
                  <span>Updated: {item.updated || "—"}</span>
                </div>
              </div>
              <div className="wdh-tags" onClick={(e) => e.stopPropagation()}>
                <span className="wdh-chip">{item.cat || "—"}</span>
                <span className={`wdh-chip tone-${(item.priority || "low").toLowerCase()}`}>
                  {item.priority}
                </span>
                <span className="wdh-chip tone-status">{item.status}</span>
                {item.reporterType === "faculty" && item.regno && (
                  <span className="wdh-chip tone-status">Filed for {item.regno}</span>
                )}
              </div>
            </article>
          ))}

          {!filtered.length && <div className="wdh-empty">No cases found.</div>}
        </div>
      </div>

      {/* -------- Modal with tabs (read-only) -------- */}
      {open && selected && (
        <div className="wdh-modal show" onClick={() => setOpen(false)}>
          <div className="wdh-panel" onClick={(e) => e.stopPropagation()}>
            <div className="wdh-head">
              <div className="wdh-titleblock">
                <h2>{selected.title}</h2>
                <div className="wdh-subid">{selected.id}</div>
              </div>
              <button
                type="button"
                className="wdh-xbtn"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="wdh-tabs">
              {["overview", "incident", "people", "files", "log"].map((t) => (
                <button
                  key={t}
                  className={`wdh-tab ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {t === "overview" && "Overview"}
                  {t === "incident" && "Incident"}
                  {t === "people" && "People"}
                  {t === "files" && "Tags & Attachments"}
                  {t === "log" && `Case Log (${logs.length})`}
                  {tab === t && <i className="wdh-underline" />}
                </button>
              ))}
            </div>

            <div className="wdh-body">
              {tab === "overview" && (
                <section className="wdh-sec">
                  <div className="wdh-grid2">
                    <div>
                      <label>Status</label>
                      <div className="wdh-ro">{selected.status || "—"}</div>
                    </div>
                    <div>
                      <label>Priority</label>
                      <div className="wdh-ro">{selected.priority || "—"}</div>
                    </div>
                    <div>
                      <label>Category</label>
                      <div className="wdh-ro">{selected.cat || "—"}</div>
                    </div>
                    <div>
                      <label>Assigned To</label>
                      <div className="wdh-ro">{selected.assignedTo || "—"}</div>
                    </div>
                    <div className="span-2">
                      <label>Location</label>
                      <div className="wdh-ro">{selected.location || "—"}</div>
                    </div>
                    <div className="span-2">
                      <label>Updated</label>
                      <div className="wdh-ro">{selected.updated || "—"}</div>
                    </div>
                  </div>

                  <label className="wdh-lab">
                    Summary
                    <div className="wdh-roarea">{selected.summary || "—"}</div>
                  </label>
                  <label className="wdh-lab">
                    Detailed Description
                    <div className="wdh-roarea">{selected.details || "—"}</div>
                  </label>

                  {selected.reporterType === "faculty" && selected.reporter && (
                    <div className="wdh-note" style={{ marginTop: 10 }}>
                      Filed on behalf of: <b>{selected.reporter}</b>{" "}
                      ({selected.regno || "—"}), {selected.reporterDept || "—"} •{" "}
                      {selected.reporterContact || "—"}
                    </div>
                  )}
                </section>
              )}

              {tab === "incident" && (
                <section className="wdh-sec">
                  <div className="wdh-grid2">
                    <div>
                      <label>Subcategory</label>
                      <div className="wdh-ro">{selected.subcategory || "—"}</div>
                    </div>
                    <div>
                      <label>Date & Time</label>
                      <div className="wdh-ro">{selected.incidentDateTime || "—"}</div>
                    </div>
                    <div className="span-2">
                      <label>Title / Subject</label>
                      <div className="wdh-ro">
                        {selected.titleSubmitted || selected.title || "—"}
                      </div>
                    </div>
                    <div className="span-2">
                      <label>Submitted At</label>
                      <div className="wdh-ro">{selected.submittedAt || "—"}</div>
                    </div>
                  </div>
                  <div className="wdh-note">
                    Filed by <b>{selected.facultyName || "—"}</b> (
                    {selected.facultyId || "—"}) • {selected.facultyDept || "—"} •{" "}
                    {selected.facultyDesignation || "—"} •{" "}
                    {selected.facultyContact || "—"}
                  </div>
                </section>
              )}

              {tab === "people" && (
                <section className="wdh-sec">
                  <h4 className="wdh-sec-title">Victims</h4>
                  {selected.victims?.length ? (
                    <ul className="wdh-people">
                      {selected.victims.map((v, i) => (
                        <li key={`v-${i}`} className="wdh-person">
                          <div className="wdh-person-line">
                            <b>{v.name || "—"}</b>
                            {v.reg ? <span className="wdh-tag">{v.reg}</span> : null}
                            {v.contact ? <span className="wdh-tag">{v.contact}</span> : null}
                          </div>
                          {v.description ? (
                            <div className="wdh-person-note">{v.description}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="wdh-muted">No victims recorded.</div>
                  )}

                  <h4 className="wdh-sec-title" style={{ marginTop: 14 }}>
                    Accused (if identified)
                  </h4>
                  {selected.accused?.length ? (
                    <ul className="wdh-people">
                      {selected.accused.map((a, i) => (
                        <li key={`a-${i}`} className="wdh-person">
                          <div className="wdh-person-line">
                            <b>{a.name || "—"}</b>
                            {a.role ? <span className="wdh-tag">{String(a.role).toUpperCase()}</span> : null}
                            {a.id ? <span className="wdh-tag">{a.id}</span> : null}
                            {a.contact ? <span className="wdh-tag">{a.contact}</span> : null}
                          </div>
                          {a.description ? (
                            <div className="wdh-person-note">{a.description}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="wdh-muted">No accused identified in report.</div>
                  )}

                  <h4 className="wdh-sec-title" style={{ marginTop: 14 }}>
                    Witnesses
                  </h4>
                  {selected.witnesses?.length ? (
                    <ul className="wdh-people">
                      {selected.witnesses.map((w, i) => (
                        <li key={`w-${i}`} className="wdh-person">
                          <div className="wdh-person-line">
                            <b>{w.name || "—"}</b>
                            {(w.regNo || w.reg) ? <span className="wdh-tag">{w.regNo || w.reg}</span> : null}
                            {w.contact ? <span className="wdh-tag">{w.contact}</span> : null}
                          </div>
                          {w.description ? (
                            <div className="wdh-person-note">{w.description}</div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="wdh-muted">No witnesses recorded.</div>
                  )}
                </section>
              )}

              {tab === "files" && (
                <section className="wdh-sec">
                  <h4 className="wdh-sec-title">Tags</h4>
                  <div className="wdh-chips">
                    {(selected.tags || []).length ? (
                      (selected.tags || []).map((t) => (
                        <span key={t} className="wdh-chip-pill">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="wdh-muted">No tags</span>
                    )}
                  </div>

                  <h4 className="wdh-sec-title" style={{ marginTop: 14 }}>
                    Attachments
                  </h4>
                  {Array.isArray(selected.attachments) && selected.attachments.length ? (
                    <div className="wdh-files">
                      {selected.attachments.map((f, i) => (
                        <span key={i} className="wdh-file">
                          {typeof f === "string" ? f : f.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="wdh-chip tone-status">No attachments</span>
                  )}
                </section>
              )}

              {tab === "log" && (
                <section className="wdh-sec">
                  {!logs.length && <div className="wdh-muted">No activity yet.</div>}
                  <ul className="wdh-timeline">
                    {logs.map((lg, i) => (
                      <li
                        key={i}
                        className={`wdh-tl-item ${lg.action?.replace(/\s+/g, "-") || ""}`}
                      >
                        <div className="wdh-tl-dot" />
                        <div className="wdh-tl-card">
                          <div className="wdh-tl-top">
                            <span className="wdh-tl-action">{lg.action}</span>
                            <span className="wdh-tl-time">{lg.when}</span>
                          </div>
                          {lg.note && <div className="wdh-tl-note">{lg.note}</div>}
                          {lg.who && <div className="wdh-tl-meta">by {lg.who}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </WardenLayout>
  );
}
