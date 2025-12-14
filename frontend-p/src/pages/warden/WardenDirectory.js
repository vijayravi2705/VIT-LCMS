// src/pages/warden/WardenDirectory.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../assets/styles/wardend.css";
import WardenLayout from "../layouts/WardenLayout";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

const API_BASE = "/warden/directory";
const DEFAULT_DETAIL_LIMIT = 25;

const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : v);
const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
};

const QueuePill = ({ label, value, tone = "" }) => (
  <span className={`wdd-pill ${tone ? `wdd-pill--${tone}` : ""}`}>
    <b>{Number(value || 0)}</b> {label}
  </span>
);

export default function WardenDirectory() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ q: "", hostelType: "", block: "", sort: "name" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  const [qDebounced, setQDebounced] = useState(filters.q);
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(filters.q), 350);
    return () => clearTimeout(t);
  }, [filters.q]);

  const fetchDirectory = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(API_BASE, {
        params: { ...filters, q: qDebounced, page, pageSize },
      });
      if (res.data?.ok) {
        setItems(res.data.data || []);
        setTotal(Number(res.data.total || 0));
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch {
      setError("Unable to load wardens right now.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, filters.hostelType, filters.block, filters.sort, page, pageSize]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setDetailOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const maxPage = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  const openDetail = async (vitId) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`${API_BASE}/${vitId}`, { params: { limit: DEFAULT_DETAIL_LIMIT } });
      setDetail(res.data?.ok ? res.data.data : { error: "not_found" });
    } catch {
      setDetail({ error: "failed" });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  const complaints = detail?.complaints || [];
  const summary = detail?.summary || {};
  const profile = detail?.profile || {};

  const goToComplaints = (blockCode) => {
    const query = blockCode ? `?block=${encodeURIComponent(blockCode)}` : "";
    navigate(`/warden/complaints${query}`);
  };

  return (
    <WardenLayout>
      <div className="wdd-page">
        <header className="wdd-header">
          <div>
            <h1 className="wdd-title">Warden Directory</h1>
            <p className="wdd-sub">View every warden, their block coverage, and current queue.</p>
          </div>
          <div className="wdd-actions">
            <input
              className="wdd-input"
              placeholder="Search by name, VIT ID, phone, email"
              value={filters.q}
              onChange={(e) => {
                setPage(1);
                setFilters((p) => ({ ...p, q: e.target.value }));
              }}
            />
            <select
              className="wdd-select"
              value={filters.hostelType}
              onChange={(e) => {
                setPage(1);
                setFilters((p) => ({ ...p, hostelType: e.target.value }));
              }}
            >
              <option value="">All hostel types</option>
              <option value="MH">MH</option>
              <option value="LH">LH</option>
            </select>
            <input
              className="wdd-input"
              placeholder="Block code (e.g., A1)"
              value={filters.block}
              onChange={(e) => {
                setPage(1);
                setFilters((p) => ({ ...p, block: e.target.value }));
              }}
            />
            <select
              className="wdd-select"
              value={filters.sort}
              onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value }))}
            >
              <option value="name">Sort by name</option>
              <option value="queue">Sort by queue size</option>
            </select>
            <select
              className="wdd-select"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value={8}>8 / page</option>
              <option value={12}>12 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="wdd-empty">Loading wardens…</div>
        ) : error ? (
          <div className="wdd-empty wdd-empty--error">{error}</div>
        ) : items.length === 0 ? (
          <div className="wdd-empty">No wardens match those filters.</div>
        ) : (
          <>
            <div className="wdd-grid">
              {items.map((warden) => (
                <button
                  key={warden.vit_id}
                  className="wdd-card"
                  type="button"
                  onClick={() => openDetail(warden.vit_id)}
                >
                  <div className="wdd-card-head">
                    <div className="wdd-card-photo">
                      {warden.photo_url ? (
                        <img src={warden.photo_url} alt={warden.full_name} />
                      ) : (
                        <span>{warden.full_name?.charAt(0) || "W"}</span>
                      )}
                    </div>
                    <div className="wdd-card-title">
                      <h3>{warden.full_name || "—"}</h3>
                      <div className="wdd-card-meta">
                        <span>{warden.vit_id}</span>
                        {warden.designation && <span>• {warden.designation}</span>}
                      </div>
                    </div>
                  </div>

                  <dl className="wdd-card-info">
                    <div>
                      <dt>Hostel</dt>
                      <dd>{fmt(warden.hostel_type)}</dd>
                    </div>
                    <div>
                      <dt>Block</dt>
                      <dd>{fmt(warden.block_code)}</dd>
                    </div>
                    <div>
                      <dt>Shift</dt>
                      <dd>{fmt(warden.shift)}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{fmt(warden.email)}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{fmt(warden.phone)}</dd>
                    </div>
                  </dl>

                  <div className="wdd-card-queue">
                    <QueuePill label="pending" value={warden.pending_count} tone="pending" />
                    <QueuePill label="total" value={warden.total_count} />
                    <QueuePill label="resolved" value={warden.resolved_count} tone="resolved" />
                    <QueuePill label="emergency" value={warden.emergency_count} tone="emergency" />
                  </div>
                </button>
              ))}
            </div>

            <footer className="wdd-pager">
              <button
                className="wdd-page-btn"
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="wdd-page-indicator">Page {page} / {maxPage}</span>
              <button
                className="wdd-page-btn"
                type="button"
                disabled={page >= maxPage}
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              >
                Next
              </button>
            </footer>
          </>
        )}
      </div>

      {detailOpen && (
        <div className="wdd-modal show" onClick={closeDetail}>
          <div className="wdd-panel" onClick={(e) => e.stopPropagation()}>
            <div className="wdd-panel-head">
              <div>
                <h2>{profile.full_name || profile.vit_id || "Warden"}</h2>
                <div className="wdd-panel-sub">
                  {profile.vit_id}
                  {profile.designation ? ` • ${profile.designation}` : ""}
                </div>
              </div>
              <button className="wdd-close" type="button" onClick={closeDetail}>✕</button>
            </div>

            <div className="wdd-panel-body">
              {detailLoading ? (
                <div className="wdd-empty">Loading profile…</div>
              ) : detail?.error === "not_found" ? (
                <div className="wdd-empty wdd-empty--error">Warden not found.</div>
              ) : detail?.error === "failed" ? (
                <div className="wdd-empty wdd-empty--error">Unable to load profile.</div>
              ) : (
                <>
                  <section className="wdd-sec">
                    <h3 className="wdd-sec-title">Contact & Coverage</h3>
                    <div className="wdd-columns">
                      <div><label>Email</label><div className="wdd-ro">{fmt(profile.email)}</div></div>
                      <div><label>Phone</label><div className="wdd-ro">{fmt(profile.phone)}</div></div>
                      <div><label>Hostel</label><div className="wdd-ro">{fmt(profile.hostel_type)}</div></div>
                      <div><label>Block</label><div className="wdd-ro">{fmt(profile.block_code)}</div></div>
                      <div><label>Shift</label><div className="wdd-ro">{fmt(profile.shift)}</div></div>
                      <div><label>Reports Filed</label><div className="wdd-ro">{profile.reports_filed ?? 0}</div></div>
                    </div>
                  </section>

                  <section className="wdd-sec">
                    <h3 className="wdd-sec-title">Queue Snapshot</h3>
                    <div className="wdd-queue-summary">
                      <QueuePill label="pending" value={summary.pending ?? profile.pending_count ?? 0} tone="pending" />
                      <QueuePill label="total" value={summary.total ?? profile.total_count ?? 0} />
                      <QueuePill label="resolved" value={summary.resolved ?? profile.resolved_count ?? 0} tone="resolved" />
                      <QueuePill label="emergency" value={profile.emergency_count ?? 0} tone="emergency" />
                      <QueuePill label="filed" value={summary.my_reports ?? profile.reports_filed ?? 0} />
                    </div>
                    <div className="wdd-queue-action">
                      <button
                        className="wdd-link"
                        type="button"
                        onClick={() => {
                          closeDetail();
                          goToComplaints(profile.block_code);
                        }}
                      >
                        View complaints for {profile.block_code || "this block"} →
                      </button>
                    </div>
                  </section>

                  <section className="wdd-sec">
                    <div className="wdd-sec-head">
                      <h3 className="wdd-sec-title">Recent Complaints</h3>
                      <span className="wdd-muted">Showing {complaints.length} of {detail.complaintsTotal} cases</span>
                    </div>
                    {complaints.length === 0 ? (
                      <div className="wdd-empty">No complaints assigned right now.</div>
                    ) : (
                      <table className="wdd-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Updated</th>
                          </tr>
                        </thead>
                    <tbody>
  {complaints.map((c) => (
    <tr
      key={c.complaint_id || c.id}
      className="wdd-table-row"
      onClick={() => {
        closeDetail();
        navigate(`/warden/complaints?focus=${encodeURIComponent(c.complaint_id || c.id)}`);
      }}
    >
      <td>{c.complaint_id || c.id}</td>
      <td>{c.title || c.title_preview || "—"}</td>
      <td>{c.category || "—"}</td>
      <td>{c.severity || "—"}</td>
      <td>{c.status || "—"}</td>
      <td>{fmtDate(c.updated_on || c.created_on)}</td>
    </tr>
  ))}
</tbody>
                      </table>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </WardenLayout>
  );
}
