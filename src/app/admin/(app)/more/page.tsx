import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/admin/actions";
import { PageHeader, Panel } from "@/components/admin/ui";
import { sectionsFor } from "@/lib/admin-nav";
import { requireUser } from "@/lib/authz";

export const metadata: Metadata = { title: "More" };

export default async function MorePage() {
  const user = await requireUser();
  const links = [
    ...sectionsFor(user.role).filter((s) => !["/admin", "/admin/reservations", "/admin/rooms"].includes(s.href)),
    { label: "Account", href: "/admin/account" },
  ];
  return (
    <>
      <PageHeader title="More" />
      <Panel className="flex flex-col">
        {links.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="border-line text-ink hover:text-ink flex min-h-14 items-center justify-between border-b px-[18px] text-base no-underline"
          >
            <span>{n.label}</span>
            <span aria-hidden="true" className="text-slate">
              ›
            </span>
          </Link>
        ))}
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-danger flex min-h-14 w-full items-center border-0 bg-transparent px-[18px] text-left text-base font-semibold"
          >
            Sign out
          </button>
        </form>
      </Panel>
    </>
  );
}
