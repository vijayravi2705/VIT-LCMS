import React, { useEffect, useMemo, useState } from "react";
import "../assets/styles/securityprofile.css"; // all sep- styles
import SecurityLayout from "../layouts/SecurityLayout";
import {
  ShieldUser, UserRound, Mail, Phone, MapPin, Building2, Calendar,
  Edit3, Save, X, UploadCloud, CheckCircle2,
} from "lucide-react";

/* Seed */
const DEFAULT_SECURITY = {
  id: "SEC-EMP-0021",
  name: "Officer Arun Kumar",
  rank: "Senior Security Officer",
  email: "arun.kumar@univ.edu",
  phone: "+91 98 765 43210",
  office: "Security Block, Room S-103",
  joinDate: "2019-04-15",
  zones: ["Main Gate", "MH-A", "Academic Block-C"],
  skills: ["Crowd Control", "Surveillance", "First Aid"],
  avatar: "",
  stats: { shifts: 128, incidentsHandled: 54, commendations: 6 },
  preferences: { smsAlerts: true, emailAlerts: true, shareContactOnReport: true },
};

const cx = (...xs) => xs.filter(Boolean).join(" ");
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });

export default function SecurityProfile() {
  const [data, setData] = useState(DEFAULT_SECURITY);
  const [draft, setDraft] = useState(DEFAULT_SECURITY);
  const [edit, setEdit] = useState(false);
  const [notes, setNotes] = useState("Internal notes about duty patterns, patrol feedback, or SOP updates.");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("securityProfile:me");
      const n = localStorage.getItem("securityProfile:me:notes");
      if (raw) { setData(JSON.parse(raw)); setDraft(JSON.parse(raw)); }
      if (n) setNotes(n);
    } catch {}
  }, []);

  const initials = useMemo(() => {
    const p = (data.name || "").split(" ").filter(Boolean);
    return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
  }, [data.name]);

  const pushArr = (key, val) =>
    setDraft(d => ({ ...d, [key]: Array.from(new Set([...(d[key]||[]), val].filter(Boolean))) }));
  const rmArr = (key, idx) =>
    setDraft(d => ({ ...d, [key]: (d[key]||[]).filter((_,i)=>i!==idx) }));
  const upd = (key, v) => setDraft(d => ({ ...d, [key]: v }));
  const updPref = (key, v) => setDraft(d => ({ ...d, preferences: { ...d.preferences, [key]: v }}));

  const onAvatarPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => upd("avatar", r.result || "");
    r.readAsDataURL(f);
  };

  const validate = () => {
    const errs = [];
    if (!draft.name?.trim()) errs.push("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) errs.push("Email looks invalid.");
    if (!draft.phone?.trim()) errs.push("Phone is required.");
    return errs;
  };

  const save = () => {
    const errs = validate();
    if (errs.length) return alert("Please fix:\n• " + errs.join("\n• "));
    setData(draft);
    localStorage.setItem("securityProfile:me", JSON.stringify(draft));
    localStorage.setItem("securityProfile:me:notes", notes || "");
    setEdit(false);
    alert("Profile saved.");
  };

  return (
    <SecurityLayout>
      <div className="sep-wrap">
        {/* Header */}
        <header className="sep-head">
          <div className="sep-head-left">
            <div className="sep-avatar">
              {data.avatar ? (
                <img src={data.avatar} alt={data.name} />
              ) : (
                <div className="sep-avatar-badge">{initials}</div>
              )}
              <label className="sep-upload-btn" title="Upload photo">
                <UploadCloud size={16} />
                <input type="file" accept="image/*" onChange={onAvatarPick} />
              </label>
            </div>

            <div className="sep-title-block">
              <h1 className="sep-name"><ShieldUser size={18} /> {data.name}</h1>
              <p className="sep-title">{data.rank}</p>
              <div className="sep-meta">
                <span className="sep-meta-chip"><Calendar size={14}/> Joined {fmtDate(data.joinDate)}</span>
                <span className="sep-meta-chip"><Building2 size={14}/> ID: {data.id}</span>
                <span className="sep-meta-chip"><MapPin size={14}/> Office: {data.office}</span>
              </div>
            </div>
          </div>

          <div className="sep-actions">
            {!edit ? (
              <>
                <button className="sep-btn sep-btn--soft" onClick={() => setEdit(true)}><Edit3 size={16}/> Edit</button>
                <button className="sep-btn sep-btn--primary"><CheckCircle2 size={16}/> Mark Available</button>
              </>
            ) : (
              <>
                <button className="sep-btn sep-btn--danger" onClick={() => { setDraft(data); setEdit(false); }}>
                  <X size={16}/> Cancel
                </button>
                <button className="sep-btn sep-btn--primary" onClick={save}><Save size={16}/> Save</button>
              </>
            )}
          </div>
        </header>

        {/* KPIs */}
        <section className="sep-kpi-grid">
          <KPI label="Shifts" value={data.stats.shifts} />
          <KPI label="Incidents Handled" value={data.stats.incidentsHandled} tone="ok" />
          <KPI label="Commendations" value={data.stats.commendations} tone="warn" />
        </section>

        {/* Content */}
        <div className="sep-grid-2">
          <div className="sep-card">
            <h3 className="sep-card-title">Contact</h3>
            <div className="sep-form-grid">
              <SepField icon={<UserRound size={14}/>}  label="Name"      value={draft.name}      onChange={(v)=>edit && upd("name", v)} disabled={!edit}/>
              <SepField icon={<Mail size={14}/>}       label="Email"     value={draft.email}     onChange={(v)=>edit && upd("email", v)} disabled={!edit}/>
              <SepField icon={<Phone size={14}/>}      label="Phone"     value={draft.phone}     onChange={(v)=>edit && upd("phone", v)} disabled={!edit}/>
              <SepField icon={<MapPin size={14}/>}     label="Office"    value={draft.office}    onChange={(v)=>edit && upd("office", v)} disabled={!edit}/>
              <SepField icon={<Calendar size={14}/>}   label="Join Date" type="date" value={draft.joinDate} onChange={(v)=>edit && upd("joinDate", v)} disabled={!edit}/>
              <SepField icon={<Building2 size={14}/>}  label="Rank"      value={draft.rank}      onChange={(v)=>edit && upd("rank", v)} disabled={!edit}/>
            </div>
            <p className="sep-hint">Direct contact details are shared on reports only if “Share Contact on Report” is enabled.</p>
          </div>

          <div className="sep-card">
            <h3 className="sep-card-title">Zones & Skills</h3>

            <div className="sep-tags-block">
              <h4>Zones</h4>
              <div className="sep-tags">
                {(edit ? draft : data).zones.map((z, i) => (
                  <Tag key={`z-${i}`} text={z} readonly={!edit} onRemove={edit ? () => rmArr("zones", i) : null} />
                ))}
              </div>
              {edit && (
                <input
                  className="sep-input"
                  placeholder="Add zone (Enter)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.currentTarget.value.trim();
                      if (v) { pushArr("zones", v); e.currentTarget.value = ""; }
                    }
                  }}
                />
              )}
            </div>

            <div className="sep-tags-block">
              <h4>Skills</h4>
              <div className="sep-tags">
                {(edit ? draft : data).skills.map((s, i) => (
                  <Tag key={`s-${i}`} text={s} readonly={!edit} onRemove={edit ? () => rmArr("skills", i) : null} />
                ))}
              </div>
              {edit && (
                <input
                  className="sep-input"
                  placeholder="Add skill (Enter)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.currentTarget.value.trim();
                      if (v) { pushArr("skills", v); e.currentTarget.value = ""; }
                    }
                  }}
                />
              )}
            </div>

            <div className="sep-pref-grid" style={{marginTop:10}}>
              <label className="sep-pref">
                <input type="checkbox" checked={draft.preferences.emailAlerts} onChange={(e)=>edit && updPref("emailAlerts", e.target.checked)} />
                <span className="sep-switch" /> Email Alerts
              </label>
              <label className="sep-pref">
                <input type="checkbox" checked={draft.preferences.smsAlerts} onChange={(e)=>edit && updPref("smsAlerts", e.target.checked)} />
                <span className="sep-switch" /> SMS Alerts
              </label>
              <label className="sep-pref">
                <input type="checkbox" checked={draft.preferences.shareContactOnReport} onChange={(e)=>edit && updPref("shareContactOnReport", e.target.checked)} />
                <span className="sep-switch" /> Share Contact on Report
              </label>
            </div>
          </div>
        </div>

        <div className="sep-card">
          <h3 className="sep-card-title">Private Notes</h3>
          <textarea
            className="sep-notes"
            rows={6}
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
            placeholder="Duty notes, SOP changes, observations…"
          />
          <div className="sep-actions" style={{justifyContent:"flex-end", marginTop:10}}>
            <button
              className="sep-btn sep-btn--soft"
              onClick={() => { localStorage.setItem("securityProfile:me:notes", notes || ""); alert("Notes saved."); }}
            >
              <Save size={16}/> Save Notes
            </button>
          </div>
        </div>
      </div>
    </SecurityLayout>
  );
}

/* atoms */
function KPI({ label, value, tone = "base" }) {
  return (
    <div className={cx("sep-kpi", `tone--${tone}`)}>
      <div className="sep-kpi-top">
        <div className="sep-kpi-icon">★</div>
        <div className="sep-kpi-label">{label}</div>
      </div>
      <div className="sep-kpi-value">{value}</div>
    </div>
  );
}
function Tag({ text, onRemove, readonly }) {
  return (
    <span className={cx("sep-tag", readonly && "readonly")}>
      {text}
      {!readonly && <button className="sep-tag-x" onClick={onRemove} aria-label="remove">×</button>}
    </span>
  );
}
function SepField({ icon, label, value, onChange, disabled, type = "text" }) {
  return (
    <label className={cx("sep-field", disabled && "disabled")}>
      <span className="sep-field-label">{icon}{label}</span>
      <input
        className="sep-input"
        type={type}
        value={value || ""}
        onChange={(e)=>onChange?.(e.target.value)}
        disabled={disabled}
      />
    </label>
  );
}
