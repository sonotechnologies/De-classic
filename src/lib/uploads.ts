import "server-only";
import { v2 as cloudinary } from "cloudinary";

export function cloudinaryConfigured(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadTicket = {
  url: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
};

/**
 * A short-lived signature so the browser uploads straight to Cloudinary. Files never pass through our
 * server, which keeps uploads fast and avoids serverless request-size limits.
 */
export function signUpload(subfolder: string): UploadTicket {
  configure();
  const folder = `${process.env.CLOUDINARY_FOLDER || "de-classic"}/${subfolder}`;
  const timestamp = Math.round(Date.now() / 1000);
  const allowedFormats = "jpg,jpeg,png,webp";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder, allowed_formats: allowedFormats }, process.env.CLOUDINARY_API_SECRET!);
  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    signature,
    folder,
    allowedFormats,
  };
}

/** True for URLs we are willing to store as photos: our Cloudinary account, local dev uploads, or the seed stand-ins. */
export function isAllowedImageUrl(url: string): boolean {
  if (url.startsWith("/uploads/")) return /^\/uploads\/[a-zA-Z0-9._-]+$/.test(url);
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname === "res.cloudinary.com") return u.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/`);
    return u.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

/** Removes the file from Cloudinary when a photo is deleted. Failures are logged, never shown to staff. */
export async function deleteStoredImage(publicId: string | null, url: string) {
  try {
    if (publicId && cloudinaryConfigured()) {
      configure();
      await cloudinary.uploader.destroy(publicId);
    } else if (url.startsWith("/uploads/") && process.env.NODE_ENV !== "production") {
      const { unlink } = await import("node:fs/promises");
      const path = await import("node:path");
      await unlink(path.join(process.cwd(), "public", url)).catch(() => {});
    }
  } catch (e) {
    console.error("[uploads] delete failed", e);
  }
}

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Development fallback when Cloudinary is not configured: saves into /public/uploads. */
export async function saveLocalUpload(file: File): Promise<string> {
  if (process.env.NODE_ENV === "production") throw new Error("Set the Cloudinary environment variables to upload photos.");
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Use a JPG, PNG or WebP photo.");
  if (file.size > MAX_BYTES) throw new Error("That photo is over 10MB.");
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const { randomUUID } = await import("node:crypto");
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
