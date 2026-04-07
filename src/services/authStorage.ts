import type { AuthSession, AuthUser } from "../types/domain";

const sessionKey = "tactile.session";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || typeof window.localStorage?.getItem !== "function") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined" || typeof window.localStorage?.setItem !== "function") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readStoredSession(): AuthSession | null {
  const value = readJson<AuthSession | AuthUser | null>(sessionKey, null);
  if (!value) {
    return null;
  }

  if ("token" in value && "user" in value) {
    return value;
  }

  if ("id" in value && "email" in value) {
    return {
      token: "",
      user: value,
    };
  }

  return null;
}

export function writeStoredSession(session: AuthSession) {
  writeJson(sessionKey, session);
}

export function clearStoredSession() {
  if (typeof window === "undefined" || typeof window.localStorage?.removeItem !== "function") {
    return;
  }

  window.localStorage.removeItem(sessionKey);
}

export function updateStoredSessionUser(user: AuthUser) {
  const current = readStoredSession();
  if (!current) {
    return;
  }

  writeStoredSession({
    token: current.token,
    user,
  });
}

export function getStoredAuthToken() {
  return readStoredSession()?.token ?? null;
}

export function getStoredSessionUser() {
  return readStoredSession()?.user ?? null;
}
