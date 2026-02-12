/**
 * Safe URL validation before opening in WebBrowser or Linking.
 * Prevents javascript:, data:, and other non-http(s) schemes.
 */

const ALLOWED_PROTOCOLS = ["https:", "http:"];

/**
 * Returns true if the URL is safe to open in an external browser.
 * Allows https (and http for local dev); rejects javascript:, data:, file:, etc.
 */
export function isSafeExternalUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol?.toLowerCase();
    if (!ALLOWED_PROTOCOLS.includes(protocol)) return false;
    // Optional: allow only certain hosts (e.g. clerk, stripe). For now allow any http(s).
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the URL if safe, otherwise null. Use before WebBrowser.openBrowserAsync.
 */
export function getSafeExternalUrl(url: string | null | undefined): string | null {
  if (!isSafeExternalUrl(url)) return null;
  return url!.trim();
}
