// src/utils/jwt.js
import { jwtDecode } from "jwt-decode";

export function getRoleFromToken(token) {
  try {
    if (!token) return null;
    const decoded = jwtDecode(token);
    const roles = decoded.roles || [];
    const r0 = roles[0];

    // support either ["faculty"] or ["2"]
    const idMap = { "1":"student","2":"faculty","3":"warden","4":"security" };
    if (typeof r0 === "string") {
      const lower = r0.toLowerCase();
      if (["student","faculty","warden","security"].includes(lower)) return lower;
      return idMap[r0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  try {
    if (!token) return false;
    const decoded = jwtDecode(token);
    if (!decoded.exp) return true;
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
