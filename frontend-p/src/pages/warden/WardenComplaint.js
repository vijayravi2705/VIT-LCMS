import React, { useEffect, useMemo, useRef, useState } from "react";
import WardenLayout from "../layouts/WardenLayout";
import "../assets/styles/WardenComplaint.css";
import api from "../../utils/api";

const API_BASE = "/warden/complaints";

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
  adminNotes: "",
};

const foldList = (raw = {}) => ({
  id: raw.complaint_id ?? raw.cmpid ?? raw.id ?? "",
  title: raw.title ?? raw.title_preview ?? raw.complaint_id ?? "",
  cat: raw.category ?? null,
  priority: raw.severity ?? null,
  status: raw.status ?? null,
  assignedTo: raw.assigned_to ?? null,
  created_on: raw.created_on ?? null,
  updated_on: raw.updated_on ?? null,
  ...EMPTY_DETAIL,
});

const foldDetail = (raw = {}) => {
  const id = raw.complaint_id ?? raw.cmpid ?? raw.id ?? "";
  const parties = Array.isArray(raw.parties) ? raw.parties : [];
  const mapRole = (role) =>
    parties
      .filter((p) => p.party_role === role)
      .map((p, index) => ({
        key: p.cp_id ?? `${role}-${index}`,
        name: p.full_name || p.display_name || p.vit_id || "—",
        reg: p.vit_id || "",
        description: p.notes || "",
      }));

  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((att, index) => ({
        attachment_id: att.attachment_id ?? att.att_id ?? index,
        name: att.name ?? att.file_name ?? "",
        file_path: att.file_path ?? null,
        file_hash: att.file_hash ?? null,
        created_on: att.created_on ?? att.uploaded_on ?? null,
        uploader_vit: att.vit_id ?? att.uploader_vit ?? null,
      }))
    : [];

  return {
    ...EMPTY_DETAIL,
    id,
    title: raw.title ?? raw.title_preview ?? id,
    description: raw.description ?? "",
    cat: raw.category ?? raw.cat ?? null,
    priority: raw.severity ?? raw.priority ?? null,
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
    victims: mapRole("victim"),
    witnesses: mapRole("witness"),
    accused: mapRole("accused"),
    attachments,
    logs: Array.isArray(raw.logs) ? raw.logs : [],
  };
};

export default function WardenComplaints() {
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
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, q, sort, page, pageSize]);

  const params = () => {
    const result = { q, sort, page, pageSize };
    if (activeTab === "Emergency") result.priority = "emergency";
    else if (activeTab !== "All") result.status = activeTab.toLowerCase();
    return result;
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get(API_BASE, { params: params() });
      if (res.data?.ok) {
        setItems((res.data.data || []).map(foldList));
        setTotal(Number(res.data.total || 0));
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to load warden complaints:", err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    const res = await api.get(`${API_BASE}/${encodeURIComponent(id)}`);
    if (!res.data?.ok) throw new Error("not_found");
    const detail = foldDetail(res.data.data || {});
    setLogs(detail.logs);
    return detail;
  };

  const openPanel = async (row) => {
    setOpen(true);
    setLogOpen(false);
    setHydrated(false);
    setSelected(foldList(row));
    try {
      const full = await fetchDetail(row.id || row.complaint_id || row.cmpid);
      setSelected(full);
    } finally {
      setHydrated(true);
    }
  };

  const mutate = (key, value) =>
    setSelected((curr) => ({
      ...curr,
      [key]: typeof value === "function" ? value(curr[key]) : value,
    }));

  const closePanel = () => {
    setLogOpen(false);
    setOpen(false);
    setSelected(null);
  };

  const buildPayload = (overrides = {}) => ({
    status: overrides.status ?? selected.status,
    severity: overrides.severity ?? selected.priority,
    category: overrides.category ?? selected.cat,
    subcategory: overrides.subcategory ?? selected.subcategory ?? null,
    assigned_to: overrides.assigned_to ?? selected.assignedTo ?? null,
    admin_notes: overrides.admin_notes ?? selected.adminNotes ?? "",
  });

  const patchComplaint = async (body) => {
    await api.patch(`${API_BASE}/${encodeURIComponent(selected.id)}`, body);
  };

  const save = async () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await patchComplaint(buildPayload());
      await fetchComplaints();
      closePanel();
    } catch (err) {
      console.error(err);
      alert("Failed to update complaint.");
    } finally {
      setSaving(false);
    }
  };

  const quickSetStatus = async (status) => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await patchComplaint(buildPayload({ status }));
      await fetchComplaints();
      closePanel();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
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
    const term = q.trim().toLowerCase();
    if (!term) return items;
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
    <WardenLayout>
      <div className="wardencomplaint-page">
        <div className="wardencomplaint-header">
          <div>
            <h1 className="wardencomplaint-title">Complaint Dashboard</h1>
            <div className="wardencomplaint-sub">
              Warden view — manage and resolve complaints for your block.
            </div>
          </div>
          <div className="wardencomplaint-actions" style={{ gap: 12 }}>
            <input
              className="wardencomplaint-search"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search by ID or title"
            />
            <select
              className="wardencomplaint-sort"
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
              className="wardencomplaint-sort"
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

        <div className="wardencomplaint-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`wardencomplaint-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              <span>{tab.label}</span>
              <span className="wardencomplaint-badge">{tab.count}</span>
              {activeTab === tab.key && <i className="wardencomplaint-underline" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="wardencomplaint-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="wardencomplaint-empty">No complaints found.</div>
        ) : (
          <div className="wardencomplaint-list">
            {filtered.map((item) => (
              <article
                key={item.id}
                className={`wardencomplaint-card ${item.priority || ""}`}
                onClick={() => openPanel(item)}
                style={{ cursor: "pointer" }}
              >
                <div className="wardencomplaint-rail" />
                <div>
                  <h3 className="wardencomplaint-card-title">{item.title || item.id}</h3>
                  <div className="wardencomplaint-id">{item.id}</div>
                </div>
                <div className="wardencomplaint-card-right">
                  <span className="wardencomplaint-chip tone-cat">{item.cat || "—"}</span>
                  <span className={`wardencomplaint-chip tone-${item.priority || "none"}`}>
                    {item.priority || "—"}
                  </span>
                  <span className="wardencomplaint-chip tone-status">
                    {titleCase(item.status)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="wardencomplaint-pager">
          <button
            className="wardencomplaint-page-btn"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className="wardencomplaint-page-indicator">
            Page {page} / {maxPage}
          </div>
          <button
            className="wardencomplaint-page-btn"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {open && selected && (
        <div className="wardencomplaint-modal show" onClick={closePanel}>
          <div className="wardencomplaint-panel" onClick={(e) => e.stopPropagation()}>
            <div className="wardencomplaint-panel-head">
              <div className="wardencomplaint-titleblock">
                <h2>Case</h2>
                <div className="wardencomplaint-subid">{selected.id}</div>
              </div>
              <button className="wardencomplaint-close" onClick={closePanel} disabled={saving}>
                ✕
              </button>
            </div>

            <div className="wardencomplaint-panel-body">
              {/* Reporter section */}
              <section className="wardencomplaint-sec">
                <h4 className="wardencomplaint-sec-title">Reporter</h4>
                <div className="wardencomplaint-ro-grid">
                  {[
                    ["Filed By (Role)", selected.filed_by],
                    ["Created By (VIT)", selected.created_by_vit],
                    ["Creator Name", selected.created_by_name],
                    ["Creator Email", selected.created_by_email],
                    ["Creator Phone", selected.created_by_phone],
                    ["Submitted", fmtTime(selected.created_on)],
                    ["Updated", fmtTime(selected.updated_on)],
                    ["Verification", selected.verification_code],
                  ].map(([label, value], index) => (
                    <div key={index}>
                      <label>{label}</label>
                      <div className={`wardencomplaint-ro ${hydrated ? "" : "skeleton"}`}>
                        {value || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Incident details */}
              <section className="wardencomplaint-sec">
                <h4 className="wardencomplaint-sec-title">Incident Details</h4>
                <div className="wardencomplaint-ro-grid">
                  {[
                    ["Category", selected.cat],
                    ["Subcategory", selected.subcategory],
                    ["Priority", selected.priority],
                    ["Status", selected.status],
                    ["Assigned Block", selected.assigned_block],
                    ["Assigned To", selected.assignedTo],
                  ].map(([label, value], index) => (
                    <div key={index}>
                      <label>{label}</label>
                      <div className="wardencomplaint-ro">{value || "—"}</div>
                    </div>
                  ))}
                </div>
                <div className="wardencomplaint-ro-grid">
                  <div className="wardencomplaint-span-2">
                    <label>Title</label>
                    <div className="wardencomplaint-ro">{selected.title || selected.id}</div>
                  </div>
                </div>
                <label className="wardencomplaint-lab">
                  Description
                  <div className="wardencomplaint-roarea" style={{ whiteSpace: "pre-wrap" }}>
                    {selected.description || "—"}
                  </div>
                </label>
              </section>

              {/* People */}
              {[
                ["Victims", selected.victims],
                ["Accused", selected.accused],
                ["Witnesses", selected.witnesses],
              ].map(([heading, list]) => (
                <section className="wardencomplaint-sec" key={heading}>
                  <h4 className="wardencomplaint-sec-title">{heading}</h4>
                  {Array.isArray(list) && list.length ? (
                    <ul className="wardencomplaint-people">
                      {list.map((person) => (
                        <li key={person.key} className="wardencomplaint-person">
                          <div className="wardencomplaint-person-line">
                            <b>{person.name}</b>
                            {person.reg && (
                              <span className="wardencomplaint-tag">{person.reg}</span>
                            )}
                          </div>
                          {person.description && (
                            <div className="wardencomplaint-person-note">
                              {person.description}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="wardencomplaint-muted">No records.</div>
                  )}
                </section>
              ))}

              {/* Attachments */}
              <section className="wardencomplaint-sec">
                <h4 className="wardencomplaint-sec-title">Attachments</h4>
                <div className="wardencomplaint-attachments">
                  {selected.attachments.length ? (
                    <div className="wardencomplaint-files">
                      {selected.attachments.map((file, index) => (
                        <div key={index} className="wardencomplaint-file-row">
                          <a
                            className="wardencomplaint-file"
                            href={`/${file.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {file.name || file.file_path || `file-${file.attachment_id || index}`}
                          </a>
                          <span className="wardencomplaint-meta">
                            by {file.uploader_vit || "—"}
                          </span>
                          <span className="wardencomplaint-meta">
                            {fmtTime(file.created_on)}
                          </span>
                          <span className="wardencomplaint-meta mono">
                            {file.file_hash || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="wardencomplaint-chip tone-status">No attachments</span>
                  )}
                </div>
              </section>

              {/* Controls */}
              <section className="wardencomplaint-sec">
                <h4 className="wardencomplaint-sec-title">Case Controls</h4>
                <div className="wardencomplaint-edit">
                  <label>
                    Status
                    <select
                      value={selected.status || ""}
                      onChange={(e) => mutate("status", e.target.value)}
                      disabled={saving}
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
                      onChange={(e) => mutate("priority", e.target.value)}
                      disabled={saving}
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={selected.cat || ""}
                      onChange={(e) => mutate("cat", e.target.value)}
                      disabled={saving}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assigned To
                    <input
                      value={selected.assignedTo || ""}
                      onChange={(e) => mutate("assignedTo", e.target.value)}
                      disabled={saving}
                    />
                  </label>
                </div>
              </section>

              <textarea
                className="wardencomplaint-notes"
                rows={2}
                placeholder="Internal notes…"
                value={selected.adminNotes || ""}
                onChange={(e) => mutate("adminNotes", e.target.value)}
                disabled={saving}
              />

              <div style={{ marginTop: 10 }}>
                <button
                  className="wardencomplaint-btn"
                  onClick={() => setLogOpen(true)}
                  style={{ width: 130 }}
                  disabled={saving}
                >
                  View Log
                </button>
              </div>
            </div>

            <div className="wardencomplaint-actionsbar">
              <div />
              <div className="wardencomplaint-actionsrow">
                <button className="success" onClick={save} disabled={saving}>
                  Save
                </button>
                <button className="ok" onClick={() => quickSetStatus("resolved")} disabled={saving}>
                  Resolve
                </button>
                <button className="danger" onClick={() => quickSetStatus("rejected")} disabled={saving}>
                  Reject
                </button>
                <button className="wardencomplaint-btn ghost" onClick={closePanel} disabled={saving}>
                  Close
                </button>
              </div>
            </div>

            {logOpen && (
              <aside className="wardencomplaint-log-drawer show" onClick={(e) => e.stopPropagation()}>
                <div className="wardencomplaint-log-head">
                  <h4>Activity Log</h4>
                  <span className="wardencomplaint-log-count">{logs.length}</span>
                  <button className="wardencomplaint-xbtn" onClick={() => setLogOpen(false)} disabled={saving}>
                    ✕
                  </button>
                </div>
                <div className="wardencomplaint-log-body">
                  {logs.length === 0 ? (
                    <div className="wardencomplaint-log-empty">No log entries.</div>
                  ) : (
                    <ul className="wardencomplaint-timeline">
                      {logs.map((log, index) => (
                        <li key={index} className={`wardencomplaint-tl-item ${log.action}`}>
                          <span className="wardencomplaint-tl-dot" />
                          <div className="wardencomplaint-tl-card">
                            <div className="wardencomplaint-tl-top">
                              <div className="wardencomplaint-tl-action">{log.action}</div>
                              <div className="wardencomplaint-tl-time">{fmtTime(log.created_on)}</div>
                            </div>
                            {log.status_after && (
                              <div className="wardencomplaint-tl-meta">status → {log.status_after}</div>
                            )}
                            {log.notes && (
                              <div className="wardencomplaint-tl-note">{log.notes}</div>
                            )}
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
    </WardenLayout>
  );
}
