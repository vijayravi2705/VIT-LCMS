    // src/pages/StudentHistory.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import StudentLayout from "../layouts/StudentLayout";
import "../assets/styles/Studenthistory.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import api from "../../utils/api";

const tone = (s) =>
  ({ submitted: "pending", in_review: "pending", in_progress: "in-progress", resolved: "resolved", rejected: "rejected" }[String(s || "").toLowerCase()] || "");

const waitFonts = async () => { try { if (document.fonts?.ready) await document.fonts.ready; } catch {} };

const sanitizeClone = (root) => {
  root.querySelectorAll("*").forEach((el) => {
    const style = el.style;
    style.setProperty("backdrop-filter", "none", "important");
    style.setProperty("-webkit-backdrop-filter", "none", "important");
    style.setProperty("filter", "none", "important");
    style.setProperty("box-shadow", "none", "important");
    const cs = window.getComputedStyle(el);
    if (cs.position === "sticky") {
      style.setProperty("position", "static", "important");
      style.setProperty("top", "auto", "important");
    }
  });
};

const makeFullClone = (node) => {
  const clone = node.cloneNode(true);
  const rect = node.getBoundingClientRect();
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-99999px";
  host.style.top = "0";
  host.style.width = rect.width + "px";
  host.style.background = "#fff";
  host.appendChild(clone);
  clone.style.maxHeight = "none";
  clone.style.overflow = "visible";
  const scroller = clone.querySelector(".sthis-sections");
  if (scroller) { scroller.style.maxHeight = "none"; scroller.style.overflow = "visible"; }
  document.body.appendChild(host);
  sanitizeClone(clone);
  return { host, clone, cleanup: () => host.remove() };
};

const sliceCanvasIntoPages = (srcCanvas, pageHeightPx) => {
  const pages = [];
  const { width, height } = srcCanvas;
  if (!width || !height) return pages;
  let y = 0;
  while (y < height) {
    const sliceHeight = Math.min(pageHeightPx, height - y);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = width; pageCanvas.height = sliceHeight;
    const ctx = pageCanvas.getContext("2d");
    ctx.drawImage(srcCanvas, 0, y, width, sliceHeight, 0, 0, width, sliceHeight);
    pages.push(pageCanvas);
    y += sliceHeight;
  }
  return pages;
};

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
};

const normalizeDateStr = (s) => {
  if (!s) return "";
  const t = typeof s === "string" ? s.replace(" ", "T") : s;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};

const exportCasePDF = async (panelRef, sel) => {
  if (!panelRef?.current || !sel) return;
  await waitFonts();
  const { clone, cleanup } = makeFullClone(panelRef.current);
  const renderWidth = clone.scrollWidth || clone.offsetWidth || 1200;
  const renderHeight = clone.scrollHeight || clone.offsetHeight || 2000;
  const bigCanvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: renderWidth,
    height: renderHeight,
    windowWidth: renderWidth,
    windowHeight: renderHeight,
    scrollX: 0,
    scrollY: 0,
    removeContainer: true
  });
  cleanup();
  if (!bigCanvas || !bigCanvas.width || !bigCanvas.height) return;
  const pdf = new jsPDF("p", "pt", "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 30;
  const renderW = pageW - margin * 2;
  const scale = renderW / bigCanvas.width;
  const contentHpt = pageH - margin * 2;
  const pageHeightPx = Math.max(1, Math.floor(contentHpt / scale));
  const pages = sliceCanvasIntoPages(bigCanvas, pageHeightPx);
  pdf.setFontSize(16);
  pdf.text(sel.title || sel.complaint_id, margin, 24);
  if (!pages.length) {
    const hPt = bigCanvas.height * scale;
    const img = bigCanvas.toDataURL("image/png");
    pdf.addImage(img, "PNG", margin, 40, renderW, hPt);
    pdf.save(`${sel.complaint_id}.pdf`);
    return;
  }
  pages.forEach((pageCanvas, idx) => {
    if (idx > 0) { pdf.addPage(); pdf.setFontSize(12); pdf.text(sel.complaint_id, margin, 22); }
    const sliceHpt = pageCanvas.height * scale;
    const img = pageCanvas.toDataURL("image/png");
    pdf.addImage(img, "PNG", margin, (idx === 0 ? 40 : margin), renderW, sliceHpt);
  });
  pdf.save(`${sel.complaint_id}.pdf`);
};

export default function StudentHistory() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const tableRef = useRef(null);
  const panelRef = useRef(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/complaints/mine", { params: { limit: 100, order: "desc" } });
      const rows = (data?.items || []).map((r) => {
        const complaint_id   = pick(r, "complaint_id", "id");
        const title          = pick(r, "title", "title_preview");
        const category       = pick(r, "category", "type");
        const subcategory    = pick(r, "subcategory", "sub_category", "subCategory", "sub_cat");
        const severity       = pick(r, "severity", "priority");
        const assigned_block = pick(r, "assigned_block", "block", "place");
        const created_on_raw = pick(r, "created_on", "createdOn", "created_at", "createdAt");
        const created_on     = normalizeDateStr(created_on_raw);
        return {
          complaint_id,
          title,
          category,
          subcategory,
          severity,
          status: r.status || "",
          assigned_block,
          created_on
        };
      });
      setRows(rows);
    } catch (err) {
      console.error("Fetch complaints failed:", err);
    }
    setLoading(false);
  };

  const openCase = async (row) => {
    setSel(row);
    setOpen(true);
    setBusy(true);
    try {
      const cid = row.complaint_id || row.id;
      const { data } = await api.get(`/complaints/${cid}`);
      const c = data?.complaint || {};
      const parties = data?.parties || [];
      const logs = (data?.logs || []).map(x => ({ ...x, created_on: normalizeDateStr(x.created_on) }));
      const files = data?.files || [];
      const victims   = parties.filter(p => p.party_role === "victim").map(p => ({ name: "", reg: p.vit_id, contact: "", description: p.notes || "" }));
      const accused   = parties.filter(p => p.party_role === "accused").map(p => ({ name: "", id:  p.vit_id, contact: "", description: p.notes || "" }));
      const witnesses = parties.filter(p => p.party_role === "witness").map(p => ({ name: "", reg: p.vit_id, contact: "", description: p.notes || "" }));
      setDetail({
        complaint_id: c.complaint_id,
        title: pick(c, "title_plain", "title_preview", "title"),
        description: pick(c, "description_plain", "description"),
        category: c.category || "",
        subcategory: c.subcategory || "",
        severity: c.severity || "",
        status: c.status || "",
        assigned_block: c.assigned_block || "",
        created_on: normalizeDateStr(c.created_on) || row.created_on,
        victims, accused, witnesses,
        tags: [],
        proofs: [],
        attachments: files.map(f => f.file_name),
        logs
      });
    } finally {
      setBusy(false);
    }
  };

  const closeCase = () => { setOpen(false); setDetail(null); };

  useEffect(() => { fetchList(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = rows.filter((c) => {
      const text = (c.complaint_id + c.title + c.category + c.subcategory + c.assigned_block).toLowerCase();
      const ok = filter === "ALL" ? true : String(c.status).toLowerCase() === String(filter).toLowerCase().replace(" ", "_");
      return text.includes(q) && ok;
    });
    const cmpDate = (a, b) => new Date(a.created_on) - new Date(b.created_on);
    const cmpType = (a, b) => (a.category + a.subcategory).localeCompare(b.category + b.subcategory);
    const cmpStatus = (a, b) => String(a.status).localeCompare(String(b.status));
    switch (sortBy) {
      case "OLDEST": r.sort(cmpDate); break;
      case "TYPE": r.sort(cmpType); break;
      case "STATUS": r.sort(cmpStatus); break;
      case "NEWEST":
      default: r.sort((a, b) => cmpDate(b, a)); break;
    }
    return r;
  }, [rows, query, filter, sortBy]);

  const exportTablePDF = async () => {
    const doc = new jsPDF({ unit: "pt" });
    doc.setFontSize(16);
    doc.text("Complaint History", 40, 40);
    autoTable(doc, {
      head: [["ID", "Title", "Category", "Subcategory", "Severity", "Status", "Block", "Created On"]],
      body: filtered.map((c) => [
        c.complaint_id, c.title || "—", c.category || "—", c.subcategory || "—",
        c.severity || "—", c.status || "—", c.assigned_block || "—",
        c.created_on ? new Date(c.created_on).toLocaleString() : "—"
      ]),
      startY: 60,
      styles: { fontSize: 10, halign: "left" },
      headStyles: { fillColor: [37, 99, 235] },
      theme: "striped",
      margin: { left: 40, right: 40 }
    });
    doc.save("complaints-history.pdf");
  };

  const handleExportCase = () => exportCasePDF(panelRef, detail || sel);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeCase(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <StudentLayout>
      <div className="sthis-wrap">
        <div className="sthis-card">
          <h2 className="sthis-heading"><span className="emoji">📜</span> Complaint History</h2>

          <div className="sthis-toolbar" role="region" aria-label="Search and filters">
            <div className="sthis-search">
              <input
                type="text"
                placeholder="Search by ID, Title, Category, Block…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search complaints"
              />
              {query && <button className="sthis-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>}
            </div>

            <div className="sthis-tools">
              <div className="sthis-chips" role="tablist" aria-label="Filter by status">
                {["ALL", "Submitted", "In Review", "In Progress", "Resolved", "Rejected"].map((s) => (
                  <button key={s} role="tab" className={`sthis-chip ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>{s}</button>
                ))}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sthis-select" aria-label="Sort by">
                <option value="NEWEST">Newest</option>
                <option value="OLDEST">Oldest</option>
                <option value="TYPE">Type (A–Z)</option>
                <option value="STATUS">Status (A–Z)</option>
              </select>
              <button className="sthis-export" onClick={exportTablePDF} title="Export table to PDF">⬇️ Export PDF</button>
            </div>
          </div>

          {loading ? (
            <div className="skeleton-list"><div className="skeleton-row" /><div className="skeleton-row" /><div className="skeleton-row" /></div>
          ) : filtered.length ? (
            <>
              <div className="sthis-tablewrap" ref={tableRef}>
                <table className="sthis-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>TITLE</th>
                      <th>CATEGORY</th>
                      <th>SUBCATEGORY</th>
                      <th>SEVERITY</th>
                      <th>STATUS</th>
                      <th>BLOCK</th>
                      <th>CREATED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.complaint_id} tabIndex={0} onClick={() => openCase(c)} onKeyDown={(e) => e.key === "Enter" && openCase(c)}>
                        <td className="id">{c.complaint_id}</td>
                        <td className="title">{c.title || "—"}</td>
                        <td>{c.category || "—"}</td>
                        <td>{c.subcategory || "—"}</td>
                        <td>{c.severity || "—"}</td>
                        <td><span className={`sthis-pill ${tone(c.status)}`}>{c.status}</span></td>
                        <td>{c.assigned_block || "—"}</td>
                        <td>{c.created_on ? new Date(c.created_on).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sthis-cards">
                {filtered.map((c) => (
                  <button key={`${c.complaint_id}-card`} className="sthis-cardrow" onClick={() => openCase(c)}>
                    <div className="r"><span className="l">ID</span><span>{c.complaint_id}</span></div>
                    <div className="r"><span className="l">Title</span><span>{c.title || "—"}</span></div>
                    <div className="r"><span className="l">Category</span><span>{[c.category, c.subcategory].filter(Boolean).join(" › ") || "—"}</span></div>
                    <div className="r"><span className="l">Severity</span><span>{c.severity || "—"}</span></div>
                    <div className="r"><span className="l">Status</span><span className={`sthis-pill ${tone(c.status)}`}>{c.status}</span></div>
                    <div className="r"><span className="l">Block</span><span>{c.assigned_block || "—"}</span></div>
                    <div className="r"><span className="l">Created</span><span>{c.created_on ? new Date(c.created_on).toLocaleString() : "—"}</span></div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="sthis-empty" role="status" aria-live="polite">😕 No matching complaints found</div>
          )}
        </div>
      </div>

      {open && (sel || detail) && (
        <div className="sthis-modal show" onClick={closeCase}>
          <div className="sthis-panel" onClick={(e) => e.stopPropagation()} ref={panelRef}>
            <div className="sthis-head">
              <div>
                <h3 className="sthis-title">{detail?.title || sel?.title || "Complaint"}</h3>
                <div className="sthis-subid">{detail?.complaint_id || sel?.complaint_id}</div>
              </div>
              <div className="sthis-head-actions">
                <button className="sthis-export" onClick={handleExportCase} title="Export this case to PDF">⬇️ Export Case</button>
                <button className="sthis-x" aria-label="Close" onClick={closeCase}>✕</button>
              </div>
            </div>

            <div className="sthis-sections">
              <section className="sthis-sec">
                <h4>Overview</h4>
                <div className="sthis-grid">
                  <RO label="Status" value={detail?.status || sel?.status || "—"} />
                  <RO label="Severity" value={detail?.severity || sel?.severity || "—"} />
                  <RO label="Category" value={([detail?.category, detail?.subcategory].filter(Boolean).join(" › ")) || ([sel?.category, sel?.subcategory].filter(Boolean).join(" › ")) || "—"} />
                  <RO label="Block" value={detail?.assigned_block || sel?.assigned_block || "—"} />
                  <RO label="Created" value={(detail?.created_on || sel?.created_on) ? new Date(detail?.created_on || sel?.created_on).toLocaleString() : "—"} />
                </div>
                <ROarea label="Description" value={detail?.description || "—"} />
              </section>

              <section className="sthis-sec">
                <h4>People</h4>
                <People label="Victims" items={detail?.victims || []} />
                <People label="Accused" items={detail?.accused || []} />
                <People label="Witnesses" items={detail?.witnesses || []} />
              </section>

              <section className="sthis-sec">
                <h4>Attachments</h4>
                <div className="sthis-files">
                  {(detail?.attachments || []).length
                    ? detail.attachments.map((f, i) => <span key={`a-${i}`} className="sthis-file">{f}</span>)
                    : <span className="sthis-muted">No attachments</span>}
                </div>
              </section>

              <section className="sthis-sec">
                <h4>Activity</h4>
                <ul className="sthis-people">
                  {(detail?.logs || []).map((l) => (
                    <li key={l.log_id} className="sthis-person">
                      <div className="line">
                        <b>{l.action}</b>
                        <span className="sthis-tag">{l.status_after}</span>
                        <span className="sthis-tag">{new Date(l.created_on).toLocaleString()}</span>
                      </div>
                      {l.notes && <div className="note">{l.notes}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {busy && <div className="busy">Loading…</div>}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}

function RO({ label, value, className }) {
  return (
    <div className={`sthis-ro ${className || ""}`}>
      <label>{label}</label>
      <div className="v">{value}</div>
    </div>
  );
}
function ROarea({ label, value }) {
  return (
    <label className="sthis-roarea">
      {label}
      <div className="v">{value}</div>
    </label>
  );
}
function People({ label, items = [] }) {
  return (
    <>
      <h5 className="sthis-subsec">{label}</h5>
      {items?.length ? (
        <ul className="sthis-people">
          {items.map((p, i) => (
            <li key={`${label}-${i}`} className="sthis-person">
              <div className="line">
                <b>{p.name || "—"}</b>
                {p.role && <span className="sthis-tag">{String(p.role).toUpperCase()}</span>}
                {p.reg && <span className="sthis-tag">{p.reg}</span>}
                {p.id && <span className="sthis-tag">{p.id}</span>}
                {p.contact && <span className="sthis-tag">{p.contact}</span>}
              </div>
              {p.description && <div className="note">{p.description}</div>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="sthis-muted">None</div>
      )}
    </>
  );
}
