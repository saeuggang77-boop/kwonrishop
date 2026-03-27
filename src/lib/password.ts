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
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "소문자를 1개 이상 포함해야 합니다." };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "대문자를 1개 이상 포함해야 합니다." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "숫자를 1개 이상 포함해야 합니다." };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"|,.<>?/~`]/.test(password)) {
    return { valid: false, message: "특수문자를 1개 이상 포함해야 합니다." };
  }
  return { valid: true, message: "" };
}
