import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="bg-aqua-tint flex min-h-svh flex-col items-center justify-center px-5 py-8">
      <div className="border-line flex w-full max-w-[400px] flex-col gap-5 rounded-[20px] border bg-white p-8">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[28px] leading-none font-extrabold tracking-[-0.05em]">de classic</span>
          <h1 className="text-slate m-0 text-[15px] font-normal">Staff sign in</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
