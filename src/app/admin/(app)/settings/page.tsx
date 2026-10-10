import type { Metadata } from "next";
import Link from "next/link";
import { ActionForm, CheckboxField, ErrorSummary, SubmitButton, TextArea, TextField } from "@/components/admin/form";
import { PageHeader } from "@/components/admin/ui";
import { OWNER_ONLY, requireUser } from "@/lib/authz";
import { displayLocal } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { updateSettings } from "./actions";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser(OWNER_ONLY);
  const s = await getSettings();
  const emailReady = !!process.env.RESEND_API_KEY;
  return (
    <>
      <PageHeader title="Settings" sub="Site-wide details. Each branch has its own address and numbers under Branches." />
      <ActionForm action={updateSettings} className="flex max-w-[620px] flex-col gap-[18px]">
        <TextField name="hotelName" label="Hotel name" defaultValue={s.hotelName} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
          <TextField name="contactPhone" label="Main phone" type="tel" defaultValue={displayLocal(s.contactPhone)} />
          <TextField name="contactWhatsapp" label="Main WhatsApp" type="tel" defaultValue={displayLocal(s.contactWhatsapp)} />
        </div>
        <TextField
          name="contactEmail"
          label="Public email"
          type="email"
          hint="Optional. Shown on the privacy page for data requests."
          defaultValue={s.contactEmail}
        />
        <TextField
          name="notificationEmail"
          label="Email for new requests"
          type="email"
          hint={
            emailReady
              ? "Every new reservation request is emailed here."
              : "Email sending isn't set up yet (RESEND_API_KEY). Requests still show in the admin."
          }
          defaultValue={s.notificationEmail}
        />
        <fieldset className="m-0 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px] border-0 p-0">
          <legend className="mb-2 p-0 text-sm font-semibold">Social links (optional, shown in the footer)</legend>
          <TextField name="instagram" label="Instagram" type="url" defaultValue={s.instagram} placeholder="https://instagram.com/…" />
          <TextField name="facebook" label="Facebook" type="url" defaultValue={s.facebook} />
          <TextField name="tiktok" label="TikTok" type="url" defaultValue={s.tiktok} />
          <TextField name="x" label="X" type="url" defaultValue={s.x} />
        </fieldset>
        <TextArea
          name="houseRules"
          label="House rules"
          hint="One per line. Shown on the Book page. Check-in and check-out times come from each branch."
          defaultValue={s.houseRules}
          rows={5}
        />
        <CheckboxField name="requestsPaused" label='Pause online requests (the Book page shows "call to book")' defaultChecked={s.requestsPaused} />
        <CheckboxField name="contactIsSample" label="Contact details are samples" defaultChecked={s.contactIsSample} />
        <CheckboxField name="houseRulesIsSample" label="House rules are samples" defaultChecked={s.houseRulesIsSample} />
        <ErrorSummary />
        <div className="border-line flex gap-2.5 border-t pt-[18px]">
          <SubmitButton>Save settings</SubmitButton>
          <Link
            href="/admin"
            className="border-ink text-ink hover:text-ink inline-flex h-12 items-center rounded-full border-[1.5px] px-6 font-semibold no-underline"
          >
            Cancel
          </Link>
        </div>
      </ActionForm>
    </>
  );
}
