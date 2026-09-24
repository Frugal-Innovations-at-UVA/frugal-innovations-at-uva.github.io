import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "queue_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24; // 24h, event runs a few days at a time

export interface Session {
  role: "dashboard";
  // Captured once per browser session via a one-time "what's your name?"
  // prompt (see NameModal), not tied to a separate admin account — the
  // dashboard still uses a single shared DASHBOARD_PASSWORD. Attached to
  // every status change/note this admin makes afterward.
  name: string | null;
}

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

async function signSession(name: string | null): Promise<string> {
  return new SignJWT({ role: "dashboard", name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function createSessionCookie() {
  const token = await signSession(null);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/queue",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

// Re-signs the existing session cookie with a name attached, without
// requiring the admin to re-enter the shared password. Throws if called
// without a valid existing session (shouldn't happen — the name modal only
// renders once a session already exists).
export async function updateSessionName(name: string): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");

  const token = await signSession(name.trim() || null);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/queue",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (payload.role !== "dashboard") return null;

    return {
      role: "dashboard",
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

export async function hasValidSession(): Promise<boolean> {
  return (await getSession()) !== null;
}
