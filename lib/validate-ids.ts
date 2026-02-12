/**
 * Validation for route/API IDs to avoid injection and malformed requests.
 * Backend may still return 400 for invalid IDs; this adds a client-side guard.
 */

const MAX_ID_LENGTH = 24;
const SAFE_ID_REGEX = /^[0-9a-zA-Z_-]+$/;

/**
 * Returns true if the value is a safe entry or journal ID (non-empty, safe chars, reasonable length).
 */
export function isValidEntryId(id: string | null | undefined): boolean {
  if (id == null || typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_ID_LENGTH) return false;
  return SAFE_ID_REGEX.test(trimmed);
}

/**
 * Same as isValidEntryId; use for journal id from route params or API.
 */
export function isValidJournalId(id: string | null | undefined): boolean {
  return isValidEntryId(id);
}

/**
 * Returns the id if valid, otherwise null. Use before calling API with an id from params.
 */
export function sanitizeId(id: string | null | undefined): string | null {
  if (!isValidEntryId(id)) return null;
  return (id as string).trim();
}
