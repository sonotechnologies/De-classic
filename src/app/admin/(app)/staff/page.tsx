import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { ActButton } from "@/components/admin/act-button";
import { PageHeader, Panel, Tag } from "@/components/admin/ui";
import { db } from "@/db";
import { users } from "@/db/schema";
import { branchesFor } from "@/lib/admin-data";
import { OWNER_ONLY, requireUser } from "@/lib/authz";
import { displayLocal } from "@/lib/phone";
import { ROLE_LABEL } from "@/lib/status";
import { setStaffActive } from "./actions";
import { EditStaffForm, InviteForm, ResetPassword } from "./staff-forms";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireUser(OWNER_ONLY);
  const [people, branches] = await Promise.all([db.select().from(users).orderBy(asc(users.isActive), asc(users.name)), branchesFor(me)]);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const opts = branches.map((b) => ({ value: b.id, label: b.name }));
  const sorted = [...people].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader title="Staff" sub="Only people with an account here can sign in. There is no public sign-up." />
      <Panel className="flex flex-col">
        {sorted.map((p) => (
          <div key={p.id} className="border-line border-b px-[18px] py-3.5 last:border-b-0">
            <div className="flex flex-wrap items-center gap-3.5">
              <span aria-hidden="true" className="bg-aqua flex size-10 flex-none items-center justify-center rounded-full text-[15px] font-bold">
                {p.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="flex flex-[1_1_180px] flex-col gap-0.5">
                <span className="text-base font-semibold">
                  {p.name}
                  {p.id === me.id ? " (you)" : ""}
                </span>
                <span className="text-slate text-sm">
                  {p.email}
                  {p.phone ? ` · ${displayLocal(p.phone)}` : ""}
                </span>
              </div>
              <span className="text-sm font-semibold">{ROLE_LABEL[p.role]}</span>
              <span className="text-slate min-w-24 text-sm">
                {p.role === "owner" ? "All branches" : (branchName.get(p.branchId ?? "") ?? "No branch")}
              </span>
              {!p.isActive && <Tag tone="grey">Deactivated</Tag>}
            </div>
            <details className="mt-2 pl-[54px]">
              <summary className="text-teal cursor-pointer list-none text-sm font-semibold [&::-webkit-details-marker]:hidden">Manage</summary>
              <div className="mt-3 flex flex-col gap-4">
                <EditStaffForm
                  staff={{
                    id: p.id,
                    name: p.name,
                    email: p.email,
                    phone: p.phone ? displayLocal(p.phone) : "",
                    role: p.role,
                    branchId: p.branchId,
                  }}
                  branches={opts}
                />
                <ResetPassword id={p.id} />
                {p.id !== me.id && (
                  <ActButton
                    run={setStaffActive.bind(null, p.id, !p.isActive)}
                    className="text-danger self-start border-0 bg-transparent p-0 text-sm font-semibold"
                  >
                    {p.isActive ? "Deactivate account" : "Reactivate account"}
                  </ActButton>
                )}
              </div>
            </details>
          </div>
        ))}
      </Panel>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-bold">Invite staff</h2>
        <p className="text-slate m-0 max-w-[620px] text-[15px] leading-normal">
          Front desk staff see and update reservations for their branch only. Branch managers also edit rooms, prices, the menu, photos and offers for
          their branch.
        </p>
        <InviteForm branches={opts} />
      </section>
    </>
  );
}
