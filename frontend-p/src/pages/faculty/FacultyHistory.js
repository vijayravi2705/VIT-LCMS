// src/pages/faculty/FacultyHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../assets/styles/facultyhistory.css";
import FacultyLayout from "../layouts/FacultyLayout";
import api from "../../utils/api";

const API_BASE = "/faculty/my";
const LOG_KEY = "fcLogs";

const readLogs = (id) => {
  try {
    const all = JSON.parse(localStorage.getItem(LOG_KEY) || "{}");
    return all[id] || [];
  } catch {
    return [];
  }
};

export default function FacultyHistory({
  profile = { facultyId: "", facultyName: "" },
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("overview");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100,
      };
      const trimmed = q.trim();
      if (trimmed) params.q = trimmed;
      if (filter !== "All") params.status = filter.toLowerCase().replace(/\s+/g, "_");

      const res = await api.get(`${API_BASE}/submissions`, { params });
      const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
      setItems(
        rows.map((r) => ({
          id: r.id,
          title: r.title || "(no title)",
          cat: r.cat || "",
          priority: r.priority || "",
          status: r.status || "",
          updated: r.updated || "",
          location: r.location || "",
          reporterType: "faculty",
        }))
      );
    } catch (err) {
      console.error("Failed to load submissions", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  const filtered = useMemo(() => items, [items]);

  const openPanel = async (item) => {
    setOpen(true);
    setSelected({ ...item });
    setLogs(readLogs(item.id));
    setTab("overview");
    try {
      const res = await api.get(`${API_BASE}/submissions/${encodeURIComponent(item.id)}`);
      const payload = res.data?.data || {};
      setSelected((prev) => ({ ...prev, ...payload }));
    } catch (err) {
      console.error("Failed to load submission detail", err);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <FacultyLayout>
      <div className="fh-page">
        <header className="fh-header">
          <div>
            <h1 className="fh-title">My Submissions</h1>
            <p className="fh-sub">
              Complaints you filed as <b>{profile.facultyName || "Faculty"}</b>.
            </p>
          </div>
          <div className="fh-actions">
            <input
              className="fh-search"
              placeholder="Search by ID, title, location, assignee…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="fh-select"
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

        {loading && <div className="fh-empty">Loading…</div>}

        {!loading && (
          <div className="fh-grid">
            {filtered.map((item) => (
              <article
                key={item.id}
                className={`fh-card pr-${String(item.priority || "")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                onClick={() => openPanel(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openPanel(item)}
              >
                <div className="fh-rail" />
                <div className="fh-main">
                  <h3 className="fh-card-title">{item.title}</h3>
                  <div className="fh-id">{item.id}</div>
                  <div className="fh-meta">
                    <span>{item.location || "—"}</span>
                    <span>•</span>
                    <span>Updated: {item.updated || "—"}</span>
                  </div>
                </div>
                <div
                  className="fh-tags"
                  onClick={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  <span className="fh-chip">{item.cat || "—"}</span>
                  <span
                    className={`fh-chip tone-${(item.priority || "low").toLowerCase()}`}
                  >
                    {item.priority || "—"}
                  </span>
                  <span className="fh-chip tone-status">{item.status || "—"}</span>
                </div>
              </article>
            ))}
            {!filtered.length && <div className="fh-empty">No submissions found.</div>}
          </div>
        )}
      </div>

      {open && selected && (
        <div className="fh-modal show" onClick={() => setOpen(false)}>
          <div className="fh-panel" onClick={(e) => e.stopPropagation()}>
            <div className="fh-head">
              <div className="fh-titleblock">
                <h2>{selected.title}</h2>
                <div className="fh-subid">{selected.id}</div>
              </div>
              <button
                type="button"
                className="fh-xbtn"
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

            <div className="fh-tabs">
              {["overview", "incident", "people", "files", "log"].map((key) => (
                <button
                  key={key}
                  className={`fh-tab ${tab === key ? "active" : ""}`}
                  onClick={() => setTab(key)}
                  type="button"
                >
                  {key === "overview" && "Overview"}
                  {key === "incident" && "Incident"}
                  {key === "people" && "People"}
                  {key === "files" && "Tags & Attachments"}
                  {key === "log" && `Case Log (${logs.length})`}
                  {tab === key && <i className="fh-underline" />}
                </button>
              ))}
            </div>

            <div className="fh-body">
              {tab === "overview" && (
                <section className="fh-sec">
                  <div className="fh-grid2">
                    <div>
                      <label>Status</label>
                      <div className="fh-ro">{selected.status || "—"}</div>
                    </div>
                    <div>
                      <label>Priority</label>
                      <div className="fh-ro">{selected.priority || "—"}</div>
                    </div>
                    <div>
                      <label>Category</label>
                      <div className="fh-ro">{selected.cat || "—"}</div>
                    </div>
                    <div>
                      <label>Assigned To</label>
                      <div className="fh-ro">{selected.assignedTo || "—"}</div>
                    </div>
                    <div className="span-2">
                      <label>Location</label>
                      <div className="fh-ro">{selected.location || "—"}</div>
                    </div>
                    <div className="span-2">
                      <label>Updated</label>
                      <div className="fh-ro">{selected.updated || "—"}</div>
                    </div>
                  </div>
                  <label className="fh-lab">
                    Summary
                    <div className="fh-roarea">{selected.summary || "—"}</div>
                  </label>
                  <label className="fh-lab">
                    Detailed Description
                    <div className="fh-roarea">{selected.details || "—"}</div>
                  </label>
                </section>
              )}

              {tab === "incident" && (
                <section className="fh-sec">
                  <div className="fh-grid2">
                    <div>
                      <label>Subcategory</label>
                      <div className="fh-ro">{selected.subcategory || "—"}</div>
                    </div>
                    <div>
                      <label>Date &amp; Time</label>
                      <div className="fh-ro">{selected.incidentDateTime || "—"}</div>
                    </div>
                    <div className="span-2">
                      <label>Title / Subject</label>
                      <div className="fh-ro">
                        {selected.titleSubmitted || selected.title || "—"}
                      </div>
                    </div>
                    <div className="span-2">
                      <label>Submitted At</label>
                      <div className="fh-ro">{selected.submittedAt || "—"}</div>
                    </div>
                  </div>
                </section>
              )}

              {tab === "people" && (
                <section className="fh-sec">
                  <h4 className="fh-sec-title">Victims</h4>
                  {selected.victims?.length ? (
                    <ul className="fh-people">
                      {selected.victims.map((v, index) => (
                        <li key={`victim-${index}`} className="fh-person">
                          <div className="fh-person-line">
                            <b>{v.name || "—"}</b>
                            {v.reg && <span className="fh-tag">{v.reg}</span>}
                            {v.contact && <span className="fh-tag">{v.contact}</span>}
                          </div>
                          {v.description && (
                            <div className="fh-person-note">{v.description}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="fh-muted">No victims recorded.</div>
                  )}

                  <h4 className="fh-sec-title" style={{ marginTop: 14 }}>
                    Accused
                  </h4>
                  {selected.accused?.length ? (
                    <ul className="fh-people">
                      {selected.accused.map((a, index) => (
                        <li key={`accused-${index}`} className="fh-person">
                          <div className="fh-person-line">
                            <b>{a.name || "—"}</b>
                            {a.role && (
                              <span className="fh-tag">{String(a.role).toUpperCase()}</span>
                            )}
                            {a.id && <span className="fh-tag">{a.id}</span>}
                            {a.contact && <span className="fh-tag">{a.contact}</span>}
                          </div>
                          {a.description && (
                            <div className="fh-person-note">{a.description}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="fh-muted">No accused identified.</div>
                  )}

                  <h4 className="fh-sec-title" style={{ marginTop: 14 }}>
                    Witnesses
                  </h4>
                  {selected.witnesses?.length ? (
                    <ul className="fh-people">
                      {selected.witnesses.map((w, index) => (
                        <li key={`witness-${index}`} className="fh-person">
                          <div className="fh-person-line">
                            <b>{w.name || "—"}</b>
                            {(w.regNo || w.reg) && (
                              <span className="fh-tag">{w.regNo || w.reg}</span>
                            )}
                            {w.contact && <span className="fh-tag">{w.contact}</span>}
                          </div>
                          {w.description && (
                            <div className="fh-person-note">{w.description}</div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="fh-muted">No witnesses recorded.</div>
                  )}
                </section>
              )}

              {tab === "files" && (
                <section className="fh-sec">
                  <h4 className="fh-sec-title">Tags</h4>
                  <div className="fh-chips">
                    {Array.isArray(selected.tags) && selected.tags.length ? (
                      selected.tags.map((tag) => (
                        <span key={tag} className="fh-chip-pill">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="fh-muted">No tags</span>
                    )}
                  </div>

                  <h4 className="fh-sec-title" style={{ marginTop: 14 }}>
                    Attachments
                  </h4>
                  {Array.isArray(selected.attachments) && selected.attachments.length ? (
                    <div className="fh-files">
                      {selected.attachments.map((file, index) => (
                        <span key={index} className="fh-file">
                          {typeof file === "string" ? file : file.name || ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="fh-chip tone-status">No attachments</span>
                  )}
                </section>
              )}

              {tab === "log" && (
                <section className="fh-sec">
                  {!logs.length && <div className="fh-muted">No activity yet.</div>}
                  <ul className="fh-timeline">
                    {logs.map((log, index) => (
                      <li
                        key={index}
                        className={`fh-tl-item ${log.action?.replace(/\s+/g, "-") || ""}`}
                      >
                        <div className="fh-tl-dot" />
                        <div className="fh-tl-card">
                          <div className="fh-tl-top">
                            <span className="fh-tl-action">{log.action}</span>
                            <span className="fh-tl-time">{log.when}</span>
                          </div>
                          {log.note && <div className="fh-tl-note">{log.note}</div>}
                          {log.who && <div className="fh-tl-meta">by {log.who}</div>}
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
    </FacultyLayout>
  );
}
