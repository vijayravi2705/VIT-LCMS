// src/pages/faculty/FacultyComplaints.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import FacultyLayout from "../layouts/FacultyLayout";
import "../assets/styles/facultycomplaint.css";
import api from "../../utils/api";

const API_BASE = "/faculty/complaints";

const STATUSES = ["submitted", "in_review", "in_progress", "resolved", "rejected"];
const PRIORITIES = ["low", "medium", "high", "emergency"];
const CATEGORIES = ["maintenance", "safety", "food", "other"];

const titleCase = (s = "") =>
  s
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const fmtTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const EMPTY_DETAIL = {
  victims: [],
  witnesses: [],
  accused: [],
  attachments: [],
  logs: [],
};

const foldList = (raw = {}) => ({
  id: raw.cmpid || raw.id || raw.complaint_id,
  title: raw.title ?? raw.title_preview ?? raw.id ?? "",
  cat: raw.category ?? null,
  priority: raw.severity ?? null,
  status: raw.status ?? null,
  assignedTo: raw.assigned_to ?? null,
  created_on: raw.created_on ?? null,
  updated_on: raw.updated_on ?? null,
  locked: Boolean(raw.is_locked),
  locked_by: raw.lock_owner_vit || null,
  locked_on: raw.locked_on || null,
  ...EMPTY_DETAIL,
});

const foldDetail = (raw = {}) => {
  const id = raw.cmpid || raw.id || raw.complaint_id;

  const parties = Array.isArray(raw.parties) ? raw.parties : [];
  const mapPeople = (role) =>
    parties
      .filter((p) => p.party_role === role)
      .map((p) => ({
        name: p.full_name || p.vit_id,
        reg: p.vit_id,
        description: p.notes || "",
      }));

  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((att, idx) => ({
        attachment_id: att.attachment_id ?? att.att_id ?? idx,
        name: att.name ?? att.file_name ?? "",
        file_path: att.file_path ?? null,
        file_hash: att.file_hash ?? null,
        created_on: att.created_on ?? att.uploaded_on ?? null,
        uploader_vit: att.vit_id ?? att.uploader_vit ?? null,
      }))
    : [];

  return {
    id,
    title: raw.title ?? raw.title_preview ?? id,
    description: raw.description ?? "",
    cat: raw.category ?? null,
    priority: raw.severity ?? null,
    status: raw.status ?? null,
    assigned_block: raw.assigned_block ?? null,
    assignedTo: raw.assigned_to ?? null,
    subcategory: raw.subcategory ?? null,
    created_on: raw.created_on ?? null,
    updated_on: raw.updated_on ?? null,
    verification_code: raw.verification_code ?? null,
    filed_by: raw.filed_by ?? null,
    created_by_vit: raw.created_by_vit ?? null,
    created_by_name: raw.created_by_name ?? null,
    created_by_email: raw.created_by_email ?? null,
    created_by_phone: raw.created_by_phone ?? null,
    victims: mapPeople("victim"),
    witnesses: mapPeople("witness"),
    accused: mapPeople("accused"),
    attachments,
    logs: Array.isArray(raw.logs) ? raw.logs : [],
    locked: Boolean(raw.is_locked),
    locked_by: raw.lock_owner_vit || null,
    locked_on: raw.locked_on || null,
    adminNotes: raw.adminNotes || "",
  };
};

export default function FacultyComplaints() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [logOpen, setLogOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const logBtnRef = useRef(null);
  const logCloseBtnRef = useRef(null);

  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escForm, setEscForm] = useState({
    facultyId: "",
    wardenVit: "",
    hostelType: "",
    block: "",
  });

  const roles =
    JSON.parse(localStorage.getItem("jwt_payload") || "{}")?.roles ||
    JSON.parse(localStorage.getItem("facultyProfile") || "{}")?.roles ||
    [];
  const isAdmin = Array.isArray(roles) && roles.includes("faculty_admin");
  const lockedAndNotAdmin = selected?.locked && !isAdmin;

  useEffect(() => {
    void fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, q, sort, page, pageSize]);

  const queryParams = () => {
    const params = { q, sort, page, pageSize };
    if (activeTab === "Emergency") params.priority = "emergency";
    else if (activeTab !== "All") params.status = activeTab.toLowerCase();
    return params;
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_BASE, { params: queryParams() });
      if (res.data?.ok) {
        setItems((res.data.data || []).map(foldList));
        setTotal(Number(res.data.total || 0));
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to load complaints:", err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    const [detailRes, logRes] = await Promise.all([
      api.get(`${API_BASE}/${id}`),
      api.get(`${API_BASE}/${id}/logs`).catch(() => ({ data: { ok: true, data: [] } })),
    ]);

    const payload = detailRes.data?.data || {};
    const detail = foldDetail({
      ...payload,
      logs: logRes.data?.data || [],
    });

    setLogs(detail.logs);
    return detail;
  };

  const openPanel = async (row) => {
    setOpen(true);
    setLogOpen(false);
    setHydrated(false);
    setSelected(foldList(row));
    try {
      const full = await fetchDetail(row.id || row.cmpid || row.complaint_id);
      setSelected(full);
    } finally {
      setHydrated(true);
    }
  };

  const mutateSelected = (key, value) =>
    setSelected((curr) => ({
      ...curr,
      [key]: typeof value === "function" ? value(curr[key]) : value,
    }));

  const closePanel = () => {
    setLogOpen(false);
    setOpen(false);
    setSelected(null);
  };

  const patchComplaint = (id, body) => api.patch(`${API_BASE}/${id}`, body);

  const save = async () => {
    if (!selected || saving || lockedAndNotAdmin) return;
    setSaving(true);
    try {
      await patchComplaint(selected.id, {
        status: selected.status,
        severity: selected.priority,
        category: selected.cat,
        subcategory: selected.subcategory || null,
        assigned_to: selected.assignedTo || null,
        admin_notes: selected.adminNotes || "",
      });
      await fetchComplaints();
      closePanel();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const quickSetStatus = async (status) => {
    if (!selected || saving || lockedAndNotAdmin) return;
    setSaving(true);
    try {
      await patchComplaint(selected.id, {
        status,
        severity: selected.priority,
        category: selected.cat,
        subcategory: selected.subcategory || null,
        assigned_to: selected.assignedTo || null,
        admin_notes: selected.adminNotes || "",
      });
      await fetchComplaints();
      closePanel();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const confirmEscalate = async () => {
    if (!selected || saving || lockedAndNotAdmin) return;

    if (
      !escForm.facultyId &&
      !escForm.wardenVit &&
      (!escForm.hostelType || !escForm.block)
    ) {
      alert("Enter a Faculty ID, a Warden VIT, or hostel type + block.");
      return;
    }

    setSaving(true);
    try {
      await api.post(`${API_BASE}/${selected.id}/escalate`, {
        facultyId: escForm.facultyId || null,
        wardenVit: escForm.wardenVit || null,
        hostelType: escForm.hostelType || null,
        block: escForm.block || null,
        note: selected.adminNotes || "",
      });
      await fetchComplaints();
      setEscalateOpen(false);
      closePanel();
      setEscForm({ facultyId: "", wardenVit: "", hostelType: "", block: "" });
    } catch (err) {
      console.error(err);
      const code = err?.response?.data?.error || "Failed to escalate.";
      alert(code);
    } finally {
      setSaving(false);
    }
  };

  const lockCase = async () => {
    if (!selected || saving || !isAdmin) return;
    setSaving(true);
    try {
      await api.post(`${API_BASE}/${selected.id}/lock`, {
        reason: selected.adminNotes || "",
      });
      const full = await fetchDetail(selected.id);
      setSelected(full);
      await fetchComplaints();
    } catch (err) {
      console.error(err);
      alert("Failed to lock case.");
    } finally {
      setSaving(false);
    }
  };

  const unlockCase = async () => {
    if (!selected || saving || !isAdmin) return;
    setSaving(true);
    try {
      await api.post(`${API_BASE}/${selected.id}/unlock`, {
        reason: selected.adminNotes || "",
      });
      const full = await fetchDetail(selected.id);
      setSelected(full);
      await fetchComplaints();
    } catch (err) {
      console.error(err);
      alert("Failed to unlock case.");
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(() => {
    const acc = {
      All: 0,
      Emergency: 0,
      Submitted: 0,
      "In Review": 0,
      "In Progress": 0,
      Resolved: 0,
      Rejected: 0,
    };
    items.forEach((item) => {
      acc.All += 1;
      if (item.priority === "emergency") acc.Emergency += 1;
      const status = (item.status || "").toLowerCase();
      if (status === "submitted") acc.Submitted += 1;
      if (status === "in_review") acc["In Review"] += 1;
      if (status === "in_progress") acc["In Progress"] += 1;
      if (status === "resolved") acc.Resolved += 1;
      if (status === "rejected") acc.Rejected += 1;
    });
    return acc;
  }, [items]);

  const tabs = [
    { key: "All", label: "All", count: counts.All },
    { key: "Submitted", label: "Pending", count: counts.Submitted },
    { key: "In Review", label: "In Review", count: counts["In Review"] },
    { key: "In Progress", label: "In Progress", count: counts["In Progress"] },
    { key: "Resolved", label: "Resolved", count: counts.Resolved },
    { key: "Rejected", label: "Rejected", count: counts.Rejected },
    { key: "Emergency", label: "Emergency", count: counts.Emergency },
  ];

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter(
      (item) =>
        (item.id || "").toLowerCase().includes(term) ||
        (item.title || "").toLowerCase().includes(term)
    );
  }, [items, q]);

  const maxPage = Math.max(1, Math.ceil((total || 0) / pageSize));
  const canPrev = page > 1;
  const canNext = page < maxPage;

  return (
    <FacultyLayout>
      <div className="fc-page">
        <div className="fc-header">
          <div>
            <h1 className="fc-title">Complaint Dashboard</h1>
            <div className="fc-sub">
              Faculty view — manage, update, escalate, and resolve complaints.
            </div>
          </div>
          <div className="fc-actions" style={{ gap: 12 }}>
            <input
              className="fc-search"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search by ID or title"
            />
            <select
              className="fc-sort"
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value);
              }}
            >
              <option value="recent">Recent first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Priority first</option>
            </select>
            <select
              className="fc-sort"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        <div className="fc-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`fc-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              <span>{tab.label}</span>
              <span className="fc-badge">{tab.count}</span>
              {activeTab === tab.key && <i className="fc-underline" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="fx-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="fx-empty">No complaints found.</div>
        ) : (
          <div className="fc-list">
            {filtered.map((c) => (
              <article
                key={c.id}
                className={`fc-card ${c.priority}`}
                onClick={() => openPanel(c)}
                style={{ cursor: "pointer" }}
              >
                <div className="fc-rail" />
                <div>
                  <h3 className="fc-card-title">
                    {c.title || c.id}
                    {c.locked && (
                      <span
                        className="fc-card-lock"
                        title={c.locked_by ? `Locked by ${c.locked_by}` : "Locked"}
                      >
                        🔒
                      </span>
                    )}
                  </h3>
                  <div className="fc-id">{c.id}</div>
                </div>
                <div className="fc-card-right">
                  <span className="fc-chip tone-cat">{c.cat || "—"}</span>
                  <span className={`fc-chip tone-${c.priority}`}>{c.priority || "—"}</span>
                  <span className="fc-chip tone-status">{titleCase(c.status)}</span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="fc-pager">
          <button
            className="fc-page-btn"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className="fc-page-indicator">
            Page {page} / {maxPage}
          </div>
          <button
            className="fc-page-btn"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {open && selected && (
        <div className="fc-modal show" onClick={closePanel}>
          <div className="fc-panel" onClick={(e) => e.stopPropagation()}>
            <div className="fc-panel-head">
              <div className="fc-titleblock">
                <h2>Case</h2>
                <div className="fc-subid">{selected.id}</div>
              </div>
              <div className="fc-head-right">
                {selected.locked ? (
                  <span
                    className="fc-lock-badge"
                    title={selected.locked_by ? `Locked by ${selected.locked_by}` : "Locked"}
                  >
                    🔒 Locked
                  </span>
                ) : (
                  isAdmin && <span className="fc-unlock-hint">Unlocked</span>
                )}
                {isAdmin && (
                  selected.locked ? (
                    <button className="fc-btn ghost" onClick={unlockCase} disabled={saving}>
                      Unlock
                    </button>
                  ) : (
                    <button className="fc-btn ghost" onClick={lockCase} disabled={saving}>
                      Lock
                    </button>
                  )
                )}
                <button className="fc-close" onClick={closePanel} disabled={saving}>
                  ✕
                </button>
              </div>
            </div>

            <div className="fc-panel-body">
              <section className="fc-sec">
                <h4 className="fc-sec-title">Reporter</h4>
                <div className="fc-ro-grid">
                  <div>
                    <label>Filed By (Role)</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {selected.filed_by || "—"}
                    </div>
                  </div>
                  <div>
                    <label>Created By (VIT)</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {selected.created_by_vit || "—"}
                    </div>
                  </div>
                  <div>
                    <label>Creator Name</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {selected.created_by_name || "—"}
                    </div>
                  </div>
                  <div>
                    <label>Creator Email</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {selected.created_by_email || "—"}
                    </div>
                  </div>
                  <div>
                    <label>Creator Phone</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {selected.created_by_phone || "—"}
                    </div>
                  </div>
                  <div>
                    <label>Submitted</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {fmtTime(selected.created_on)}
                    </div>
                  </div>
                  <div>
                    <label>Updated</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {fmtTime(selected.updated_on)}
                    </div>
                  </div>
                  <div>
                    <label>Verification</label>
                    <div className={`fc-ro ${hydrated ? "" : "skeleton"}`}>
                      {selected.verification_code || "—"}
                    </div>
                  </div>
                </div>
              </section>

              <section className="fc-sec">
                <h4 className="fc-sec-title">Incident Details</h4>
                <div className="fc-ro-grid">
                  <div>
                    <label>Category</label>
                    <div className="fc-ro">{selected.cat || "—"}</div>
                  </div>
                  <div>
                    <label>Subcategory</label>
                    <div className="fc-ro">{selected.subcategory || "—"}</div>
                  </div>
                  <div>
                    <label>Priority</label>
                    <div className="fc-ro">{selected.priority || "—"}</div>
                  </div>
                  <div>
                    <label>Status</label>
                    <div className="fc-ro">{selected.status || "—"}</div>
                  </div>
                  <div>
                    <label>Assigned Block</label>
                    <div className="fc-ro">{selected.assigned_block || "—"}</div>
                  </div>
                  <div>
                    <label>Assigned To</label>
                    <div className="fc-ro">{selected.assignedTo || "—"}</div>
                  </div>
                </div>
                <div className="fc-ro-grid">
                  <div className="fc-span-2">
                    <label>Title</label>
                    <div className="fc-ro">{selected.title || selected.id}</div>
                  </div>
                </div>
                <label className="fc-lab">
                  Description
                  <div className="fc-roarea" style={{ whiteSpace: "pre-wrap" }}>
                    {selected.description || "—"}
                  </div>
                </label>
              </section>

              <section className="fc-sec">
                <h4 className="fc-sec-title">Victims</h4>
                {selected.victims.length ? (
                  <ul className="fc-people">
                    {selected.victims.map((v, i) => (
                      <li key={`victim-${i}`} className="fc-person">
                        <div className="fc-person-line">
                          <b>{v.name || "—"}</b>
                          {v.reg && <span className="fc-tag">{v.reg}</span>}
                        </div>
                        {v.description && <div className="fc-person-note">{v.description}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="fc-muted">No victims recorded.</div>
                )}
              </section>

              <section className="fc-sec">
                <h4 className="fc-sec-title">Accused</h4>
                {selected.accused.length ? (
                  <ul className="fc-people">
                    {selected.accused.map((a, i) => (
                      <li key={`accused-${i}`} className="fc-person">
                        <div className="fc-person-line">
                          <b>{a.name || "—"}</b>
                          {a.id && <span className="fc-tag">{a.id}</span>}
                        </div>
                        {a.description && <div className="fc-person-note">{a.description}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="fc-muted">No accused identified.</div>
                )}
              </section>

              <section className="fc-sec">
                <h4 className="fc-sec-title">Witnesses</h4>
                {selected.witnesses.length ? (
                  <ul className="fc-people">
                    {selected.witnesses.map((w, i) => (
                      <li key={`witness-${i}`} className="fc-person">
                        <div className="fc-person-line">
                          <b>{w.name || "—"}</b>
                          {w.reg && <span className="fc-tag">{w.reg}</span>}
                        </div>
                        {w.description && <div className="fc-person-note">{w.description}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="fc-muted">No witnesses recorded.</div>
                )}
              </section>

              <section className="fc-sec">
                <h4 className="fc-sec-title">Attachments</h4>
                <div className="fc-attachments">
                  {selected.attachments.length ? (
                    <div className="fc-files">
                      {selected.attachments.map((file, i) => (
                        <div key={i} className="fc-file-row">
                          <a
                            className="fc-file"
                            href={`/${file.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {file.name || file.file_path || `file-${file.attachment_id || i}`}
                          </a>
                          <span className="fc-meta">by {file.uploader_vit || "—"}</span>
                          <span className="fc-meta">{fmtTime(file.created_on)}</span>
                          <span className="fc-meta mono">{file.file_hash || ""}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="fc-chip tone-status">No attachments</span>
                  )}
                </div>
              </section>

              <section className="fc-sec">
                <h4 className="fc-sec-title">Case Controls</h4>
                {lockedAndNotAdmin && (
                  <div className="fc-locked-hint">
                    This case is locked. Only faculty admins can modify or escalate.
                  </div>
                )}
                <div className={`fc-edit-grid ${lockedAndNotAdmin ? "is-locked" : ""}`}>
                  <label>
                    Status
                    <select
                      value={selected.status || ""}
                      onChange={(e) => mutateSelected("status", e.target.value)}
                      disabled={saving || lockedAndNotAdmin}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select
                      value={selected.priority || ""}
                      onChange={(e) => mutateSelected("priority", e.target.value)}
                      disabled={saving || lockedAndNotAdmin}
                    >
                      {PRIORITIES.map((prio) => (
                        <option key={prio} value={prio}>
                          {prio}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={selected.cat || ""}
                      onChange={(e) => mutateSelected("cat", e.target.value)}
                      disabled={saving || lockedAndNotAdmin}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assigned To
                    <input
                      value={selected.assignedTo || ""}
                      onChange={(e) => mutateSelected("assignedTo", e.target.value)}
                      disabled={saving || lockedAndNotAdmin}
                    />
                  </label>
                </div>
              </section>

              <textarea
                className="fc-notes"
                rows={2}
                placeholder="Internal notes…"
                value={selected.adminNotes || ""}
                onChange={(e) => mutateSelected("adminNotes", e.target.value)}
                disabled={saving || lockedAndNotAdmin}
              />

              <div style={{ marginTop: 10 }}>
                <button
                  ref={logBtnRef}
                  className="fc-btn"
                  onClick={() => setLogOpen(true)}
                  style={{ width: 130 }}
                  disabled={saving}
                >
                  View Log
                </button>
              </div>
            </div>

            <div className="fc-actions-bar">
              <div />
              <div className="fc-actions-row">
                <button className="save" onClick={save} disabled={saving || lockedAndNotAdmin}>
                  Save
                </button>
                <button
                  className="warn"
                  onClick={() => setEscalateOpen(true)}
                  disabled={saving || lockedAndNotAdmin}
                >
                  Escalate
                </button>
                <button
                  className="ok"
                  onClick={() => quickSetStatus("resolved")}
                  disabled={saving || lockedAndNotAdmin}
                >
                  Resolve
                </button>
                <button
                  className="danger"
                  onClick={() => quickSetStatus("rejected")}
                  disabled={saving || lockedAndNotAdmin}
                >
                  Reject
                </button>
                <button className="fc-btn ghost" onClick={closePanel} disabled={saving}>
                  Close
                </button>
              </div>
            </div>

            {logOpen && (
              <aside className="fc-log-drawer show" onClick={(e) => e.stopPropagation()}>
                <div className="fc-log-head">
                  <h4>Activity Log</h4>
                  <span className="fc-log-count">{logs.length}</span>
                  <button
                    ref={logCloseBtnRef}
                    className="fc-xbtn"
                    onClick={() => setLogOpen(false)}
                    disabled={saving}
                  >
                    ✕
                  </button>
                </div>
                <div className="fc-log-body">
                  {logs.length === 0 ? (
                    <div className="fc-log-empty">No log entries.</div>
                  ) : (
                    <ul className="fc-timeline">
                      {logs.map((log, i) => (
                        <li key={i} className={`fc-tl-item ${log.action}`}>
                          <span className="fc-tl-dot" />
                          <div className="fc-tl-card">
                            <div className="fc-tl-top">
                              <div className="fc-tl-action">{log.action}</div>
                              <div className="fc-tl-time">{fmtTime(log.created_on)}</div>
                            </div>
                            {log.status_after && (
                              <div className="fc-tl-meta">status → {log.status_after}</div>
                            )}
                            {log.notes && <div className="fc-tl-note">{log.notes}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      )}

      {escalateOpen && selected && (
        <div className="fc-modal show" onClick={() => setEscalateOpen(false)}>
          <div className="fc-panel fc-escalate" onClick={(e) => e.stopPropagation()}>
            <div className="fc-panel-head">
              <div className="fc-titleblock">
                <h2>Escalate Complaint</h2>
                <div className="fc-subid">{selected.id}</div>
              </div>
              <button className="fc-close" onClick={() => setEscalateOpen(false)} disabled={saving}>
                ✕
              </button>
            </div>

            <div className="fc-panel-body">
              <div className="fc-sec">
                <h3 className="fc-sec-title">Route to a Faculty</h3>
                <div className="fc-edit-grid">
                  <label>
                    Faculty ID
                    <input
                      placeholder="e.g., VITF101"
                      value={escForm.facultyId}
                      onChange={(e) =>
                        setEscForm((f) => ({ ...f, facultyId: e.target.value }))
                      }
                      disabled={saving || lockedAndNotAdmin}
                    />
                  </label>
                </div>
              </div>

              <div className="fc-sec">
                <h3 className="fc-sec-title">Route to Warden by Block</h3>
                <div className="fc-edit-grid">
                  <label>
                    Hostel Type
                    <select
                      value={escForm.hostelType}
                      onChange={(e) =>
                        setEscForm((f) => ({ ...f, hostelType: e.target.value }))
                      }
                      disabled={saving || lockedAndNotAdmin}
                    >
                      <option value="">Select</option>
                      <option value="MH">MH</option>
                      <option value="LH">LH</option>
                    </select>
                  </label>
                  <label>
                    Block
                    <input
                      placeholder="e.g., A"
                      value={escForm.block}
                      onChange={(e) =>
                        setEscForm((f) => ({ ...f, block: e.target.value }))
                      }
                      disabled={saving || lockedAndNotAdmin}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="fc-actions-bar">
              <textarea
                className="fc-notes"
                rows={2}
                placeholder="Optional note…"
                value={selected?.adminNotes || ""}
                onChange={(e) => mutateSelected("adminNotes", e.target.value)}
                disabled={saving || lockedAndNotAdmin}
              />
              <div className="fc-actions-row">
                <button
                  className="save"
                  onClick={confirmEscalate}
                  disabled={saving || lockedAndNotAdmin}
                >
                  Confirm
                </button>
                <button
                  className="fc-btn ghost"
                  onClick={() => setEscalateOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FacultyLayout>
  );
}
