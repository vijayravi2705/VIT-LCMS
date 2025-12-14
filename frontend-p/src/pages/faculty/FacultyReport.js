// src/pages/FacultyComplaint.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../assets/styles/facultyreport.css";
import FacultyLayout from "../layouts/FacultyLayout";
import api from "../../utils/api";

const p2 = (n) => String(n).padStart(2, "0");
const nowLocalStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
const forDateTimeLocal = (d = new Date()) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const makeId = () => {
  const d = new Date();
  return `FAC-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;
};

const emptyVictim = () => ({ name: "", reg: "", contact: "", description: "" });
const emptyWitness = () => ({ name: "", reg: "", contact: "", description: "" });
const emptyAccused = () => ({ name: "", id: "", contact: "", description: "" });

const buildInitialForm = (fp) => ({
  reportId: makeId(),
  createdAt: nowLocalStamp(),
  filedByRole: "Faculty",
  facultyId: fp.id || "",
  facultyName: fp.name || "",
  facultyDept: fp.dept || "",
  facultyDesignation: fp.designation || "",
  facultyContact: fp.contact || "",
  category: "",
  subcategory: "",
  dt: forDateTimeLocal(new Date()),
  priority: "",
  title: "",
  detail: "",
  impactScope: "single",
  followUpDate: "",
  attachments: [],
  notify: { warden: false, hod: false, security: false, admin: false },
  actionType: "",
  actionNotes: "",
});

export default function FacultyComplaint() {
  const boot = useMemo(
    () => ({
      id: localStorage.getItem("vitId") || "",
      name: localStorage.getItem("username") || "",
    }),
    []
  );

  const [profile, setProfile] = useState({
    id: boot.id,
    name: boot.name,
    dept: "",
    designation: "",
    contact: "",
  });
  const [form, setForm] = useState(buildInitialForm({ id: boot.id, name: boot.name }));
  const [victims, setVictims] = useState([emptyVictim()]);
  const [witnesses, setWitnesses] = useState([]);
  const [accused, setAccused] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get("/faculty/profile");
        if (!alive) return;
        const p = data?.profile || {};
        const fp = {
          id: p.vit_id || localStorage.getItem("vitId") || "",
          name: p.full_name || localStorage.getItem("username") || "",
          dept: p.department || "",
          designation: p.designation || "",
          contact: p.phone || "",
        };
        if (fp.id) localStorage.setItem("vitId", fp.id);
        if (fp.name) localStorage.setItem("username", fp.name);
        setProfile(fp);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setForm(buildInitialForm(profile));
  }, [profile.id, profile.name, profile.dept, profile.designation, profile.contact]);

  const subTypes = {
    maintenance: ["Electricity", "Water", "Plumbing", "AC", "Wi-Fi", "Other"],
    safety: ["Security", "Harassment", "Ragging", "Theft", "Violence", "Suspicious"],
    food: ["Quality", "Hygiene", "Quantity", "Timings", "Staff Behaviour"],
    academics: ["Attendance", "Exam", "Evaluation", "Course", "Faculty Concern"],
    other: ["Misconduct", "Noise", "General"],
  };

  const onChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "attachments" && files) {
      setForm((s) => ({ ...s, attachments: Array.from(files) }));
      return;
    }
    if (name?.startsWith("notify.")) {
      const key = name.split(".")[1];
      setForm((s) => ({ ...s, notify: { ...s.notify, [key]: checked } }));
      return;
    }
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const updateRow = (setter) => (i, key, val) => setter((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const updateVictim = updateRow(setVictims);
  const removeVictim = (i) => setVictims((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  const addVictim = () => setVictims((rows) => [...rows, emptyVictim()]);
  const updateWitness = updateRow(setWitnesses);
  const removeWitness = (i) => setWitnesses((rows) => rows.filter((_, idx) => idx !== i));
  const addWitness = () => setWitnesses((rows) => (rows.length ? [...rows, emptyWitness()] : [emptyWitness()]));
  const updateAccused = updateRow(setAccused);
  const removeAccused = (i) => setAccused((rows) => rows.filter((_, idx) => idx !== i));
  const addAccused = () => setAccused((rows) => (rows.length ? [...rows, emptyAccused()] : [emptyAccused()]));

  const validate = () => {
    const errs = [];
    if (!form.facultyId || !form.facultyName) errs.push("Faculty profile");
    if (!form.category) errs.push("Category");
    if (!form.priority) errs.push("Priority");
    if (!form.title.trim()) errs.push("Title");
    if ((form.detail || "").trim().length < 24) errs.push("Detailed Description (min 24 chars)");
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validate();
    if (errs.length) { alert("Please complete: " + errs.join(", ")); return; }
    setSubmitting(true);

    const vitId = localStorage.getItem("vitId") || form.facultyId;

    const parties = [
      ...victims.map((v, i) => ({ vit_id: v.reg || vitId, party_role: "victim", is_primary: i === 0, notes: v.description || null })),
      ...witnesses.map((w) => ({ vit_id: w.reg || "", party_role: "witness", is_primary: false, notes: w.description || null })),
      ...accused.map((a) => ({ vit_id: a.id || "", party_role: "accused", is_primary: false, notes: a.description || null })),
    ];

    const payload = {
      title: form.title,
      description: form.detail,
      severity: form.priority,
      category: form.category,
      subcategory: form.subcategory || null,
      filed_by: "faculty",
      parties,
    };

    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const { data } = await api.post("/complaints", payload, { headers: { "X-Idempotency-Key": key } });
      if (data?.ok) {
        setSuccess({ complaint_id: data.complaint_id, verification_code: data.verification_code });
      } else {
        alert("Submission failed.");
      }
    } catch {
      alert("Server error while submitting. Ensure you are logged in and the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setForm(buildInitialForm(profile));
    setVictims([emptyVictim()]);
    setWitnesses([]);
    setAccused([]);
    setSuccess(null);
    setSubmitting(false);
  };

  const formBlocked = submitting || !!success;

  return (
    <FacultyLayout>
      <div className={`fcx-wrap ${formBlocked ? "is-blocked" : ""}`}>
        <div className="fcx-page">
          <header className="fcx-header">
            <h1 className="fcx-title">Faculty — File New Report</h1>
            <p className="fcx-sub">Single faculty-entry form. Add witnesses/accused only if applicable.</p>
          </header>

          {success && (
            <div className="fcx-success">
              <div className="fcx-success-card">
                <h3>✅ Complaint submitted</h3>
                <p><b>Complaint ID:</b> <span className="mono">{success.complaint_id}</span></p>
                <p><b>Verification Code:</b> <span className="mono">{success.verification_code}</span></p>
                <p className="muted">Email receipt sent to your registered address.</p>
                <div className="fcx-buttons">
                  <button
                    className="fcx-btn fcx-btn--ghost"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Complaint ID: ${success.complaint_id}\nVerification Code: ${success.verification_code}`
                      )
                    }
                  >
                    Copy
                  </button>
                  <button className="fcx-btn fcx-btn--primary" onClick={resetAll}>Close</button>
                </div>
              </div>
            </div>
          )}

          <form className={`fcx-form ${formBlocked ? "fcx-disabled" : ""}`} onSubmit={submit}>
            <div className="fcx-grid">
              <div className="fcx-field"><label>Created At</label><input className="fcx-locked" name="createdAt" value={form.createdAt} readOnly /></div>
              <div className="fcx-field"><label>Filed By</label><input className="fcx-locked" name="filedByRole" value={form.filedByRole} readOnly /></div>
            </div>

            <h3 className="fcx-h3">Faculty Details</h3>
            <div className="fcx-grid">
              <div className="fcx-field"><label>Faculty ID</label><input className="fcx-locked" value={form.facultyId} readOnly /></div>
              <div className="fcx-field"><label>Faculty Name</label><input className="fcx-locked" value={form.facultyName} readOnly /></div>
              <div className="fcx-field"><label>Department</label><input className="fcx-locked" value={form.facultyDept} readOnly /></div>
              <div className="fcx-field"><label>Designation</label><input className="fcx-locked" value={form.facultyDesignation} readOnly /></div>
              <div className="fcx-field"><label>Contact</label><input className="fcx-locked" value={form.facultyContact} readOnly /></div>
            </div>

            <h3 className="fcx-h3">Incident Details</h3>
            <div className="fcx-grid">
              <div className="fcx-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={onChange} required>
                  <option value="">— Select —</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="safety">Safety & Discipline</option>
                  <option value="food">Food & Mess</option>
                  <option value="academics">Academics</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="fcx-field">
                <label>Subcategory</label>
                <select name="subcategory" value={form.subcategory} onChange={onChange} disabled={!form.category}>
                  <option value="">— Select —</option>
                  {(subTypes[form.category] || []).map((s) => (
                    <option key={s} value={s.toLowerCase()}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="fcx-field">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={onChange} required>
                  <option value="">— Select Priority —</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="fcx-field">
                <label>Date & Time of Incident</label>
                <input type="datetime-local" name="dt" value={form.dt} onChange={onChange} required />
              </div>
            </div>

            <h3 className="fcx-h3">Report Content</h3>
            <div className="fcx-grid">
              <div className="fcx-field fcx-span-12">
                <label>Title</label>
                <input name="title" value={form.title} onChange={onChange} placeholder="Short subject" required />
              </div>
              <div className="fcx-field fcx-span-12">
                <label>Detailed Description</label>
                <textarea name="detail" rows={6} value={form.detail} onChange={onChange} placeholder="Describe what happened, action taken, people/rooms involved, etc." required />
              </div>
            </div>

            <h3 className="fcx-h3">Victim Details</h3>
            <div className="fcx-people">
              {victims.map((v, i) => (
                <div className="fcx-block" key={`victim-${i}`}>
                  <div className="fcx-row">
                    <input className="fcx-mini" placeholder="Name" value={v.name} onChange={(e) => updateVictim(i, "name", e.target.value)} />
                    <input className="fcx-mini" placeholder="Reg/ID" value={v.reg} onChange={(e) => updateVictim(i, "reg", e.target.value)} />
                    <input className="fcx-mini" placeholder="Contact" value={v.contact} onChange={(e) => updateVictim(i, "contact", e.target.value)} />
                    <button type="button" className="fcx-mini-btn fcx-mini-remove" onClick={() => removeVictim(i)} disabled={victims.length === 1}>✖</button>
                  </div>
                  <textarea className="fcx-desc" rows={2} placeholder="Short note" value={v.description} onChange={(e) => updateVictim(i, "description", e.target.value)} />
                </div>
              ))}
              <br />
              <button type="button" className="fcx-mini-btn fcx-mini-add" onClick={addVictim}>+ Add Victim</button>
            </div>

            <div className="fcx-h3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Witness Details</span>
              {!witnesses.length ? (
                <button type="button" className="fcx-mini-btn fcx-mini-add" onClick={addWitness}>+ Add Witness</button>
              ) : (
                <button type="button" className="fcx-btn fcx-btn--ghost fcx-btn--sm" onClick={() => setWitnesses([])}>Hide Witness Section</button>
              )}
            </div>
            {witnesses.length > 0 && (
              <div className="fcx-people">
                {witnesses.map((w, i) => (
                  <div className="fcx-block" key={`witness-${i}`}>
                    <div className="fcx-row">
                      <input className="fcx-mini" placeholder="Name" value={w.name} onChange={(e) => updateWitness(i, "name", e.target.value)} />
                      <input className="fcx-mini" placeholder="Reg/ID (optional)" value={w.reg} onChange={(e) => updateWitness(i, "reg", e.target.value)} />
                      <input className="fcx-mini" placeholder="Contact" value={w.contact} onChange={(e) => updateWitness(i, "contact", e.target.value)} />
                      <button type="button" className="fcx-mini-btn fcx-mini-remove" onClick={() => removeWitness(i)}>✖</button>
                    </div>
                    <textarea className="fcx-desc" rows={2} placeholder="Short note" value={w.description} onChange={(e) => updateWitness(i, "description", e.target.value)} />
                  </div>
                ))}
                <br />
                <button type="button" className="fcx-mini-btn fcx-mini-add" onClick={addWitness}>+ Add Another Witness</button>
              </div>
            )}

            <div className="fcx-h3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Accused Details</span>
              {!accused.length ? (
                <button type="button" className="fcx-mini-btn fcx-mini-add" onClick={addAccused}>+ Add Accused</button>
              ) : (
                <button type="button" className="fcx-btn fcx-btn--ghost fcx-btn--sm" onClick={() => setAccused([])}>Hide Accused Section</button>
              )}
            </div>
            {accused.length > 0 && (
              <div className="fcx-people">
                {accused.map((a, i) => (
                  <div className="fcx-block" key={`accused-${i}`}>
                    <div className="fcx-row">
                      <input className="fcx-mini" placeholder="Name" value={a.name} onChange={(e) => updateAccused(i, "name", e.target.value)} />
                      <input className="fcx-mini" placeholder="Reg/Staff ID" value={a.id} onChange={(e) => updateAccused(i, "id", e.target.value)} />
                      <input className="fcx-mini" placeholder="Contact" value={a.contact} onChange={(e) => updateAccused(i, "contact", e.target.value)} />
                      <button type="button" className="fcx-mini-btn fcx-mini-remove" onClick={() => removeAccused(i)}>✖</button>
                    </div>
                    <textarea className="fcx-desc" rows={2} placeholder="Short note" value={a.description} onChange={(e) => updateAccused(i, "description", e.target.value)} />
                  </div>
                ))}
                <br />
                <button type="button" className="fcx-mini-btn fcx-mini-add" onClick={addAccused}>+ Add Another Accused</button>
              </div>
            )}

            <h3 className="fcx-h3">Attachments</h3>
            <div className="fcx-grid">
              <div className="fcx-field fcx-span-12">
                <label>Upload Files<h5>(*attach all files at a time*)</h5><h5>***format:- VIT_ID_filename.filetype***</h5></label>
                <input type="file" name="attachments" multiple onChange={onChange} accept="image/*,video/*,.pdf,audio/*,.doc,.docx" />
                {!!form.attachments.length && (
                  <div className="fcx-filechips">
                    {form.attachments.map((f, i) => <span className="fcx-chip" key={i}>{f.name}</span>)}
                  </div>
                )}
              </div>
            </div>

            <div className="fcx-buttons fcx-stagger">
              <button type="button" className="fcx-btn fcx-btn--ghost" onClick={resetAll} disabled={submitting}>Reset</button>
              <button type="submit" className={`fcx-btn fcx-btn--primary ${submitting ? "is-loading" : ""}`} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FacultyLayout>
  );
}
