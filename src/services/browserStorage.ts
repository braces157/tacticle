function getStorage(
  kind: "localStorage" | "sessionStorage",
): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = window[kind];
  if (!storage) {
    return null;
  }

  return storage;
}

export function readJson<T>(key: string, fallback: T, kind: "localStorage" | "sessionStorage" = "localStorage"): T {
  const storage = getStorage(kind);
  if (!storage) {
    return fallback;
  }

  const raw = storage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown, kind: "localStorage" | "sessionStorage" = "localStorage") {
  const storage = getStorage(kind);
  if (!storage) {
    return;
  }

  storage.setItem(key, JSON.stringify(value));
}

export function removeStored(key: string, kind: "localStorage" | "sessionStorage" = "localStorage") {
  const storage = getStorage(kind);
  if (!storage) {
    return;
  }

  storage.removeItem(key);
}

export function readStoredString(
  key: string,
  fallback: string | null,
  kind: "localStorage" | "sessionStorage" = "localStorage",
) {
  const storage = getStorage(kind);
  if (!storage) {
    return fallback;
  }

  return storage.getItem(key) ?? fallback;
}

export function writeStoredString(
  key: string,
  value: string,
  kind: "localStorage" | "sessionStorage" = "localStorage",
) {
  const storage = getStorage(kind);
  if (!storage) {
    return;
  }

  storage.setItem(key, value);
}
