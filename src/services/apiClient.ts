import { clearStoredSession } from "./authStorage";

type RequestOptions = {
  allow404?: boolean;
  allow401?: boolean;
};

const defaultBaseUrl = "/api";

const apiBaseUrl = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? defaultBaseUrl
).replace(/\/$/, "");

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

async function buildError(response: Response) {
  try {
    const payload = (await parseResponse<{ message?: string }>(response)) ?? {};
    return new Error(payload.message ?? `Request failed with status ${response.status}.`);
  } catch {
    return new Error(`Request failed with status ${response.status}.`);
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  options?: RequestOptions,
): Promise<T | null> {
  const headers = new Headers(init?.headers);
  const isFormDataRequest =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormDataRequest && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (options?.allow404 && response.status === 404) {
    return null;
  }

  if (options?.allow401 && response.status === 401) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredSession();
    }
    throw await buildError(response);
  }

  return parseResponse<T>(response);
}

export { apiBaseUrl };
