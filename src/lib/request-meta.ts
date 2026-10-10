import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** A salted hash of the caller's IP: enough to rate-limit without storing the address itself. */
export async function hashedIp(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim();
  if (!ip) return null;
  return createHash("sha256")
    .update(ip + (process.env.AUTH_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);
}
