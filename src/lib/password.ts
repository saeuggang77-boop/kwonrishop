import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  message: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password.length > 128) {
    return { valid: false, message: "비밀번호는 128자 이하여야 합니다." };
  }
  // 영문/숫자/특수문자 중 2종 이상 조합
  let categoryCount = 0;
  if (/[a-zA-Z]/.test(password)) categoryCount++;
  if (/[0-9]/.test(password)) categoryCount++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"|,.<>?/~`]/.test(password)) categoryCount++;
  if (categoryCount < 2) {
    return { valid: false, message: "영문, 숫자, 특수문자 중 2종 이상 조합해야 합니다." };
  }
  return { valid: true, message: "" };
}
