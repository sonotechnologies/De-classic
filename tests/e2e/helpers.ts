import { expect, type Page } from "@playwright/test";

export const OWNER = { email: "owner@test.ng", password: "owner-password-1" };

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
}

export async function signOut(page: Page) {
  await page.context().clearCookies();
}

/** ISO date in Lagos, `days` from today. */
export function lagosDate(days = 0) {
  const d = new Date(Date.now() + days * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(d);
}

export async function expectToast(page: Page, text: string | RegExp) {
  await expect(page.getByRole("status").filter({ hasText: text })).toBeVisible();
}
