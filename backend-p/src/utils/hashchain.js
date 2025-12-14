import crypto from "crypto";
export const sha256hex = (s) => crypto.createHash("sha256").update(s).digest("hex");
export function recordHash(prevHash, obj) {
  const payload = JSON.stringify({ prevHash, ...obj });
  return sha256hex(payload);
}
