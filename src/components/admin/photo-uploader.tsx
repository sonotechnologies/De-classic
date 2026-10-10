"use client";

import clsx from "clsx";
import { useRef, useState } from "react";
import { getUploadTicket, uploadLocal } from "@/app/admin/(app)/upload-actions";
import { Spinner } from "@/components/ui/button";
import { useToast } from "./toast";

export type UploadedPhoto = {
  url: string;
  publicId: string | null;
  width: number;
  height: number;
  name: string;
};

const MAX = 10 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

function measure(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 1200, height: 900 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Picks photos and uploads them straight to Cloudinary with a signed ticket (or to local disk in development),
 * then hands the results to `onUploaded`, which saves them to the database.
 */
export function PhotoUploader({
  kind,
  onUploaded,
  variant = "tile",
  label = "+ Add",
}: {
  kind: "rooms" | "gallery";
  onUploaded: (photos: UploadedPhoto[]) => Promise<{ ok?: boolean; formError?: string; message?: string }>;
  variant?: "tile" | "big";
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const toast = useToast();

  async function handle(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const list = [...files];
    const bad = list.find((f) => !OK_TYPES.includes(f.type) || f.size > MAX);
    if (bad) {
      setError(bad.size > MAX ? `${bad.name} is over 10MB.` : `${bad.name} isn't a JPG, PNG or WebP photo.`);
      return;
    }
    const ticket = await getUploadTicket(kind);
    if (ticket.mode === "error") return setError(ticket.message);

    const done: UploadedPhoto[] = [];
    for (const [i, file] of list.entries()) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      const { width, height } = await measure(file);
      try {
        if (ticket.mode === "cloudinary") {
          const fd = new FormData();
          fd.set("file", file);
          fd.set("api_key", ticket.ticket.apiKey);
          fd.set("timestamp", String(ticket.ticket.timestamp));
          fd.set("signature", ticket.ticket.signature);
          fd.set("folder", ticket.ticket.folder);
          fd.set("allowed_formats", ticket.ticket.allowedFormats);
          const r = await fetch(ticket.ticket.url, {
            method: "POST",
            body: fd,
          });
          const json = await r.json();
          if (!r.ok) throw new Error(json?.error?.message || "Upload failed.");
          done.push({
            url: json.secure_url,
            publicId: json.public_id,
            width: json.width ?? width,
            height: json.height ?? height,
            name: file.name,
          });
        } else {
          const fd = new FormData();
          fd.set("file", file);
          const r = await uploadLocal(fd);
          if (!r.url) throw new Error(r.error || "Upload failed.");
          done.push({
            url: r.url,
            publicId: null,
            width,
            height,
            name: file.name,
          });
        }
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "upload failed"}. The connection may have dropped. Try again.`);
        break;
      }
    }
    if (done.length) {
      setBusy("Saving…");
      const res = await onUploaded(done);
      if (!res.ok) setError(res.formError || "Couldn't save the photos.");
      else toast(res.message || `${done.length} photo${done.length === 1 ? "" : "s"} added`);
    }
    setBusy("");
    if (input.current) input.current.value = "";
  }

  return (
    <div className={clsx("flex flex-col gap-1.5", variant === "tile" && "contents")}>
      <button
        type="button"
        disabled={!!busy}
        onClick={() => input.current?.click()}
        className={clsx(
          "border-slate flex aspect-square flex-col items-center justify-center gap-1 rounded-[14px] border-[1.5px] border-dashed p-2 text-center",
          variant === "big" ? "bg-aqua-tint" : "bg-white",
        )}
      >
        {busy ? (
          <>
            <Spinner className="border-line border-t-ink" />
            <span className="text-slate text-[13px]">{busy}</span>
          </>
        ) : variant === "big" ? (
          <>
            <span className="text-ink text-[15px] font-semibold">+ Upload photos</span>
            <span className="text-slate text-[13px]">JPG or PNG, up to 10MB</span>
          </>
        ) : (
          <span className="text-teal text-sm font-semibold">{label}</span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handle(e.target.files)}
      />
      {error && (
        <span role="alert" className="text-error col-span-full text-sm">
          {error}
        </span>
      )}
    </div>
  );
}
