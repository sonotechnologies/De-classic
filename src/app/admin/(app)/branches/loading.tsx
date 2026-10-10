import { TableSkeleton, TitleSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return (
    <>
      <TitleSkeleton />
      <TableSkeleton />
    </>
  );
}
