"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { useToast } from "@/components/admin/toast";
import { SampleTag } from "@/components/ui/bits";
import type { ActionState } from "@/lib/admin-actions";
import { addGalleryPhotos, deleteGalleryPhoto, moveGalleryPhoto, updateGalleryPhoto } from "./actions";

type Photo = {
  id: string;
  url: string;
  alt: string;
  tag: "rooms" | "bar" | "exterior";
  isSample: boolean;
};
const TAGS = [
  ["rooms", "Rooms"],
  ["bar", "Bar"],
  ["exterior", "Exterior"],
] as const;

export function GalleryManager({ branchId, photos }: { branchId: string; photos: Photo[] }) {
  const [uploadTag, setUploadTag] = useState<Photo["tag"]>("rooms");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const run = (fn: () => Promise<ActionState>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast(r.formError || "Couldn't do that.", "error");
      else if (r.message) toast(r.message);
    });

  return (
    <>
      <fieldset className="m-0 flex flex-wrap items-center gap-2 border-0 p-0">
        <legend className="mb-2 p-0 text-sm font-semibold">New uploads are tagged</legend>
        {TAGS.map(([v, label]) => (
          <label
            key={v}
            className={`has-[:focus-visible]:outline-ink flex h-10 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-semibold has-[:focus-visible]:outline-3 ${uploadTag === v ? "border-ink bg-aqua" : "border-line bg-white"}`}
          >
            <input type="radio" name="uploadTag" value={v} checked={uploadTag === v} onChange={() => setUploadTag(v)} className="sr-only" />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(46%,180px),1fr))] gap-2.5">
        <PhotoUploader kind="gallery" variant="big" onUploaded={(list) => addGalleryPhotos(branchId, uploadTag, list)} />
        {photos.map((g, i) => (
          <figure key={g.id} className="m-0 flex flex-col gap-1.5" aria-busy={pending}>
            <div className="bg-aqua-tint relative aspect-square overflow-hidden rounded-[14px]">
              <Image src={g.url} alt={g.alt} fill sizes="200px" className="object-cover" />
              <span className="absolute top-2 left-2 rounded-[6px] bg-white px-2 py-0.5 text-xs font-semibold capitalize">{g.tag}</span>
              {g.isSample && <SampleTag className="absolute top-2 right-2" />}
            </div>
            <select
              aria-label={`Tag for photo ${i + 1}`}
              value={g.tag}
              onChange={(e) => run(() => updateGalleryPhoto(g.id, { tag: e.target.value }))}
              className="border-line h-9 rounded-[10px] border-[1.5px] bg-white px-2 text-[13px]"
            >
              {TAGS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <input
              aria-label={`Describe photo ${i + 1}`}
              defaultValue={g.alt}
              placeholder="Describe the photo"
              onBlur={(e) => e.target.value !== g.alt && run(() => updateGalleryPhoto(g.id, { alt: e.target.value }))}
              className="border-line focus:border-ink h-9 rounded-[10px] border-[1.5px] px-2.5 text-[13px] outline-none"
            />
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={g.isSample}
                onChange={(e) => run(() => updateGalleryPhoto(g.id, { isSample: e.target.checked }))}
                className="accent-ink size-4"
              />
              Sample photo
            </label>
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} earlier`}
                  disabled={i === 0 || pending}
                  onClick={() => run(() => moveGalleryPhoto(g.id, -1))}
                  className="border-line size-9 rounded-full border bg-white disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} later`}
                  disabled={i === photos.length - 1 || pending}
                  onClick={() => run(() => moveGalleryPhoto(g.id, 1))}
                  className="border-line size-9 rounded-full border bg-white disabled:opacity-40"
                >
                  →
                </button>
              </span>
              {confirming === g.id ? (
                <span className="flex gap-2">
                  <button type="button" onClick={() => setConfirming(null)} className="border-0 bg-transparent font-semibold">
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(null);
                      run(() => deleteGalleryPhoto(g.id));
                    }}
                    className="text-danger border-0 bg-transparent font-semibold"
                  >
                    Delete
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(g.id)} className="text-danger border-0 bg-transparent font-semibold">
                  Delete…
                </button>
              )}
            </div>
          </figure>
        ))}
      </div>
    </>
  );
}
