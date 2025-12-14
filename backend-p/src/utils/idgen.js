import crypto from "crypto";

const seg = () => {
  const n = crypto.randomBytes(2).readUInt16BE(0);
  return n.toString(36).toUpperCase().padStart(4, "0").slice(-4);
};

export function newComplaintId() {
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

export function shortVerification(len = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
