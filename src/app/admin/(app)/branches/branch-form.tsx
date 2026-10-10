import Link from "next/link";
import { ActionForm, CheckboxField, ErrorSummary, SubmitButton, TextArea, TextField } from "@/components/admin/form";
import type { Branch } from "@/db/schema";
import { displayLocal } from "@/lib/phone";
import { saveBranch } from "./actions";

export function BranchForm({ branch }: { branch?: Branch }) {
  return (
    <ActionForm action={saveBranch.bind(null, branch?.id ?? null)} className="flex max-w-[620px] flex-col gap-[18px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField name="name" label="Branch name" defaultValue={branch?.name} placeholder="Ikorodu" maxLength={40} />
        <TextField name="area" label="Area" hint='Used in headlines, e.g. "agric, ikorodu".' defaultValue={branch?.area} maxLength={60} />
      </div>
      <TextField name="address" label="Street address" defaultValue={branch?.address} maxLength={200} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField name="phone" label="Reception phone" type="tel" defaultValue={branch ? displayLocal(branch.phone) : ""} />
        <TextField name="whatsapp" label="WhatsApp number" type="tel" defaultValue={branch ? displayLocal(branch.whatsapp) : ""} />
      </div>
      <TextField
        name="email"
        label="Branch email"
        type="email"
        hint="Optional. New requests for this branch are also emailed here."
        defaultValue={branch?.email}
      />
      <TextField
        name="mapUrl"
        label="Google Maps link"
        hint="Open the hotel in Google Maps, tap Share, and paste the link."
        defaultValue={branch?.mapUrl}
      />
      <TextField
        name="mapEmbedUrl"
        label="Map embed link"
        hint='Optional. In Google Maps: Share → Embed a map → copy the link inside src="…". Without it, the map is found from the address.'
        defaultValue={branch?.mapEmbedUrl}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField name="checkInTime" label="Check-in time" type="time" defaultValue={branch?.checkInTime ?? "14:00"} />
        <TextField name="checkOutTime" label="Check-out time" type="time" defaultValue={branch?.checkOutTime ?? "12:00"} />
      </div>
      <TextField
        name="hours"
        label="Reception note"
        hint='For example "Reception is open 24 hours. Free parking on site."'
        defaultValue={branch?.hours}
        maxLength={200}
      />
      <TextArea
        name="landmarks"
        label="Nearby landmarks"
        hint='One per line: place | time. For example "Agric junction | 5 min drive".'
        defaultValue={branch?.landmarks.map((l) => `${l.place} | ${l.time}`).join("\n")}
        rows={4}
      />
      <TextArea
        name="barHours"
        label="Bar opening hours"
        hint='One per line: days | hours. For example "Fri and Sat | 6pm – 3am".'
        defaultValue={branch?.barHours.map((h) => `${h.days} | ${h.time}`).join("\n")}
        rows={3}
      />
      <TextArea
        name="barIntro"
        label="Bar note"
        hint="A line or two shown on the bar page."
        defaultValue={branch?.barIntro}
        maxLength={400}
        rows={2}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField name="slug" label="Web address" hint="Used in /locations/ikorodu." defaultValue={branch?.slug} maxLength={40} />
        <TextField name="sortOrder" label="Order" type="number" min={0} max={99} hint="Lower shows first." defaultValue={branch?.sortOrder ?? 0} />
      </div>
      <CheckboxField
        name="allowsShortStay"
        label="Offer short stays"
        hint="Guests can request a few hours instead of a night."
        defaultChecked={branch?.allowsShortStay ?? false}
      />
      <CheckboxField
        name="isPublished"
        label="Published and taking bookings"
        hint="With two or more published branches, guests get a branch switcher on the site."
        defaultChecked={branch?.isPublished ?? false}
      />
      <CheckboxField name="isSample" label="These details are samples" defaultChecked={branch?.isSample ?? false} />
      <ErrorSummary />
      <div className="border-line flex flex-wrap gap-2.5 border-t pt-[18px]">
        <SubmitButton>{branch ? "Save branch" : "Add branch"}</SubmitButton>
        <Link
          href="/admin/branches"
          className="border-ink text-ink hover:text-ink inline-flex h-12 items-center rounded-full border-[1.5px] px-6 font-semibold no-underline"
        >
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}
