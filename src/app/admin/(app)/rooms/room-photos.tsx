"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { useToast } from "@/components/admin/toast";
import { addRoomPhotos, deleteRoomPhoto, moveRoomPhoto, saveRoomPhotoAlt } from "./actions";

type Photo = { id: string; url: string; alt: string };

/** Room photos: the first one is the card photo. Reorder, describe for screen readers, remove, or add more. */
export function RoomPhotos({ roomId, photos }: { roomId: string; photos: Photo[] }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const toast = useToast();

  const run = (fn: () => Promise<{ ok?: boolean; formError?: string; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast(r.formError || "Couldn't do that.", "error");
      else if (r.message) toast(r.message);
    });

  return (
    <section aria-labelledby="photos-h" className="flex max-w-[620px] flex-col gap-2">
      <h2 id="photos-h" className="m-0 text-sm font-semibold">
        Photos
      </h2>
      <span className="text-slate text-[13px]">
        The first photo is used on the room card. Aim for five to eight, in daylight. Uploads use a 3:2 or 4:5 frame.
      </span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {photos.map((p, i) => (
          <figure key={p.id} className="m-0 flex flex-col gap-1.5" aria-busy={pending}>
            <div className="rounded-field bg-aqua-tint relative aspect-square overflow-hidden">
              <Image src={p.url} alt={p.alt} fill sizes="160px" className="object-cover" />
              {i === 0 && <span className="absolute top-1.5 left-1.5 rounded-[6px] bg-white px-2 py-0.5 text-xs font-semibold">Card photo</span>}
            </div>
            <label className="sr-only" htmlFor={`alt-${p.id}`}>
              Describe photo {i + 1}
            </label>
            <input
              id={`alt-${p.id}`}
              defaultValue={p.alt}
              placeholder="Describe the photo"
              onBlur={(e) => e.target.value !== p.alt && run(() => saveRoomPhotoAlt(p.id, e.target.value))}
              className="border-line focus:border-ink h-9 rounded-[10px] border-[1.5px] px-2.5 text-[13px] outline-none"
            />
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} earlier`}
                  disabled={i === 0 || pending}
                  onClick={() => run(() => moveRoomPhoto(p.id, -1))}
                  className="border-line size-9 rounded-full border bg-white disabled:opacity-40"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} later`}
                  disabled={i === photos.length - 1 || pending}
                  onClick={() => run(() => moveRoomPhoto(p.id, 1))}
                  className="border-line size-9 rounded-full border bg-white disabled:opacity-40"
                >
                  →
                </button>
              </span>
              {confirming === p.id ? (
                <span className="flex gap-2">
                  <button type="button" onClick={() => setConfirming(null)} className="text-ink border-0 bg-transparent font-semibold">
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(null);
                      run(() => deleteRoomPhoto(p.id));
                    }}
                    className="text-danger border-0 bg-transparent font-semibold"
                  >
                    Remove
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirming(p.id)} className="text-danger border-0 bg-transparent font-semibold">
                  Remove…
                </button>
              )}
            </div>
          </figure>
        ))}
        <PhotoUploader kind="rooms" onUploaded={(list) => addRoomPhotos(roomId, list)} />
      </div>
    </section>
  );
}
