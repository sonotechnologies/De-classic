import Link from "next/link";
import { ActionForm, CheckboxField, ErrorSummary, SelectField, SubmitButton, TextArea, TextField } from "@/components/admin/form";
import type { Branch, Offer, RoomType } from "@/db/schema";
import { todayInLagos } from "@/lib/format";
import { saveOffer } from "./actions";

export function OfferForm({
  offer,
  linked = [],
  branches,
  rooms,
  canPickBranch,
  defaultBranch,
}: {
  offer?: Offer;
  linked?: string[];
  branches: Branch[];
  rooms: RoomType[];
  canPickBranch: boolean;
  defaultBranch: string;
}) {
  const branchId = offer?.branchId ?? defaultBranch;
  const branchRooms = rooms.filter((r) => r.branchId === branchId);
  return (
    <ActionForm action={saveOffer.bind(null, offer?.id ?? null)} className="flex max-w-[620px] flex-col gap-[18px]">
      <TextField
        name="title"
        label="Title"
        hint='Lowercase on the website. For example "two nights, ₦10k off".'
        defaultValue={offer?.title}
        maxLength={70}
      />
      <TextArea name="description" label="What the guest gets" defaultValue={offer?.description} maxLength={400} />
      <TextArea
        name="terms"
        label="Terms"
        hint="Optional. Shown in small text under the offer."
        defaultValue={offer?.terms}
        maxLength={400}
        rows={2}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField name="startsOn" label="Starts" type="date" defaultValue={offer?.startsOn ?? todayInLagos()} />
        <TextField name="endsOn" label="Ends" type="date" hint="Leave empty for an ongoing offer." defaultValue={offer?.endsOn ?? ""} />
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
        <TextField
          name="badge"
          label="Tag text"
          hint='Optional, replaces "ends 31 october". For example "every thursday".'
          defaultValue={offer?.badge}
          maxLength={30}
        />
        <TextField name="ctaLabel" label="Button text" hint='For example "Book the weekend".' defaultValue={offer?.ctaLabel} maxLength={30} />
      </div>
      {canPickBranch ? (
        <SelectField name="branchId" label="Branch" defaultValue={branchId} options={branches.map((b) => ({ value: b.id, label: b.name }))} />
      ) : (
        <input type="hidden" name="branchId" value={branchId} />
      )}
      {branchRooms.length > 0 && (
        <fieldset className="m-0 flex flex-col border-0 p-0">
          <legend className="p-0 text-sm font-semibold">Rooms this offer applies to</legend>
          <span className="text-slate mb-1 text-[13px]">Optional. Leave all unticked if it isn&apos;t about a room.</span>
          {branchRooms.map((r) => (
            <label key={r.id} className="flex min-h-11 items-center gap-3 text-base">
              <input type="checkbox" name="rooms" value={r.id} defaultChecked={linked.includes(r.id)} className="accent-ink size-[22px]" />
              {r.name}
            </label>
          ))}
        </fieldset>
      )}
      <CheckboxField
        name="isActive"
        label="Switched on"
        hint="Live offers show on the website between the start and end dates, then drop off on their own."
        defaultChecked={offer?.isActive ?? true}
      />
      <CheckboxField name="isSample" label="This is sample content" defaultChecked={offer?.isSample ?? false} />
      <ErrorSummary />
      <div className="border-line flex flex-wrap gap-2.5 border-t pt-[18px]">
        <SubmitButton>{offer ? "Save changes" : "Add offer"}</SubmitButton>
        <Link
          href="/admin/offers"
          className="border-ink text-ink hover:text-ink inline-flex h-12 items-center rounded-full border-[1.5px] px-6 font-semibold no-underline"
        >
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}
