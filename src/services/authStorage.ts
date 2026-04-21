import type { AuthUser } from "../types/domain";
import {
  readJson,
  readStoredString,
  removeStored,
  writeJson,
  writeStoredString,
} from "./browserStorage";

const sessionKey = "tactile.session";
const postAuthRedirectKey = "tactile.post-auth-redirect";

function readStoredSession(): AuthUser | null {
  return readJson<AuthUser | null>(sessionKey, null);
}

export function writeStoredSession(user: AuthUser) {
  writeJson(sessionKey, user);
}

export function clearStoredSession() {
  removeStored(sessionKey);
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
  writeStoredString(postAuthRedirectKey, path, "sessionStorage");
}

export function consumePostAuthRedirect(fallback: string) {
  const storedPath = readStoredString(postAuthRedirectKey, null, "sessionStorage");
  removeStored(postAuthRedirectKey, "sessionStorage");
  return storedPath ?? fallback;
}
