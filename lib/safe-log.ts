/**
 * Safe logging: avoid leaking sensitive data in production.
 * In __DEV__, log message and optionally stack; in production, no-op or message only.
 */

/**
 * Log an error in a safe way. In development, logs message and stack.
 * In production, does not log the full error object (could contain tokens or PII).
 */
export function safeLogError(message: string, error?: unknown): void {
  if (__DEV__) {
    if (error instanceof Error) {
      console.warn(message, error.message, error.stack);
    } else if (error != null) {
      console.warn(message, String(error));
    } else {
      console.warn(message);
    }
  }
}
