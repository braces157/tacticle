import type { AuthUser } from "../types/domain";

const sessionKey = "tactile.session";
const postAuthRedirectKey = "tactile.post-auth-redirect";

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

export function readStoredSession(): AuthUser | null {
  return readJson<AuthUser | null>(sessionKey, null);
}

export function writeStoredSession(user: AuthUser) {
  writeJson(sessionKey, user);
}

export function clearStoredSession() {
  if (typeof window === "undefined" || typeof window.localStorage?.removeItem !== "function") {
    return;
  }

  window.localStorage.removeItem(sessionKey);
}

export function updateStoredSessionUser(user: AuthUser) {
  if (readStoredSession()) {
    writeStoredSession(user);
  }
}

export function getStoredSessionUser() {
  return readStoredSession();
}

export function storePostAuthRedirect(path: string) {
  if (typeof window === "undefined" || typeof window.sessionStorage?.setItem !== "function") {
    return;
  }

  window.sessionStorage.setItem(postAuthRedirectKey, path);
}

export function consumePostAuthRedirect(fallback: string) {
  if (typeof window === "undefined" || typeof window.sessionStorage?.getItem !== "function") {
    return fallback;
  }

  const storedPath = window.sessionStorage.getItem(postAuthRedirectKey);
  window.sessionStorage.removeItem(postAuthRedirectKey);
  return storedPath || fallback;
}
