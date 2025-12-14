import fs from "fs";
import crypto from "crypto";
export function sha256FileHex(path) {
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(path);
  hash.update(data);
  return hash.digest("hex");
}
