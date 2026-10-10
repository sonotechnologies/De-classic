"use server";

import { CONTENT_ROLES, requireActionUser } from "@/lib/authz";
import { cloudinaryConfigured, saveLocalUpload, signUpload, type UploadTicket } from "@/lib/uploads";

export type TicketResult = { mode: "cloudinary"; ticket: UploadTicket } | { mode: "local" } | { mode: "error"; message: string };

export async function getUploadTicket(kind: "rooms" | "gallery"): Promise<TicketResult> {
  try {
    await requireActionUser(CONTENT_ROLES);
  } catch {
    return { mode: "error", message: "Your session has ended. Sign in again." };
  }
  if (cloudinaryConfigured()) return { mode: "cloudinary", ticket: signUpload(kind) };
  if (process.env.NODE_ENV === "production")
    return {
      mode: "error",
      message: "Photo uploads aren't set up yet. Add the Cloudinary keys.",
    };
  return { mode: "local" };
}

/** Development only: stores the file under /public/uploads. */
export async function uploadLocal(fd: FormData): Promise<{ url?: string; error?: string }> {
  try {
    await requireActionUser(CONTENT_ROLES);
    const file = fd.get("file");
    if (!(file instanceof File)) return { error: "No file received." };
    return { url: await saveLocalUpload(file) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}
