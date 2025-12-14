import bcrypt from "bcrypt";

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(storedHash, submittedPlain) {
  if (!storedHash || !submittedPlain) return false;
  return bcrypt.compare(submittedPlain, String(storedHash).trim());
}
