import "../assets/styles/StudentComplaint.css";
import StudentLayout from "../layouts/StudentLayout";
import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";

const pad2 = (n) => String(n).padStart(2, "0");
const formatForDateTimeLocal = (d = new Date()) => {
  const yyyy = d.getFullYear(), mm = pad2(d.getMonth() + 1), dd = pad2(d.getDate());
  const hh = pad2(d.getHours()), mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};
const parseLocalDateTime = (s) => {
  if (!s) return null;
  const [datePart, timePart] = s.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mi] = (timePart || "").split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mi || 0, 0, 0);
};
const generateId = ({ hostelType = "MH", hostelBlock = "A", roomNumber = "000", seq = 1, when = new Date() }) => {
  const y = when.getFullYear(), m = pad2(when.getMonth() + 1), d = pad2(when.getDate());
  const hh = pad2(when.getHours()), mm = pad2(when.getMinutes());
  return `${hostelType}-${String(hostelBlock).toUpperCase()}-${roomNumber || "000"}-${y}${m}${d}-${hh}${mm}-${pad2(seq)}`;
};
const getProfile = () => {
  try { const raw = localStorage.getItem("studentProfile"); if (raw) return JSON.parse(raw); } catch {}
  const profile = { hostelType: "MH", hostelBlock: "A", roomNumber: "101", fullName: "NIRMAL", rollNo: "22BEE0326", contact: "+91 9949790005" };
  localStorage.setItem("studentProfile", JSON.stringify(profile));
  return profile;
};

export default function StudentComplaint() {
  const profile = useMemo(getProfile, []);
  const [seq, setSeq] = useState(1);
  const [files, setFiles] = useState([]);
  const [witnesses, setWitnesses] = useState([]);
  const [accusedList, setAccusedList] = useState([]);
  const [isVictimSelf, setIsVictimSelf] = useState(true);
  const [victims, setVictims] = useState([{ name: profile.fullName || "", reg: profile.rollNo || "", contact: profile.contact || "", locked: true }]);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const addVictim = () => setVictims((v) => [...v, { name: "", reg: "", contact: "", locked: false }]);
  const removeVictim = (i) => setVictims((v) => v.filter((_, idx) => idx !== i));
  const updateVictim = (i, key, val) => setVictims((v) => v.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const toggleSelfVictim = (checked) => {
    setIsVictimSelf(checked);
    setVictims((v) => {
      if (checked) {
        const first = { name: profile.fullName || "", reg: profile.rollNo || "", contact: profile.contact || "", locked: true };
        const rest = v.length > 1 ? v.slice(1) : [];
        return [first, ...rest];
      } else {
        if (v.length === 0) return [{ name: "", reg: "", contact: "", locked: false }];
        const [first, ...rest] = v;
        return [{ ...first, locked: false }, ...rest];
      }
    });
  };

  const [formData, setFormData] = useState({
    hostelType: profile.hostelType || "MH",
    hostelBlock: profile.hostelBlock || "",
    roomNumber: profile.roomNumber || "",
    fullName: profile.fullName || "",
    rollNo: profile.rollNo || "",
    contact: profile.contact || "",
    complaintId: "",
    dateTime: formatForDateTimeLocal(new Date()),
    incidentType: "",
    incidentSubType: "",
    incidentDateTime: formatForDateTimeLocal(new Date()),
    priority: "",
    complaintTitle: "",
    detailedDescription: "",
    accusedIdentified: false,
    consentForwardWarden: true,
    consentForwardDiscipline: false,
    consentForwardPolice: false,
    declaration: false,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      complaintId: generateId({
        hostelType: prev.hostelType, hostelBlock: prev.hostelBlock, roomNumber: prev.roomNumber || "000", seq, when: new Date(),
      }),
    }));
  }, [formData.hostelType, formData.hostelBlock, formData.roomNumber, seq]);

  const handleChange = (e) => {
    const { name, value, type, checked, files: f } = e.target;
    if (name === "file" && f) { setFiles(Array.from(f)); return; }
    setFormData((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };

  const addWitness = () => setWitnesses((w) => (w.length ? [...w, { name: "", regNo: "", contact: "" }] : [{ name: "", regNo: "", contact: "" }]));
  const removeWitness = (i) => setWitnesses((w) => w.filter((_, idx) => idx !== i));
  const updateWitness = (i, key, val) => setWitnesses((w) => w.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));
  const addAccused = () => setAccusedList((a) => (a.length ? [...a, { name: "", role: "", id: "", contact: "" }] : [{ name: "", role: "", id: "", contact: "" }]));
  const removeAccused = (i) => setAccusedList((a) => a.filter((_, idx) => idx !== i));
  const updateAccused = (i, key, val) => setAccusedList((a) => a.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  const subTypesMap = {
    maintenance: ["Electricity", "Water", "Plumbing", "AC", "Wi-Fi", "Other"],
    safety: ["Security", "Harassment", "Ragging", "Theft", "Violence", "Suspicious Activity"],
    food: ["Quality", "Hygiene", "Quantity", "Timings", "Staff Behaviour"],
    other: ["Misconduct", "Noise", "General"],
  };

  const validate = () => {
    const errs = [];
    if (!formData.declaration) errs.push("Please confirm the declaration.");
    if (!formData.complaintTitle.trim()) errs.push("Please enter a complaint title.");
    if ((formData.detailedDescription || "").trim().length < 30) errs.push("Detailed description should be at least 30 characters.");
    if (!formData.incidentDateTime) errs.push("Please set the incident date & time.");
    const incident = parseLocalDateTime(formData.incidentDateTime);
    if (incident && incident > new Date()) errs.push("Incident date/time cannot be in the future.");
    if (!formData.incidentType) errs.push("Please select an incident category.");
    if (!formData.priority) errs.push("Please select severity/priority.");
    const anyVictimGood = victims.some((v) => v.name.trim() && v.reg.trim());
    if (!anyVictimGood) errs.push("Please add at least one valid victim (name & reg no).");
    accusedList.forEach((a, idx) => {
      const filled = a.name || a.id || a.contact || a.role || a.description;
      if (filled && !a.role) errs.push(`Accused #${idx + 1}: please select a role.`);
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || success) return;

    const errs = validate();
    if (errs.length) { alert("Fix these before submitting:\n• " + errs.join("\n• ")); return; }
    setSubmitting(true);

    const vitId = localStorage.getItem("vitId") || "";
    const assigned_block = `${formData.hostelType}-${formData.hostelBlock}`;

    const parties = [
      { vit_id: vitId || (victims[0]?.reg || ""), party_role: "victim", is_primary: true, notes: victims[0]?.description || null },
      ...victims.slice(1).map((v) => ({ vit_id: v.reg || "", party_role: "victim", is_primary: false, notes: v.description || null })),
      ...witnesses.map((w) => ({ vit_id: w.regNo || "", party_role: "witness", is_primary: false, notes: w.description || null })),
      ...accusedList.map((a) => ({ vit_id: a.id || "", party_role: "accused", is_primary: false, notes: a.description || null })),
    ];

    const payload = {
      title: formData.complaintTitle,
      description: formData.detailedDescription,
      severity: formData.priority,
      category: formData.incidentType,
      subcategory: formData.incidentSubType || null,
      assigned_block,
      filed_by: "student",
      parties,
    };

    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const { data } = await api.post("/complaints", payload, { headers: { "X-Idempotency-Key": key } });
      if (data?.ok) {
        setSuccess({ complaint_id: data.complaint_id, verification_code: data.verification_code });
        setSeq((n) => Math.min(n + 1, 99));
        setWitnesses([]); setAccusedList([]); setFiles([]);
        setFormData((prev) => ({
          ...prev,
          incidentType: "",
          incidentSubType: "",
          incidentDateTime: formatForDateTimeLocal(new Date()),
          priority: "",
          complaintTitle: "",
          detailedDescription: "",
          accusedIdentified: false,
          declaration: false,
        }));
      } else {
        alert("Submission failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while submitting. Ensure you are logged in and the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (submitting) return;
    setFiles([]); setWitnesses([]); setAccusedList([]);
    setVictims([{ name: profile.fullName || "", reg: profile.rollNo || "", contact: profile.contact || "", locked: true }]);
    setFormData((prev) => ({
      ...prev,
      incidentType: "", incidentSubType: "", incidentDateTime: formatForDateTimeLocal(new Date()),
      incidentPlace: "", priority: "", complaintTitle: "", detailedDescription: "",
      consentForwardWarden: true, consentForwardDiscipline: false, consentForwardPolice: false,
      declaration: false, accusedIdentified: false,
    }));
  };

  const copyIds = async () => {
    if (!success) return;
    try { await navigator.clipboard.writeText(`Complaint ID: ${success.complaint_id}\nVerification Code: ${success.verification_code}`); } catch {}
  };

  const formBlocked = submitting || !!success;

  return (
    <StudentLayout>
      <div className={`complaint-container ${formBlocked ? "is-blocked" : ""}`}>
        <h2 className="complaint-title">📄 File a Complaint</h2>

        {success && (
          <div className="success-modal">
            <div className="success-card">
              <h3>✅ Complaint submitted</h3>
              <p><b>Complaint ID:</b> <span className="mono">{success.complaint_id}</span></p>
              <p><b>Verification Code:</b> <span className="mono">{success.verification_code}</span></p>
              <p className="muted">Email receipt sent to your registered address.</p>
              <div className="row">
                <button onClick={copyIds} className="btn-secondary">Copy IDs</button>
                <button onClick={() => setSuccess(null)} className="btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}

        <form className={`complaint-form ${formBlocked ? "disabled-section" : ""}`} onSubmit={handleSubmit}>
          <h3 className="section-title">Student Information</h3>
          <p className="section-sub badge">Verified from profile</p>
          <div className="form-grid">
            <div className="form-group"><label>Date & Time (Created)</label><input className="locked" type="datetime-local" name="dateTime" value={formData.dateTime} readOnly /></div>
            <div className="form-group"><label>Hostel Type</label><select className="locked" name="hostelType" value={formData.hostelType} disabled>
              <option value="MH">MH (Men's Hostel)</option><option value="LH">LH (Ladies Hostel)</option></select></div>
            <div className="form-group"><label>Hostel Block</label><input className="locked" type="text" value={formData.hostelBlock} readOnly /></div>
            <div className="form-group"><label>Room Number</label><input className="locked" type="text" value={formData.roomNumber} readOnly /></div>
            <div className="form-group"><label>Full Name</label><input className="locked" type="text" value={formData.fullName} readOnly /></div>
            <div className="form-group"><label>Roll No / Student ID</label><input className="locked" type="text" value={formData.rollNo} readOnly /></div>
            <div className="form-group"><label>Contact Number</label><input className="locked" type="tel" value={formData.contact} readOnly /></div>
          </div>

          <h3 className="section-title">Incident Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Incident Category</label>
              <select name="incidentType" value={formData.incidentType} onChange={handleChange} required disabled={formBlocked}>
                <option value="">-- Select Category --</option>
                <option value="maintenance">Maintenance</option>
                <option value="safety">Safety & Discipline</option>
                <option value="food">Food & Mess</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Subcategory</label>
              <select name="incidentSubType" value={formData.incidentSubType} onChange={handleChange} disabled={!formData.incidentType || formBlocked}>
                {(subTypesMap[formData.incidentType] || []).map((s) => (
                  <option key={s} value={s.toLowerCase()}>{s}</option>
                ))}
                {!formData.incidentType && <option value="">-- Select --</option>}
              </select>
            </div>
            <div className="form-group"><label>Date & Time of Incident</label><input type="datetime-local" name="incidentDateTime" value={formData.incidentDateTime} onChange={handleChange} required disabled={formBlocked} /></div>
            <div className="form-group"><label>Severity / Priority</label><select name="priority" value={formData.priority} onChange={handleChange} required disabled={formBlocked}>
              <option value="">-- Select Priority --</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="emergency">Emergency</option></select></div>
          </div>

          <h3 className="section-title">Complaint Description</h3>
          <div className="form-grid">
            <div className="form-group full-width"><label>Title / Subject</label><input type="text" name="complaintTitle" value={formData.complaintTitle} onChange={handleChange} placeholder="Short title" required disabled={formBlocked} /></div>
            <div className="form-group full-width"><label>Detailed Description (min 30 chars)</label>
              <textarea name="detailedDescription" value={formData.detailedDescription} onChange={handleChange} rows="4" placeholder="Explain exactly what happened..." required disabled={formBlocked} />
            </div>
          </div>

          <h3 className="section-title">Victims</h3>
          <div className="form-group">
            <label className="switch-line">
              <input type="checkbox" checked={isVictimSelf} onChange={(e) => toggleSelfVictim(e.target.checked)} disabled={formBlocked} />
              <span>I am a victim (auto-fill & lock my row)</span>
            </label>
          </div>
          <div className="group-list">
            {victims.map((v, i) => (
              <div key={i} className="group-row-extended">
                <div className="group-row">
                  <input className="g-input" type="text" placeholder="Victim name" value={v.name} onChange={(e) => updateVictim(i, "name", e.target.value)} disabled={formBlocked || v.locked} />
                  <input className="g-input" type="text" placeholder="Reg No" value={v.reg} onChange={(e) => updateVictim(i, "reg", e.target.value)} disabled={formBlocked || v.locked} />
                  <input className="g-input" type="tel" placeholder="Contact" value={v.contact} onChange={(e) => updateVictim(i, "contact", e.target.value)} disabled={formBlocked || v.locked} />
                  <button type="button" className="g-btn remove" onClick={() => removeVictim(i)} disabled={formBlocked || (v.locked && isVictimSelf && i === 0)}>✖</button>
                </div>
                <textarea className="desc-box" rows="2" placeholder="Short description..." value={v.description || ""} onChange={(e) => updateVictim(i, "description", e.target.value)} disabled={formBlocked} />
              </div>
            ))}
            <button type="button" className="g-btn add" onClick={addVictim} disabled={formBlocked}>+ Add Victim</button>
          </div>

          <h3 className="section-title">Accused (if identified)</h3>
          <label className="accused-toggle">
            <input type="checkbox" name="accusedIdentified" checked={formData.accusedIdentified} onChange={handleChange} disabled={formBlocked} />
            Accused identified
          </label>
          <div className={`accused-list ${!formData.accusedIdentified ? "disabled-section" : ""}`}>
            {accusedList.map((a, i) => (
              <div key={`accused-${i}`} className="accused-block">
                <div className="a-row">
                  <input className="a-input" type="text" placeholder="Accused Name" value={a.name} onChange={(e) => updateAccused(i, "name", e.target.value)} disabled={formBlocked} />
                  <input className="a-input" type="text" placeholder="Reg/Staff ID (if any)" value={a.id} onChange={(e) => updateAccused(i, "id", e.target.value)} disabled={formBlocked} />
                  <input className="a-input" type="tel" placeholder="Contact (optional)" value={a.contact} onChange={(e) => updateAccused(i, "contact", e.target.value)} disabled={formBlocked} />
                  <button type="button" className="a-btn remove" onClick={() => removeAccused(i)} disabled={formBlocked}>✖</button>
                </div>
                <textarea className="desc-box" rows="2" placeholder="Short description..." value={a.description || ""} onChange={(e) => updateAccused(i, "description", e.target.value)} disabled={formBlocked} />
              </div>
            ))}
            <button type="button" className="a-btn add" onClick={addAccused} disabled={formBlocked}>+ Add Accused</button>
          </div>

          <h3 className="section-title">Witnesses</h3>
          <div className="witness-list">
            {witnesses.map((w, i) => (
              <div key={`witness-${i}`} className="witness-block">
                <div className="witness-row">
                  <input className="w-input" type="text" placeholder="Witness name" value={w.name} onChange={(e) => updateWitness(i, "name", e.target.value)} disabled={formBlocked} />
                  <input className="w-input" type="text" placeholder="Reg No (optional)" value={w.regNo} onChange={(e) => updateWitness(i, "regNo", e.target.value)} disabled={formBlocked} />
                  <input className="w-input" type="tel" placeholder="Contact" value={w.contact} onChange={(e) => updateWitness(i, "contact", e.target.value)} disabled={formBlocked} />
                  <button className="w-btn remove" type="button" onClick={() => removeWitness(i)} disabled={formBlocked}>✖</button>
                </div>
                <textarea className="desc-box" rows="2" placeholder="Short description..." value={w.description || ""} onChange={(e) => updateWitness(i, "description", e.target.value)} disabled={formBlocked} />
              </div>
            ))}
            <button className="w-btn add" type="button" onClick={addWitness} disabled={formBlocked}>+ Add Witness</button>
          </div>

          <h3 className="section-title">Attachments</h3>
          <div className="form-group full-width">
            <label>Upload Supporting Files</label>
            <input type="file" name="file" multiple onChange={handleChange} accept="image/*,video/*,.pdf,audio/*,.doc,.docx" disabled={formBlocked} />
            {files.length > 0 && (
              <div className="file-chips">
                {files.map((f, idx) => (<span key={idx} className="chip">{f.name}</span>))}
              </div>
            )}
          </div>

          <h3 className="section-title">Declaration</h3>
          <div className="form-group full-width">
            <label>
              <input type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} disabled={formBlocked} /> I confirm the above details are true.
            </label>
          </div>

          <div className="form-buttons">
            <button type="reset" className="reset-btn" onClick={handleReset} disabled={formBlocked || submitting}>Reset</button>
            <button type="submit" className={`submit-btn ${submitting ? "is-loading" : ""}`} disabled={formBlocked || submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </StudentLayout>
  );
}
