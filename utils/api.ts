/**
 * API client and backend connection helpers.
 * Uses EXPO_PUBLIC_API_URL from .env.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

/** Optional: set in .env if your backend uses a specific health path, e.g. /api/status */
const CUSTOM_HEALTH_PATH = process.env.EXPO_PUBLIC_API_HEALTH_PATH;

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export function hasApiUrl(): boolean {
  return BASE_URL.length > 0;
}

/** Paths to try for health check; custom path first if set */
const DEFAULT_HEALTH_PATHS = ["/health", "/api/health", "/"];
const HEALTH_PATHS = CUSTOM_HEALTH_PATH
  ? [CUSTOM_HEALTH_PATH.startsWith("/") ? CUSTOM_HEALTH_PATH : `/${CUSTOM_HEALTH_PATH}`, ...DEFAULT_HEALTH_PATHS]
  : DEFAULT_HEALTH_PATHS;

export type BackendConnectionResult =
  | { ok: true; status: number; url: string }
  | { ok: false; error: string; url?: string };

const TIMEOUT_MS = 15000;

/**
 * Check if the app can reach the backend. Tries GET on health paths.
 * Any HTTP response (2xx, 4xx, 5xx) means the server was reached.
 * Returns the actual error message so you can debug (e.g. timeout, DNS, CORS).
 */
export async function checkBackendConnection(): Promise<BackendConnectionResult> {
  if (!BASE_URL) {
    return {
      ok: false,
      error: "EXPO_PUBLIC_API_URL is not set in .env",
    };
  }

  let lastError: string = "";

  for (const path of HEALTH_PATHS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const url = `${BASE_URL}${path}`;
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return { ok: true, status: res.status, url };
    } catch (e) {
      clearTimeout(timeoutId);
      lastError = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  return {
    ok: false,
    error: lastError || "Could not reach backend (timeout or network error)",
    url: BASE_URL,
  };
}
