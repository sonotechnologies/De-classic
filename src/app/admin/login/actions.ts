"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };
  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
    return {};
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      if (code === "locked")
        return {
          error: "Too many wrong passwords. Wait 15 minutes, or ask the owner to reset it.",
          email,
        };
      return {
        error: "That email and password don't match. Try again or ask the owner to reset it.",
        email,
      };
    }
    throw e; // the successful sign-in redirect
  }
}
