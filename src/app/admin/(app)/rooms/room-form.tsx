import Link from "next/link";
import { ActionForm, CheckboxField, ErrorSummary, SelectField, SubmitButton, TextArea, TextField } from "@/components/admin/form";
import type { Branch, RoomType } from "@/db/schema";
import { koboToNairaInput } from "@/lib/format";
import { saveRoom } from "./actions";

export function RoomForm({
  room,
  branches,
  canPickBranch,
  defaultBranch,
}: {
  room?: RoomType;
  branches: Branch[];
  canPickBranch: boolean;
  defaultBranch: string;
}) {
  return (
    <ActionForm action={saveRoom.bind(null, room?.id ?? null)} className="flex max-w-[620px] flex-col gap-[18px]">
      <TextField name="name" label="Room name" defaultValue={room?.name} required maxLength={60} placeholder="Deluxe room" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField
          name="price"
          label="Price per night (₦)"
          inputMode="numeric"
          defaultValue={koboToNairaInput(room?.pricePerNight)}
          placeholder="35000"
          required
        />
        <TextField
          name="shortStayPrice"
          label="Short stay price (₦)"
          hint="Leave empty if this room isn't offered for short stays."
          inputMode="numeric"
          defaultValue={koboToNairaInput(room?.shortStayPrice)}
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField
          name="units"
          label="Number of rooms"
          type="number"
          min={1}
          defaultValue={room?.units ?? 5}
          hint="Used to warn about over-booking."
        />
        <TextField name="capacity" label="Sleeps (adults)" type="number" min={1} max={12} defaultValue={room?.capacity ?? 2} />
      </div>
      {canPickBranch ? (
        <SelectField
          name="branchId"
          label="Branch"
          defaultValue={room?.branchId ?? defaultBranch}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
        />
      ) : (
        <input type="hidden" name="branchId" value={room?.branchId ?? defaultBranch} />
      )}
      <TextField
        name="tagline"
        label="Short line"
        hint='Shown big on the room page, lowercase. For example "room for two, and a desk".'
        defaultValue={room?.tagline}
        maxLength={80}
      />
      <TextArea name="description" label="Description" defaultValue={room?.description} maxLength={1200} />
      <TextArea
        name="amenities"
        label="Amenities"
        hint="One per line, or separated by commas. The first three show on the room card."
        defaultValue={room?.amenities.join("\n")}
        rows={5}
      />
      <TextField
        name="slug"
        label="Web address"
        hint="The end of the page link, like /rooms/deluxe. Made from the name if you leave it empty."
        defaultValue={room?.slug}
        maxLength={60}
      />
      <CheckboxField name="isVisible" label="Show this room on the website" defaultChecked={room?.isVisible ?? true} />
      <CheckboxField
        name="isSample"
        label="This is sample content"
        hint="Untick once the name, price and details are real."
        defaultChecked={room?.isSample ?? false}
      />
      <ErrorSummary />
      <div className="border-line flex flex-wrap gap-2.5 border-t pt-[18px]">
        <SubmitButton>{room ? "Save changes" : "Add room"}</SubmitButton>
        <Link
          href="/admin/rooms"
          className="border-ink text-ink hover:text-ink inline-flex h-12 items-center rounded-full border-[1.5px] px-6 text-base font-semibold no-underline"
        >
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}
