import type { Metadata } from "next";
import Link from "next/link";
import { ReservationList } from "@/components/admin/reservation-list";
import { EmptyState, Notice, PageHeader, Panel, PanelHead } from "@/components/admin/ui";
import { overviewStats, overbookingFor, sampleCounts } from "@/lib/admin-data";
import { requireUser } from "@/lib/authz";
import { plural } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const user = await requireUser();
  const [stats, samples] = await Promise.all([overviewStats(user), sampleCounts(user)]);
  const warnings = await overbookingFor(stats.latest);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Lagos",
  });

  const tiles = [
    {
      label: "New requests",
      value: stats.newCount,
      href: "/admin/reservations?status=new",
      highlight: true,
    },
    {
      label: "Today's arrivals",
      value: stats.arrivals,
      href: "/admin/reservations?when=today",
    },
    {
      label: "Requests this week",
      value: stats.week,
      href: "/admin/reservations",
    },
  ];

  return (
    <>
      <PageHeader title="Overview" sub={today} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={`rounded-card border-line text-ink hover:text-ink flex flex-col gap-1.5 border p-[18px] no-underline ${t.highlight ? "bg-aqua" : "hover:bg-row-hover bg-white"}`}
          >
            <span className="text-sm">{t.label}</span>
            <span className="text-4xl leading-none font-bold tracking-[-0.02em]">{t.value}</span>
          </Link>
        ))}
      </div>

      {samples && samples.length > 0 && (
        <Notice tone="warn">
          <strong>Sample content is still live:</strong>{" "}
          {samples.map((s, i) => (
            <span key={s.href}>
              {i > 0 && ", "}
              <Link href={s.href} className="text-sample-ink font-semibold">
                {s.href === "/admin/settings" ? s.label : plural(s.n, s.one, s.label)}
              </Link>
            </span>
          ))}
          . Replace these with real details before you share the site.
        </Notice>
      )}

      {user.role === "owner" && stats.perBranch.length > 0 && (
        <Panel>
          <PanelHead>Requests this week by branch</PanelHead>
          {stats.perBranch.map((b) => (
            <div key={b.name} className="border-line flex justify-between gap-4 border-b px-[18px] py-3.5 text-[15px] last:border-b-0">
              <span>{b.name}</span>
              <span className="font-semibold">
                {plural(b.total, "request")} · {b.confirmed} confirmed
              </span>
            </div>
          ))}
        </Panel>
      )}

      <div className="flex items-center justify-between">
        <h2 className="m-0 text-lg font-bold">Latest requests</h2>
        <Link href="/admin/reservations" className="text-sm font-semibold no-underline">
          See all →
        </Link>
      </div>
      {stats.latest.length ? (
        <ReservationList rows={stats.latest} showBranch={user.role === "owner"} warnings={new Set(warnings.keys())} />
      ) : (
        <EmptyState title="No requests yet" body="Requests from the website appear here as soon as guests send them, and you'll get an email too." />
      )}
    </>
  );
}
