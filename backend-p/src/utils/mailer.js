// src/utils/mailer.js
import nodemailer from "nodemailer";
import { getFacultyRecipients, getFacultyRecipientsByBlock } from "../services/emailLookup.service.js";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || `"VIT CMS" <vijayravi2705@gmail.com>`;

let transporter = null;
function getTx() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host, port, secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }
  return transporter;
}

export async function sendComplaintReceipt({ to, complaint_id, verification_code, name }) {
  if (!host || !user || !pass) {
    console.warn("[mail] SMTP env missing; skipping email send.");
    return;
  }
  const tx = getTx();
  const subject = `Your Complaint Receipt: ${complaint_id}`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <p>Hi ${name || ""},</p>
      <p>Your complaint has been received.</p>
      <ul>
        <li><b>Complaint ID:</b> ${complaint_id}</li>
        <li><b>Verification Code:</b> ${verification_code}</li>
      </ul>
      <p>Keep this ID/code safe for tracking and verification.</p>
      <p>— VIT Hostel CMS</p>
    </div>
  `;
  await tx.sendMail({ from, to, subject, html });
}

export async function sendComplaintStatusUpdate(to, { complaint_id, status, title = "", name = "" }) {
  if (!to) return;
  if (!host || !user || !pass) {
    console.warn("[mail] SMTP env missing; skipping status email.");
    return;
  }
  const tx = getTx();
  const pretty = (status || "").replace(/_/g, " ").replace(/\b\w/g, m => m.toUpperCase());
  const subject = `Update on Complaint ${complaint_id}: ${pretty}`;
  const text = [
    name ? `Hello ${name},` : `Hello,`,
    ``,
    `The status of your complaint ${complaint_id} has been updated.`,
    `Title: ${title || "-"} `,
    `New Status: ${pretty}`,
    ``,
    `If you did not file this complaint, please contact support.`
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <p>${name ? `Hello ${name},` : "Hello,"}</p>
      <p>The status of your complaint <b>${complaint_id}</b> has been updated.</p>
      <p><b>Title:</b> ${title || "-"}</p>
      <p><b>New Status:</b> ${pretty}</p>
      <p style="color:#64748b">If you did not file this complaint, please contact support.</p>
    </div>
  `;
  await tx.sendMail({ from, to, subject, text, html });
}

export async function sendEmergencyAlertToFaculty({ complaint_id, title = "", category = "", assigned_block = "" }) {
  if (!host || !user || !pass) {
    console.warn("[mail] SMTP env missing; skipping emergency alert.");
    return;
  }
  const tx = getTx();
  const recipients = assigned_block
    ? await getFacultyRecipientsByBlock(assigned_block)
    : await getFacultyRecipients();

  if (!Array.isArray(recipients) || recipients.length === 0) {
    console.warn("[mail] No faculty recipients found for emergency alert.");
    return;
  }

  const subject = `[EMERGENCY] ${complaint_id}${category ? ` • ${category}` : ""}`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
      <h3>Emergency complaint filed</h3>
      <p><b>ID:</b> ${complaint_id}</p>
      ${title ? `<p><b>Title:</b> ${title}</p>` : ``}
      ${category ? `<p><b>Category:</b> ${category}</p>` : ``}
      ${assigned_block ? `<p><b>Block:</b> ${assigned_block}</p>` : ``}
    </div>
  `;

  for (const r of recipients) {
    if (!r?.to_email) continue;
    await tx.sendMail({ from, to: r.to_email, subject, html });
  }
}
