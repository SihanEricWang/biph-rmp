// lib/admin/session.ts
import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "rmt_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type AdminSessionPayload = {
  u: string;
  iat: number;
  exp: number;
};

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function base64urlEncode(buf: Buffer) {
  return buf.toString("base64").replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}

function base64urlDecode(s: string) {
  let b64 = s.replaceAll("-", "+").replaceAll("_", "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}

function hmacSha256(secret: string, data: string) {
  return crypto.createHmac("sha256", secret).update(data).digest();
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createAdminToken(username: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = { u: username, iat: now, exp: now + MAX_AGE_SECONDS };
  const body = base64urlEncode(Buffer.from(JSON.stringify(payload), "utf-8"));
  const sig = base64urlEncode(hmacSha256(mustGetEnv("ADMIN_COOKIE_SECRET"), body));
  return `${body}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [body, sig] = parts;
  const expected = base64urlEncode(hmacSha256(mustGetEnv("ADMIN_COOKIE_SECRET"), body));
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(base64urlDecode(body).toString("utf-8")) as AdminSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload?.u || typeof payload.exp !== "number") return null;
    if (payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAdmin(nextPath?: string) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = verifyAdminToken(token);
  if (!payload) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/admin/login${next}`);
  }
  return payload;
}

export function setAdminSession(username: string) {
  const token = createAdminToken(username);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAdminSession() {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });
}

export function safeNextPath(p: string, fallback = "/admin/teachers") {
  const s = (p || "").trim();
  if (!s.startsWith("/")) return fallback;
  if (s.startsWith("//")) return fallback;
  if (s.includes("\\") || s.includes("\n") || s.includes("\r")) return fallback;
  if (!s.startsWith("/admin")) return fallback;
  return s;
}
