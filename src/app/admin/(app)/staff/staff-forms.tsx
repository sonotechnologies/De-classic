"use client";

import { useState, useTransition } from "react";
import { ActionForm, ErrorSummary, SelectField, SubmitButton, TextField } from "@/components/admin/form";
import { useToast } from "@/components/admin/toast";
import type { ActionState } from "@/lib/admin-actions";
import { inviteStaff, resetStaffPassword, updateStaff } from "./actions";

type Opt = { value: string; label: string };
export type StaffRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId: string | null;
};

const ROLES: Opt[] = [
  { value: "front_desk", label: "Front desk · reservations for their branch" },
  { value: "manager", label: "Branch manager · everything for their branch" },
  { value: "owner", label: "Owner · everything, every branch" },
];

function StaffFields({ branches, staff }: { branches: Opt[]; staff?: StaffRow }) {
  const [role, setRole] = useState(staff?.role ?? "front_desk");
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <TextField name="name" label="Name" defaultValue={staff?.name} autoComplete="off" />
        <TextField name="email" label="Email" type="email" defaultValue={staff?.email} autoComplete="off" hint="They sign in with this." />
      </div>
      <TextField name="phone" label="Phone" type="tel" defaultValue={staff?.phone} hint="Optional." />
      <SelectField name="role" label="Role" options={ROLES} value={role} onChange={(e) => setRole(e.target.value)} />
      {role !== "owner" && <SelectField name="branchId" label="Branch" options={branches} defaultValue={staff?.branchId ?? branches[0]?.value} />}
    </>
  );
}

function TempPassword({ data }: { data: Record<string, string> }) {
  return (
    <div role="status" className="rounded-field bg-aqua-tint flex flex-col gap-1.5 p-4 text-[15px] leading-normal">
      <span>
        Temporary password for <strong>{data.name}</strong>:
      </span>
      <code className="self-start rounded-[8px] bg-white px-3 py-1.5 text-lg font-semibold tracking-wide">{data.temp}</code>
      <span className="text-slate text-[13px]">
        {data.emailed === "yes"
          ? "We emailed it to them too. "
          : data.emailed === "no"
            ? "Email isn't set up, so give it to them in person or by WhatsApp. "
            : "Give it to them in person or by WhatsApp. "}
        It&apos;s shown once. They choose their own password when they first sign in.
      </span>
    </div>
  );
}

export function InviteForm({ branches }: { branches: Opt[] }) {
  const [result, setResult] = useState<Record<string, string> | null>(null);
  return (
    <ActionForm
      action={inviteStaff}
      resetOnSuccess
      onDone={(s: ActionState) => setResult(s.data ?? null)}
      className="flex max-w-[620px] flex-col gap-3"
    >
      <StaffFields branches={branches} />
      <ErrorSummary />
      <SubmitButton className="self-start">Create account</SubmitButton>
      {result && <TempPassword data={result} />}
    </ActionForm>
  );
}

export function EditStaffForm({ staff, branches }: { staff: StaffRow; branches: Opt[] }) {
  return (
    <ActionForm action={updateStaff.bind(null, staff.id)} className="flex max-w-[620px] flex-col gap-3">
      <StaffFields branches={branches} staff={staff} />
      <ErrorSummary />
      <SubmitButton className="h-11 self-start text-[15px]">Save</SubmitButton>
    </ActionForm>
  );
}

export function ResetPassword({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [asking, setAsking] = useState(false);
  const toast = useToast();
  if (data) return <TempPassword data={data} />;
  return asking ? (
    <span className="flex flex-wrap items-center gap-3 text-sm">
      Give them a new temporary password?
      <button type="button" onClick={() => setAsking(false)} className="border-0 bg-transparent font-semibold">
        Cancel
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await resetStaffPassword(id);
            if (!r.ok) return toast(r.formError ?? "Couldn't reset it.", "error");
            setData(r.data ?? null);
          })
        }
        className="text-danger border-0 bg-transparent font-semibold"
      >
        Reset password
      </button>
    </span>
  ) : (
    <button type="button" onClick={() => setAsking(true)} className="text-teal self-start border-0 bg-transparent p-0 text-sm font-semibold">
      Reset password…
    </button>
  );
}
