import type { Metadata } from "next";
import { requireUser } from "@/lib/authz";
import { AccountScreen } from "./account-screen";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  return <AccountScreen me={await requireUser()} />;
}
