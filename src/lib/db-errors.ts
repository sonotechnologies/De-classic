/** True when Postgres rejected a write because of a unique constraint (SQLSTATE 23505), even when wrapped by Drizzle. */
export function isUniqueViolation(e: unknown): boolean {
  for (let cur: unknown = e, depth = 0; cur && depth < 4; cur = (cur as { cause?: unknown }).cause, depth++) {
    if ((cur as { code?: string }).code === "23505") return true;
  }
  return false;
}
