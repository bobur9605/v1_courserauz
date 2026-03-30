import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
const COOKIE = "lms_session";

export type Role = "ADMIN" | "STUDENT";
const getSecret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
};

export type SessionPayload = {
  sub: string;
  role: Role;
  email: string;
  fullName: string;
};

export async function signSession(payload: SessionPayload) {
  const token = await new SignJWT({
    role: payload.role,
    email: payload.email,
    fullName: payload.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    if (
      !sub ||
      typeof payload.role !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string"
    ) {
      return null;
    }
    if (payload.role !== "ADMIN" && payload.role !== "STUDENT") {
      return null;
    }
    return {
      sub,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName,
    };
  } catch {
    return null;
  }
}
