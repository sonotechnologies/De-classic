import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import { AccountScreen } from "./account/account-screen";
import { Sidebar, TabBar } from "@/components/admin/nav";
import { ToastProvider } from "@/components/admin/toast";
import { db } from "@/db";
import { branches, reservations } from "@/db/schema";
import { sectionsFor } from "@/lib/admin-nav";
import { requireUser } from "@/lib/authz";
import { ROLE_LABEL } from "@/lib/status";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · De Classic admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const scope = user.role === "owner" ? undefined : eq(reservations.branchId, user.branchId!);
  const [[{ n: newCount }], branch] = await Promise.all([
    db
      .select({ n: count() })
      .from(reservations)
      .where(and(eq(reservations.status, "new"), scope)),
    user.branchId
      ? db.query.branches.findFirst({
          where: eq(branches.id, user.branchId),
          columns: { name: true },
        })
      : null,
  ]);

  const sections = sectionsFor(user.role);
  const items = sections.map((s) => ({
    label: s.label,
    href: s.href,
    count: s.href === "/admin/reservations" ? newCount : undefined,
  }));
  const tabHrefs = ["/admin", "/admin/reservations", "/admin/rooms"];
  const tabs = [...items.filter((i) => tabHrefs.includes(i.href)), { label: "More", href: "/admin/more" }];
  const moreHrefs = ["/admin/more", "/admin/account", ...items.filter((i) => !tabHrefs.includes(i.href)).map((i) => i.href)];
  const where = user.role === "owner" ? "all branches" : (branch?.name ?? "");

  return (
    <ToastProvider>
      <div className="flex min-h-svh bg-white">
        <Sidebar
          items={items}
          footer={
            <>
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-slate text-[13px]">
                {ROLE_LABEL[user.role]} · {where}
              </span>
              <Link href="/admin/account" className="mt-1.5 text-sm no-underline">
                Account
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="text-teal border-0 bg-transparent p-0 text-sm">
                  Sign out
                </button>
              </form>
            </>
          }
        />
        <main className="min-w-0 flex-1 px-4 pt-4 pb-24 md:px-10 md:pt-8 md:pb-16">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-6">
            <div className="-mb-2 flex items-center justify-between md:hidden">
              <span className="font-display text-xl font-extrabold tracking-[-0.05em]">de classic</span>
              <span className="text-slate text-[13px]">{user.role === "owner" ? "All branches" : `${where} branch`}</span>
            </div>
            {/* First sign-in with a temporary password: nothing else opens until it is changed. */}
            {user.mustChangePassword ? <AccountScreen me={user} /> : children}
          </div>
        </main>
      </div>
      <TabBar tabs={tabs} moreHrefs={moreHrefs} />
    </ToastProvider>
  );
}
