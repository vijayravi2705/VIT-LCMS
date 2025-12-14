import React, { useMemo, useState, useEffect, useRef } from "react";
import "../assets/styles/studentstatus.css";

/**
 * Utility: normalize and validate an ID users paste/type.
 * Accepts things like: c101, C-101,  mh-a-000-20250103-2232-01  etc.
 */
const normalizeId = (raw) =>
  raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");

/** Dummy “API” data (you can swap with a real fetch later) */
const MOCK = {
  C101: {
    id: "C101",
    category: "Electricity",
    subcategory: "Wiring",
    place: "Hostel A",
    priority: "Medium",
    createdAt: "2025-09-01T10:30:00+05:30",
    lastUpdate: "2025-09-01T10:30:00+05:30",
    assignedTo: "Block A Electrician",
    step: 1,
    history: [
      { label: "Submitted", at: "2025-09-01T10:30:00+05:30", note: "Ticket created" },
    ],
  },
  C102: {
    id: "C102",
    category: "Water",
    subcategory: "Leakage",
    place: "Mess",
    priority: "High",
    createdAt: "2025-09-05T09:10:00+05:30",
    lastUpdate: "2025-09-05T13:45:00+05:30",
    assignedTo: "Facilities Team",
    step: 2,
    history: [
      { label: "Submitted", at: "2025-09-05T09:10:00+05:30" },
      { label: "In Review", at: "2025-09-05T13:45:00+05:30", note: "Sent to Warden" },
    ],
  },
  C103: {
    id: "C103",
    category: "Security",
    subcategory: "Theft",
    place: "Campus Gate",
    priority: "Emergency",
    createdAt: "2025-09-07T11:00:00+05:30",
    lastUpdate: "2025-09-08T09:00:00+05:30",
    assignedTo: "Security Office",
    step: 3,
    history: [
      { label: "Submitted", at: "2025-09-07T11:00:00+05:30" },
      { label: "In Review", at: "2025-09-07T14:15:00+05:30" },
      { label: "In Progress", at: "2025-09-08T09:00:00+05:30", note: "Investigation started" },
    ],
  },
  C104: {
    id: "C104",
    category: "Food",
    subcategory: "Quality",
    place: "Canteen",
    priority: "Low",
    createdAt: "2025-09-08T08:30:00+05:30",
    lastUpdate: "2025-09-10T17:45:00+05:30",
    assignedTo: "Mess Supervisor",
    step: 4,
    history: [
      { label: "Submitted", at: "2025-09-08T08:30:00+05:30" },
      { label: "In Review", at: "2025-09-08T12:00:00+05:30" },
      { label: "In Progress", at: "2025-09-09T15:20:00+05:30" },
      { label: "Resolved", at: "2025-09-10T17:45:00+05:30", note: "Quality audit done" },
    ],
  },
};

const STEPS = ["Submitted", "In Review", "In Progress", "Resolved"];

/** Formatters */
const fmtDate = (iso) =>
  new Date(iso).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const etaFromCreated = (iso, days = 3) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export default function StudentStatus() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);     // complaint object | "not-found" | null
  const [loading, setLoading] = useState(false);

  const progress = useMemo(() => {
    if (!result || result === "not-found") return 0;
    return Math.round((result.step / STEPS.length) * 100);
  }, [result]);

  /** Debounced “search” */
  const timer = useRef(null);
  const onCheck = (explicit = false) => {
    if (!explicit) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => runLookup(), 350);
    } else {
      runLookup();
    }
  };

  const runLookup = () => {
    const id = normalizeId(query);
    if (!id) {
      setResult(null);
      return;
    }
    setLoading(true);
    // simulate network
    setTimeout(() => {
      setResult(MOCK[id] ? { ...MOCK[id] } : "not-found");
      setLoading(false);
    }, 400);
  };

  /** Keyboard enter */
  useEffect(() => {
    const onEnter = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onCheck(true);
      }
    };
    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
  }, [query]);

  return (
    <div className="status-shell">
      <div className="status-card">
        <h2 className="status-title">
          <span className="spark" aria-hidden>📊</span> Status Check
        </h2>
        <p className="status-sub">Enter your Complaint ID to track the progress.</p>

        {/* Input row */}
        <div className="status-input">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onCheck(false);
            }}
            placeholder="e.g., C101"
            inputMode="text"
            autoCapitalize="characters"
          />
          {!!query && (
            <button className="ghost" onClick={() => { setQuery(""); setResult(null); }}>
              Clear
            </button>
          )}
          <button className="primary" onClick={() => onCheck(true)}>Check</button>
        </div>

        {/* Skeleton loader */}
        {loading && (
          <div className="skeleton">
            <div className="sk-line" />
            <div className="sk-line long" />
            <div className="sk-block" />
          </div>
        )}

        {/* Not found */}
        {result === "not-found" && !loading && (
          <div className="empty">
            <div className="empty-emoji">🤔</div>
            <h4>We couldn’t find that ID</h4>
            <p>
              Check the format and try again. Examples: <code>C101</code>,{" "}
              <code>C102</code>. If you raised a new complaint, it can take a
              minute to appear.
            </p>
          </div>
        )}

        {/* Result */}
        {result && result !== "not-found" && !loading && (
          <>
            {/* Timeline */}
            <div className="timeline">
              {STEPS.map((label, idx) => {
                const active = idx + 1 === result.step;
                const completed = idx + 1 < result.step;
                const hit = result.history.find((h) => h.label === label);
                return (
                  <div className="tl-step" key={label}>
                    <div className={`tl-dot ${active ? "active" : ""} ${completed ? "done" : ""}`}>
                      {completed ? "✓" : idx + 1}
                    </div>
                    <div className="tl-label">
                      <div className={`tl-name ${active ? "now" : ""}`}>{label}</div>
                      {hit && (
                        <div className="tl-time">{fmtDate(hit.at)}{hit.note ? ` — ${hit.note}` : ""}</div>
                      )}
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`tl-line ${completed ? "filled" : ""}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar + badges */}
            <div className="meta-bar">
              <div className="progress">
                <div className="fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="badges">
                <span className={`chip ${result.priority.toLowerCase()}`}>{result.priority}</span>
                <span className="chip soft">ETA {etaFromCreated(result.createdAt, 3)}</span>
                <span className="chip soft">Assigned · {result.assignedTo}</span>
              </div>
            </div>

            {/* Details card */}
            <div className="details">
              <h3>📌 Complaint Details</h3>
              <div className="grid">
                <div><strong>ID</strong><span>{result.id}</span></div>
                <div><strong>Category</strong><span>{result.category}</span></div>
                <div><strong>Subcategory</strong><span>{result.subcategory}</span></div>
                <div><strong>Place</strong><span>{result.place}</span></div>
                <div><strong>Created</strong><span>{fmtDate(result.createdAt)}</span></div>
                <div><strong>Last Update</strong><span>{fmtDate(result.lastUpdate)}</span></div>
              </div>

              <div className="actions">
               
                <button
                  className="ghost"
                  onClick={() => window.print()}
                  title="Print / Save as PDF"
                >
                  Download Receipt
                </button>
                
              </div>
            </div>

            {/* Friendly status text */}
            <div className="status-banner">
              {result.step === 1 && "✅ Your complaint has been submitted and is awaiting review."}
              {result.step === 2 && "🔎 Your complaint is currently under review by the warden/desk."}
              {result.step === 3 && "⚡ Work is in progress. The team has started addressing the issue."}
              {result.step === 4 && "🎉 Resolved! If anything still feels off, you can reopen within 48 hours."}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
