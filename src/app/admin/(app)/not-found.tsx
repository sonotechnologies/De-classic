import Link from "next/link";
import { EmptyState } from "@/components/admin/ui";

/** Shown for records that don't exist and for screens the signed-in role can't open. */
export default function AdminNotFound() {
  return (
    <EmptyState
      title="Not available"
      body="This doesn't exist any more, or your account doesn't have access to it."
      action={
        <Link href="/admin" className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[15px] font-semibold text-white no-underline hover:text-white">
          Back to overview
        </Link>
      }
    />
  );
}
