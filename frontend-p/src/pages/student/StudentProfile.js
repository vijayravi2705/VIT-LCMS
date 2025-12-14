// src/pages/student/StudentProfile.js
import React, { useEffect, useState } from "react";
import "../assets/styles/StudentProfile.css";
import StudentLayout from "../layouts/StudentLayout";
import { FaUserGraduate, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import api from "../../utils/api";

export default function StudentProfile() {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/student/profile");
        setP(data?.profile || null);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <StudentLayout>
      <div className="stp-wrap"><div className="stp-card"><div className="stp-loading">Loading…</div></div></div>
    </StudentLayout>
  );

  if (!p) return (
    <StudentLayout>
      <div className="stp-wrap"><div className="stp-card"><div className="stp-loading">Profile Not Found</div></div></div>
    </StudentLayout>
  );

  const fmtDate = (d) => {
    try { const x = new Date(d); return isNaN(x) ? "—" : x.toLocaleDateString("en-GB"); } catch { return "—"; }
  };

  const name       = p.full_name   || "—";
  const regNo      = p.vit_id      || "—";
  const phone      = p.phone       || "—";
  const email      = p.email       || "—";
  const school     = p.school      || "—";
  const degree     = p.degree      || "—";
  const block      = p.block_code  || "—";
  const hostel     = p.hostel_type || "—";
  const room       = [p.room_type, p.room_no].filter(Boolean).join(" - ") || "—";
  const dob        = fmtDate(p.dob);
  const bloodGroup = p.blood_group || "—";
  const address    = p.address     || "—";
  const guardian   = p.guardian    || "—";
  const messType   = p.mess_type   || "—";
  const messName   = p.mess_caterer      || "—";

  return (
    <StudentLayout>
      <div className="stp-wrap">
        <div className="stp-card stp-scroll">
          <div className="stp-top">
            <div className="stp-avatar">
              <div className="stp-avatar-icon">
                <FaUserGraduate className="stp-avatar-grad" />
              </div>
            </div>
            <h1 className="stp-name">{name}</h1>
            <p className="stp-reg">{regNo}</p>
            <div className="stp-tags">
              <span>{school}</span>
              <span>{degree}</span>
              <span>{block}</span>
            </div>
          </div>

          <div className="stp-contact">
            <button><FaPhoneAlt /> {phone}</button>
            <button><FaEnvelope /> {email}</button>
          </div>

          <div className="stp-grid">
            <div className="stp-field"><label>Hostel</label><p>{hostel}</p></div>
            <div className="stp-field"><label>Room</label><p>{room}</p></div>
            <div className="stp-field"><label>Room Type</label><p>{p.room_type || "—"}</p></div>
            <div className="stp-field"><label>Date of Birth</label><p>{dob}</p></div>
            <div className="stp-field"><label>Blood Group</label><p>{bloodGroup}</p></div>
            <div className="stp-field"><label>Mess Type</label><p>{messType}</p></div>
            <div className="stp-field"><label>Mess Name</label><p>{messName}</p></div>
            <div className="stp-field stp-span-2"><label>Address</label><p>{address}</p></div>
            <div className="stp-field stp-span-2"><label>Guardian</label><p>{guardian}</p></div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
