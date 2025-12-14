import React, { useState } from "react";
import "../assets/styles/wardenreport.css";
import WardenLayout from "../layouts/WardenLayout";

/* ---------- helpers ---------- */
const p2 = (n) => String(n).padStart(2, "0");
const nowLocalStamp = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};
const forDateTimeLocal = (d = new Date()) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
const makeId = () => {
  const d = new Date();
  return `WRD-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;
};

/* ---------- TEMP: hard-coded warden profile (swap with API later) ---------- */
const wardenProfile = {
  id: "WRD-102",
  name: "Ms. Kavya Menon",
  hostel: "MH - Block D",
  designation: "Hostel Warden",
  contact: "+91 93333 22222",
  // email: "kavya.menon@vit.ac.in",
};

/* ---------- row factories ---------- */
const emptyVictim  = () => ({ name: "", reg: "", contact: "", description: "" });
const emptyWitness = () => ({ name: "", reg: "", contact: "", description: "" });
const emptyAccused = () => ({ name: "", id: "", contact: "", description: "" });

/* ---------- initial form (place & tags removed) ---------- */
const initialForm = () => ({
  reportId: makeId(),
  createdAt: nowLocalStamp(),
  filedByRole: "Warden",

  /* locked warden fields */
  wardenId: wardenProfile.id,
  wardenName: wardenProfile.name,
  wardenHostel: wardenProfile.hostel,
  wardenDesignation: wardenProfile.designation,
  wardenContact: wardenProfile.contact,

  /* incident */
  category: "",
  subcategory: "",
  dt: forDateTimeLocal(new Date()),
  priority: "",
  title: "",
  detail: "",

  /* misc (tags removed) */
  impactScope: "single",
  followUpDate: "",
  attachments: [],
  notify: { warden: false, hod: false, security: false, admin: false },
  actionType: "",
  actionNotes: "",
});

export default function WardenReporting() {
  const [form, setForm] = useState(initialForm());

  /* people sections */
  const [victims,   setVictims]   = useState([emptyVictim()]); // keep at least one
  const [witnesses, setWitnesses] = useState([]);              // hidden until added
  const [accused,   setAccused]   = useState([]);              // hidden until added

  const subTypes = {
    maintenance: ["Electricity", "Water", "Plumbing", "AC", "Wi-Fi", "Other"],
    safety: ["Security", "Harassment", "Ragging", "Theft", "Violence", "Suspicious"],
    food: ["Quality", "Hygiene", "Quantity", "Timings", "Staff Behaviour"],
    academics: ["Attendance", "Exam", "Evaluation", "Course", "Faculty Concern"],
    other: ["Misconduct", "Noise", "General"],
  };

  /* ---------- change handlers ---------- */
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

  /* ---------- row helpers ---------- */
  const updateRow = (setter) => (i, key, val) =>
    setter((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  // Victims: keep at least one
  const updateVictim  = updateRow(setVictims);
  const removeVictim  = (i) => setVictims((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  const addVictim     = () => setVictims((rows) => [...rows, emptyVictim()]);

  // Witnesses: can go to empty -> section hides
  const updateWitness = updateRow(setWitnesses);
  const removeWitness = (i) => setWitnesses((rows) => rows.filter((_, idx) => idx !== i));
  const addWitness    = () => setWitnesses((rows) => (rows.length ? [...rows, emptyWitness()] : [emptyWitness()]));

  // Accused: can go to empty -> section hides
  const updateAccused = updateRow(setAccused);
  const removeAccused = (i) => setAccused((rows) => rows.filter((_, idx) => idx !== i));
  const addAccused    = () => setAccused((rows) => (rows.length ? [...rows, emptyAccused()] : [emptyAccused()]));

  /* ---------- reset ---------- */
  const resetAll = () => {
    setForm(initialForm());
    setVictims([emptyVictim()]);
    setWitnesses([]);
    setAccused([]);
  };

  /* ---------- validation ---------- */
  const validate = () => {
    const errs = [];
    if (!form.wardenId || !form.wardenName) errs.push("Warden profile");
    if (!form.category) errs.push("Category");
    if (!form.priority) errs.push("Priority");
    if (!form.title.trim()) errs.push("Title");
    if ((form.detail || "").trim().length < 24) errs.push("Detailed Description (min 24 chars)");
    return errs;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      alert("Please complete: " + errs.join(", "));
      return;
    }
    const payload = { ...form, victims, witnesses, accused };
    console.log(payload);
    alert("Warden report submitted (mock). See console.");
    resetAll();
  };

  return (
    <WardenLayout>
      <div className="wdr-page">
        <header className="wdr-header">
          <h1 className="wdr-title">Warden — File New Report</h1>
          <p className="wdr-sub">Single warden-entry form. Add witnesses/accused only if applicable.</p>
        </header>

        <form className="wdr-form" onSubmit={submit}>
          {/* header info */}
          <div className="wdr-grid">
            <div className="wdr-field">
              <label>Report ID</label>
              <input className="wdr-locked" name="reportId" value={form.reportId} readOnly />
            </div>
            <div className="wdr-field">
              <label>Created At</label>
              <input className="wdr-locked" name="createdAt" value={form.createdAt} readOnly />
            </div>
            <div className="wdr-field">
              <label>Filed By</label>
              <input className="wdr-locked" name="filedByRole" value={form.filedByRole} readOnly />
            </div>
          </div>

          {/* warden (LOCKED) */}
          <h3 className="wdr-h3">Warden Details</h3>
          <div className="wdr-grid">
            <div className="wdr-field"><label>Warden ID</label><input className="wdr-locked" value={form.wardenId} readOnly /></div>
            <div className="wdr-field"><label>Warden Name</label><input className="wdr-locked" value={form.wardenName} readOnly /></div>
            <div className="wdr-field"><label>Hostel / Block</label><input className="wdr-locked" value={form.wardenHostel} readOnly /></div>
            <div className="wdr-field"><label>Designation</label><input className="wdr-locked" value={form.wardenDesignation} readOnly /></div>
            <div className="wdr-field"><label>Contact</label><input className="wdr-locked" value={form.wardenContact} readOnly /></div>
            {/* <div className="wdr-field"><label>Email</label><input className="wdr-locked" value={wardenProfile.email} readOnly /></div> */}
          </div>

          {/* incident */}
          <h3 className="wdr-h3">Incident Details</h3>
          <div className="wdr-grid">
            <div className="wdr-field">
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
            <div className="wdr-field">
              <label>Subcategory</label>
              <select name="subcategory" value={form.subcategory} onChange={onChange} disabled={!form.category}>
                <option value="">— Select —</option>
                {(subTypes[form.category] || []).map((s) => (
                  <option key={s} value={s.toLowerCase()}>{s}</option>
                ))}
              </select>
            </div>
            <div className="wdr-field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={onChange} required>
                <option value="">— Select Priority —</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="wdr-field">
              <label>Date & Time of Incident</label>
              <input type="datetime-local" name="dt" value={form.dt} onChange={onChange} required />
            </div>
          </div>

          {/* content */}
          <h3 className="wdr-h3">Report Content</h3>
          <div className="wdr-grid">
            <div className="wdr-field wdr-span-12">
              <label>Title</label>
              <input name="title" value={form.title} onChange={onChange} placeholder="Short subject" required />
            </div>
            <div className="wdr-field wdr-span-12">
              <label>Detailed Description</label>
              <textarea
                name="detail"
                rows={6}
                value={form.detail}
                onChange={onChange}
                placeholder="Describe what happened, action taken, people/rooms involved, vehicle plate, etc."
                required
              />
            </div>
          </div>

          {/* victims */}
          <h3 className="wdr-h3">Victim Details</h3>
          <div className="wdr-people">
            {victims.map((v, i) => (
              <div className="wdr-block" key={`victim-${i}`}>
                <div className="wdr-row">
                  <input className="wdr-mini" placeholder="Name" value={v.name} onChange={(e) => updateVictim(i, "name", e.target.value)} />
                  <input className="wdr-mini" placeholder="Reg/ID" value={v.reg} onChange={(e) => updateVictim(i, "reg", e.target.value)} />
                  <input className="wdr-mini" placeholder="Contact" value={v.contact} onChange={(e) => updateVictim(i, "contact", e.target.value)} />
                  <button type="button" className="wdr-mini-btn wdr-mini-remove" onClick={() => removeVictim(i)} disabled={victims.length === 1}>✖</button>
                </div>
                <textarea className="wdr-desc" rows={2} placeholder="Short note" value={v.description} onChange={(e) => updateVictim(i, "description", e.target.value)} />
              </div>
            ))}
            <br />
            <button type="button" className="wdr-mini-btn wdr-mini-add" onClick={addVictim}>+ Add Victim</button>
          </div>

          {/* witnesses */}
          <div className="wdr-h3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Witness Details</span>
            {!witnesses.length ? (
              <button type="button" className="wdr-mini-btn wdr-mini-add" onClick={addWitness}>
                + Add Witness
              </button>
            ) : (
              <button type="button" className="wdr-btn wdr-btn--ghost wdr-btn--sm" onClick={() => setWitnesses([])}>
                Hide Witness Section
              </button>
            )}
          </div>
          {witnesses.length > 0 && (
            <div className="wdr-people">
              {witnesses.map((w, i) => (
                <div className="wdr-block" key={`witness-${i}`}>
                  <div className="wdr-row">
                    <input className="wdr-mini" placeholder="Name" value={w.name} onChange={(e) => updateWitness(i, "name", e.target.value)} />
                    <input className="wdr-mini" placeholder="Reg/ID (optional)" value={w.reg} onChange={(e) => updateWitness(i, "reg", e.target.value)} />
                    <input className="wdr-mini" placeholder="Contact" value={w.contact} onChange={(e) => updateWitness(i, "contact", e.target.value)} />
                    <button type="button" className="wdr-mini-btn wdr-mini-remove" onClick={() => removeWitness(i)}>✖</button>
                  </div>
                  <textarea className="wdr-desc" rows={2} placeholder="Short note" value={w.description} onChange={(e) => updateWitness(i, "description", e.target.value)} />
                </div>
              ))}
              <br />
              <button type="button" className="wdr-mini-btn wdr-mini-add" onClick={addWitness}>+ Add Another Witness</button>
            </div>
          )}

          {/* accused */}
          <div className="wdr-h3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Accused Details</span>
            {!accused.length ? (
              <button type="button" className="wdr-mini-btn wdr-mini-add" onClick={addAccused}>
                + Add Accused
              </button>
            ) : (
              <button type="button" className="wdr-btn wdr-btn--ghost wdr-btn--sm" onClick={() => setAccused([])}>
                Hide Accused Section
              </button>
            )}
          </div>
          {accused.length > 0 && (
            <div className="wdr-people">
              {accused.map((a, i) => (
                <div className="wdr-block" key={`accused-${i}`}>
                  <div className="wdr-row">
                    <input className="wdr-mini" placeholder="Name" value={a.name} onChange={(e) => updateAccused(i, "name", e.target.value)} />
                    <input className="wdr-mini" placeholder="Reg/Staff ID" value={a.id} onChange={(e) => updateAccused(i, "id", e.target.value)} />
                    <input className="wdr-mini" placeholder="Contact" value={a.contact} onChange={(e) => updateAccused(i, "contact", e.target.value)} />
                    <button type="button" className="wdr-mini-btn wdr-mini-remove" onClick={() => removeAccused(i)}>✖</button>
                  </div>
                  <textarea className="wdr-desc" rows={2} placeholder="Short note" value={a.description} onChange={(e) => updateAccused(i, "description", e.target.value)} />
                </div>
              ))}
              <br />
              <button type="button" className="wdr-mini-btn wdr-mini-add" onClick={addAccused}>+ Add Another Accused</button>
            </div>
          )}

          {/* attachments */}
          <h3 className="wdr-h3">Attachments</h3>
          <div className="wdr-grid">
            <div className="wdr-field wdr-span-12">
              <label>Upload Files<h5>(*attach all files at a time*)</h5>
              <h5>***format:- VIT_ID_filename.filetype***</h5></label>
              <input
                type="file"
                name="attachments"
                multiple
                onChange={onChange}
                accept="image/*,video/*,.pdf,audio/*,.doc,.docx"
              />
              {!!form.attachments.length && (
                <div className="wdr-filechips">
                  {form.attachments.map((f, i) => <span className="wdr-chip" key={i}>{f.name}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* actions */}
          <div className="wdr-buttons wdr-stagger">
            <button
              type="button"
              className="wdr-btn wdr-btn--ghost"
              onClick={resetAll}
              title="Clear all fields and start fresh"
            >
              Reset
            </button>
            <button type="submit" className="wdr-btn wdr-btn--primary">
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </WardenLayout>
  );
}
