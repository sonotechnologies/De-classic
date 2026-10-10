import { ActionForm, ErrorSummary, SubmitButton, TextField } from "@/components/admin/form";
import { Notice, PageHeader } from "@/components/admin/ui";
import type { StaffUser } from "@/lib/authz";
import { ROLE_LABEL } from "@/lib/status";
import { changePassword } from "./actions";

/** Also shown in place of every admin screen until a new staff member replaces their temporary password. */
export function AccountScreen({ me }: { me: StaffUser }) {
  return (
    <>
      <PageHeader title="Account" sub={`${me.name} · ${me.email} · ${ROLE_LABEL[me.role]}`} />
      {me.mustChangePassword && <Notice tone="warn">Choose your own password to finish setting up your account.</Notice>}
      <ActionForm action={changePassword} resetOnSuccess className="flex max-w-[420px] flex-col gap-[18px]">
        <h2 className="m-0 text-lg font-bold">Change password</h2>
        <TextField
          name="current"
          label={me.mustChangePassword ? "Temporary password" : "Current password"}
          type="password"
          autoComplete="current-password"
        />
        <TextField
          name="next"
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters. A short sentence is easy to remember."
        />
        <TextField name="confirm" label="New password again" type="password" autoComplete="new-password" />
        <ErrorSummary />
        <SubmitButton className="self-start">Change password</SubmitButton>
      </ActionForm>
    </>
  );
}
