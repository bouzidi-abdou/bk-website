/**
 * Runs a DB query and NEVER throws — returns a fallback instead so pages
 * degrade gracefully (warning banner) instead of crashing with HTTP 500.
 */
export async function dbSafe<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<{ ok: boolean; data: T }> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    console.error("[dbSafe] query failed:", e);
    return { ok: false, data: fallback };
  }
}
