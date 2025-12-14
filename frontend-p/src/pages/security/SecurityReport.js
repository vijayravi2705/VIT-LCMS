// src/pages/SecurityReporting.jsx
import React, { useState } from "react";
import "../assets/styles/securityreport.css";   // ✅ security CSS (ser- classes)
import SecurityLayout from "../layouts/SecurityLayout"; // ✅ correct layout

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
  return `SEC-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`; // ✅ SEC-
};

/* ---------- TEMP: hard-coded security profile (swap with API later) ---------- */
const securityProfile = {
  id: "SEC-0098",
  name: "Officer A. Kumar",
  post: "Main Gate Unit",
  contact: "+91 90000 11111",
  // email: "a.kumar@vit.ac.in",
};

/* ---------- row factories ---------- */
const emptyVictim  = () => ({ name: "", reg: "", contact: "", description: "" });
const emptyWitness = () => ({ name: "", reg: "", contact: "", description: "" });
const emptyAccused = () => ({ name: "", id: "", contact: "", description: "" });

/* ---------- initial form (place & tags removed) ---------- */
const initialForm = () => ({
  reportId: makeId(),
  createdAt: nowLocalStamp(),
  filedByRole: "Security",

  /* locked security fields */
  securityId: securityProfile.id,
  securityName: securityProfile.name,
  securityPost: securityProfile.post,
  securityContact: securityProfile.contact,

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

export default function SecurityReporting() {
  const [form, setForm] = useState(initialForm());

  /* people sections */
  const [victims,   setVictims]   = useState([emptyVictim()]); // at least one
  const [witnesses, setWitnesses] = useState([]);              // hidden until added
  const [accused,   setAccused]   = useState([]);              // hidden until added

  const subTypes = {
    safety:      ["Security Breach", "Ragging", "Harassment", "Violence", "Trespass", "Suspicious", "Curfew Violation"],
    maintenance: ["Electricity", "Water", "Plumbing", "AC", "Wi-Fi", "Other"],
    fire:        ["Small Fire", "Alarm Trigger", "Drill Incident", "Other"],
    medical:     ["Injury", "Unconscious", "Overdose/Suspected", "Other"],
    other:       ["Noise", "Crowd", "General"],
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

  // Witnesses: can be empty -> section hides
  const updateWitness = updateRow(setWitnesses);
  const removeWitness = (i) => setWitnesses((rows) => rows.filter((_, idx) => idx !== i));
  const addWitness    = () => setWitnesses((rows) => (rows.length ? [...rows, emptyWitness()] : [emptyWitness()]));

  // Accused: can be empty -> section hides
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
    // locked security fields (just a sanity check)
    if (!form.securityId || !form.securityName) errs.push("Security profile");
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
    alert("Security report submitted (mock). See console.");
    resetAll();
  };

  return (
    <SecurityLayout>
      <div className="ser-page">
        <header className="ser-header">
          <h1 className="ser-title">Security — File New Report</h1>
          <p className="ser-sub">Single security-entry form. Add witnesses/accused only if applicable.</p>
        </header>

        <form className="ser-form" onSubmit={submit}>
          {/* header info */}
          <div className="ser-grid">
            <div className="ser-field">
              <label>Report ID</label>
              <input className="ser-locked" name="reportId" value={form.reportId} readOnly />
            </div>
            <div className="ser-field">
              <label>Created At</label>
              <input className="ser-locked" name="createdAt" value={form.createdAt} readOnly />
            </div>
            <div className="ser-field">
              <label>Filed By</label>
              <input className="ser-locked" name="filedByRole" value={form.filedByRole} readOnly />
            </div>
          </div>

          {/* security (LOCKED) */}
          <h3 className="ser-h3">Security Details</h3>
          <div className="ser-grid">
            <div className="ser-field"><label>Security ID</label><input className="ser-locked" value={form.securityId} readOnly /></div>
            <div className="ser-field"><label>Security Name</label><input className="ser-locked" value={form.securityName} readOnly /></div>
            <div className="ser-field"><label>Post / Unit</label><input className="ser-locked" value={form.securityPost} readOnly /></div>
            <div className="ser-field"><label>Contact</label><input className="ser-locked" value={form.securityContact} readOnly /></div>
            {/* <div className="ser-field"><label>Email</label><input className="ser-locked" value={securityProfile.email} readOnly /></div> */}
          </div>

          {/* incident */}
          <h3 className="ser-h3">Incident Details</h3>
          <div className="ser-grid">
            <div className="ser-field">
              <label>Category</label>
              <select name="category" value={form.category} onChange={onChange} required>
                <option value="">— Select —</option>
                <option value="safety">Safety &amp; Discipline</option>
                <option value="maintenance">Maintenance</option>
                <option value="fire">Fire / Alarm</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="ser-field">
              <label>Subcategory</label>
              <select name="subcategory" value={form.subcategory} onChange={onChange} disabled={!form.category}>
                <option value="">— Select —</option>
                {(subTypes[form.category] || []).map((s) => (
                  <option key={s} value={s.toLowerCase()}>{s}</option>
                ))}
              </select>
            </div>
            <div className="ser-field">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={onChange} required>
                <option value="">— Select Priority —</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div className="ser-field">
              <label>Date &amp; Time of Incident</label>
              <input type="datetime-local" name="dt" value={form.dt} onChange={onChange} required />
            </div>
            {/* Place removed to match Faculty minimal form */}
          </div>

          {/* content */}
          <h3 className="ser-h3">Report Content</h3>
          <div className="ser-grid">
            <div className="ser-field ser-span-12">
              <label>Title</label>
              <input name="title" value={form.title} onChange={onChange} placeholder="Short subject" required />
            </div>
            <div className="ser-field ser-span-12">
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

          {/* victims (visible by default) */}
          <h3 className="ser-h3">Victim Details</h3>
          <div className="ser-people">
            {victims.map((v, i) => (
              <div className="ser-block" key={`victim-${i}`}>
                <div className="ser-row">
                  <input className="ser-mini" placeholder="Name" value={v.name} onChange={(e) => updateVictim(i, "name", e.target.value)} />
                  <input className="ser-mini" placeholder="Reg/ID" value={v.reg} onChange={(e) => updateVictim(i, "reg", e.target.value)} />
                  <input className="ser-mini" placeholder="Contact" value={v.contact} onChange={(e) => updateVictim(i, "contact", e.target.value)} />
                  <button type="button" className="ser-mini-btn ser-mini-remove" onClick={() => removeVictim(i)} disabled={victims.length === 1}>✖</button>
                </div>
                <textarea className="ser-desc" rows={2} placeholder="Short note" value={v.description} onChange={(e) => updateVictim(i, "description", e.target.value)} />
              </div>
            ))}
            <br />
            <button type="button" className="ser-mini-btn ser-mini-add" onClick={addVictim}>+ Add Victim</button>
          </div>

          {/* witnesses */}
          <div className="ser-h3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Witness Details</span>
            {!witnesses.length ? (
              <button type="button" className="ser-mini-btn ser-mini-add" onClick={addWitness}>
                + Add Witness
              </button>
            ) : (
              <button type="button" className="ser-btn ser-btn--ghost ser-btn--sm" onClick={() => setWitnesses([])}>
                Hide Witness Section
              </button>
            )}
          </div>
          {witnesses.length > 0 && (
            <div className="ser-people">
              {witnesses.map((w, i) => (
                <div className="ser-block" key={`witness-${i}`}>
                  <div className="ser-row">
                    <input className="ser-mini" placeholder="Name" value={w.name} onChange={(e) => updateWitness(i, "name", e.target.value)} />
                    <input className="ser-mini" placeholder="Reg/ID (optional)" value={w.reg} onChange={(e) => updateWitness(i, "reg", e.target.value)} />
                    <input className="ser-mini" placeholder="Contact" value={w.contact} onChange={(e) => updateWitness(i, "contact", e.target.value)} />
                    <button type="button" className="ser-mini-btn ser-mini-remove" onClick={() => removeWitness(i)}>✖</button>
                  </div>
                  <textarea className="ser-desc" rows={2} placeholder="Short note" value={w.description} onChange={(e) => updateWitness(i, "description", e.target.value)} />
                </div>
              ))}
              <br />
              <button type="button" className="ser-mini-btn ser-mini-add" onClick={addWitness}>+ Add Another Witness</button>
            </div>
          )}

          {/* accused */}
          <div className="ser-h3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Accused Details</span>
            {!accused.length ? (
              <button type="button" className="ser-mini-btn ser-mini-add" onClick={addAccused}>
                + Add Accused
              </button>
            ) : (
              <button type="button" className="ser-btn ser-btn--ghost ser-btn--sm" onClick={() => setAccused([])}>
                Hide Accused Section
              </button>
            )}
          </div>
          {accused.length > 0 && (
            <div className="ser-people">
              {accused.map((a, i) => (
                <div className="ser-block" key={`accused-${i}`}>
                  <div className="ser-row">
                    <input className="ser-mini" placeholder="Name" value={a.name} onChange={(e) => updateAccused(i, "name", e.target.value)} />
                    <input className="ser-mini" placeholder="Reg/Staff ID" value={a.id} onChange={(e) => updateAccused(i, "id", e.target.value)} />
                    <input className="ser-mini" placeholder="Contact" value={a.contact} onChange={(e) => updateAccused(i, "contact", e.target.value)} />
                    <button type="button" className="ser-mini-btn ser-mini-remove" onClick={() => removeAccused(i)}>✖</button>
                  </div>
                  <textarea className="ser-desc" rows={2} placeholder="Short note" value={a.description} onChange={(e) => updateAccused(i, "description", e.target.value)} />
                </div>
              ))}
              <br />
              <button type="button" className="ser-mini-btn ser-mini-add" onClick={addAccused}>+ Add Another Accused</button>
            </div>
          )}

          {/* attachments */}
          <h3 className="ser-h3">Attachments</h3>
          <div className="ser-grid">
            <div className="ser-field ser-span-12">
              <label>Upload Files</label>
              <input
                type="file"
                name="attachments"
                multiple
                onChange={onChange}
                accept="image/*,video/*,.pdf,audio/*,.doc,.docx"
              />
              {!!form.attachments.length && (
                <div className="ser-filechips">
                  {form.attachments.map((f, i) => <span className="ser-chip" key={i}>{f.name}</span>)}
                </div>
              )}
            </div>
          </div>

          {/* actions */}
          <div className="ser-buttons">
            <button type="button" className="ser-btn ser-btn--ghost" onClick={resetAll}>Reset</button>
            <button type="submit" className="ser-btn ser-btn--primary">Submit Report</button>
          </div>
        </form>
      </div>
    </SecurityLayout>
  );
}
