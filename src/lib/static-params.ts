import "server-only";
import { getPublishedBranches, DEFAULT_BRANCH_TOKEN } from "./site-data";

/**
 * Prebuild every published branch plus the default token. If the database is unreachable at build time
 * we build nothing up front and let pages render on first request instead.
 */
export async function branchParams(): Promise<{ branch: string }[]> {
  try {
    const all = await getPublishedBranches();
    return [{ branch: DEFAULT_BRANCH_TOKEN }, ...all.map((b) => ({ branch: b.slug }))];
  } catch {
    return [];
  }
}
