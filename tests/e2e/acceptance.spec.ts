import { expect, test } from "@playwright/test";
import postgres from "postgres";
import { expectToast, lagosDate, OWNER, signIn, signOut } from "./helpers";

test.describe.configure({ mode: "serial" });

let reference = "";

test("a guest sends a reservation request from a phone in under a minute", async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const started = Date.now();

  await page.goto("/rooms/deluxe");
  await page.locator("[data-sticky-bar]").getByRole("link", { name: "Request this room" }).click();
  await expect(page.getByRole("heading", { name: "when are you coming?" })).toBeVisible();
  await expect(page.getByLabel("Room", { exact: true })).toHaveValue("deluxe");

  await page.getByLabel("Check in").fill(lagosDate(3));
  await page.getByLabel("Check out").fill(lagosDate(5));
  await page.getByLabel("Guests").selectOption("2");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "how do we reach you?" })).toBeVisible();
  // Plain-words errors beside the field.
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Please add your name.")).toBeVisible();
  await expect(page.getByText("That number looks short.")).toBeVisible();

  await page.getByLabel("Full name").fill("Tolu Adebayo");
  await page.getByLabel("Phone number").fill("0803 123 4567");
  await page.getByLabel("Anything we should know?").fill("Birthday on Friday");
  await page.getByRole("button", { name: "Send request" }).click();

  await page.waitForURL(/\/book\/sent\?ref=DC-\d{4,5}/);
  reference = new URL(page.url()).searchParams.get("ref")!;
  await expect(page.getByRole("heading", { name: reference.toLowerCase() })).toBeVisible();
  await expect(page.getByText("Deluxe room")).toBeVisible();
  await expect(page.getByText("₦70,000")).toBeVisible();
  expect(Date.now() - started).toBeLessThan(60_000);

  // The WhatsApp handoff carries the same details.
  const wa = await page.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href");
  expect(wa).toMatch(/^https:\/\/wa\.me\/2348000000000\?text=/);
  const text = decodeURIComponent(wa!.split("text=")[1]);
  expect(text).toContain(`Reference: ${reference}`);
  expect(text).toContain("Name: Tolu Adebayo");
  expect(text).toContain("Room: Deluxe room");
  expect(text).toContain("(2 nights)");
  await ctx.close();
});

test("the request appears in the admin with the email alert logged, and staff can change its status", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await expect(page.getByRole("link", { name: /New requests\s*1/ })).toBeVisible();
  await page
    .getByRole("link", { name: /Tolu Adebayo/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Tolu Adebayo" })).toBeVisible();
  await expect(page.getByText(reference, { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Call guest" })).toHaveAttribute("href", "tel:+2348031234567");
  // With no email provider configured locally, the alert attempt is still recorded in the history.
  await expect(page.getByText(/Email alert (sent|not sent)/)).toBeVisible();

  await page.getByRole("button", { name: "Confirmed", exact: true }).click();
  await expectToast(page, "Status changed to Confirmed");
  await page.reload();
  await expect(page.getByText("Status changed from New to Confirmed")).toBeVisible();
  await expect(page.getByText(/Ada Owner/).first()).toBeVisible();

  await page.getByLabel("Staff notes").fill("Arriving late, around 10pm.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expectToast(page, "Note saved");
  await expect(page.getByText("Arriving late, around 10pm.")).toBeVisible();
});

test("changing a room price in the admin updates the public site without a redeploy", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page.getByText("₦35,000").first()).toBeVisible();

  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/rooms");
  await page.getByRole("link", { name: /Deluxe room/ }).click();
  await page.getByLabel("Price per night (₦)").fill("37,500");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expectToast(page, "Saved");

  await signOut(page);
  await page.goto("/rooms");
  await expect(page.getByText("₦37,500").first()).toBeVisible();
  await page.goto("/rooms/deluxe");
  await expect(page.getByText("₦37,500").first()).toBeVisible();
});

test("admin form errors are shown in plain words", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/rooms/new");
  await page.getByLabel("Room name").fill("Twin room");
  await page.getByLabel("Price per night (₦)").fill("35,0OO");
  await page.getByRole("button", { name: "Add room" }).click();
  await expect(page.getByText("Use numbers only for the price, like 35000.")).toBeVisible();
  await expect(page.getByText("Couldn't save. Check 1 field.")).toBeVisible();
  // Nothing typed is lost.
  await expect(page.getByLabel("Room name")).toHaveValue("Twin room");
});

test("expired offers disappear from the site on their own", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/offers/new");
  await page.getByLabel("Title").fill("Last week's deal");
  await page.getByLabel("What the guest gets").fill("Should not be visible.");
  await page.getByLabel("Starts").fill(lagosDate(-10));
  await page.getByLabel("Ends").fill(lagosDate(-1));
  await page.getByRole("button", { name: "Add offer" }).click();
  await page.waitForURL(/\/admin\/offers$/);
  await expect(page.getByText("Ended").first()).toBeVisible();

  await page.goto("/admin/offers/new");
  await page.getByLabel("Title").fill("Fresh deal");
  await page.getByLabel("What the guest gets").fill("Visible right now.");
  await page.getByRole("button", { name: "Add offer" }).click();
  await page.waitForURL(/\/admin\/offers$/);

  await signOut(page);
  await page.goto("/offers");
  await expect(page.getByRole("heading", { name: "fresh deal" })).toBeVisible();
  await expect(page.getByText("last week's deal")).toHaveCount(0);
});

test("every placeholder is tagged as sample content in the admin", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await expect(page.getByText("Sample content is still live")).toBeVisible();
  await page.goto("/admin/rooms");
  // Four seeded rooms, all samples (the twin room above was never saved).
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(4);
  await page.goto("/admin/menu");
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(16);
  await page.goto("/admin/gallery");
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(10);
  await page.goto("/admin/branches");
  await expect(page.getByText("Sample", { exact: true })).toHaveCount(1);
});

test("a front desk account can't see another branch or edit prices", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);

  // A second, unpublished branch with its own reservation.
  await page.goto("/admin/branches/new");
  await page.getByLabel("Branch name").fill("Ikorodu town");
  await page.getByLabel("Street address").fill("4 Sample Road, Ikorodu, Lagos");
  await page.getByLabel("Reception phone").fill("0800 000 0001");
  await page.getByLabel("WhatsApp number").fill("0800 000 0001");
  await page.getByRole("button", { name: "Add branch" }).click();
  await page.waitForURL(/\/admin\/branches$/);
  await expect(page.getByText("Not published")).toBeVisible();

  // Invite front desk staff for the first branch.
  await page.goto("/admin/staff");
  const invite = page.locator("section").filter({ hasText: "Invite staff" });
  await invite.getByLabel("Name").fill("Funke Ajayi");
  await invite.getByLabel("Email").fill("funke@test.ng");
  await invite.getByLabel("Role").selectOption("front_desk");
  await invite.getByLabel("Branch").selectOption({ label: "Ikorodu" });
  await invite.getByRole("button", { name: "Create account" }).click();
  const temp = (await invite.locator("code").textContent())!.trim();
  expect(temp).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);

  // First sign-in forces a new password.
  await signOut(page);
  await signIn(page, "funke@test.ng", temp);
  await expect(page.getByText("Choose your own password to finish setting up your account.")).toBeVisible();
  await page.getByLabel("Temporary password").fill(temp);
  await page.getByLabel("New password", { exact: true }).fill("funke-new-password");
  await page.getByLabel("New password again").fill("funke-new-password");
  await page.getByRole("button", { name: "Change password" }).click();
  // Once the password is changed, the admin opens.
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

  // Reservations only: no rooms, prices, branches or staff.
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Admin" }).first();
  await expect(nav.getByRole("link", { name: "Reservations" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Rooms" })).toHaveCount(0);
  for (const path of ["/admin/rooms", "/admin/menu", "/admin/offers", "/admin/branches", "/admin/staff", "/admin/settings"]) {
    await page.goto(path);
    await expect(page.getByText("Not available"), path).toBeVisible();
    await expect(page.getByRole("button", { name: /Save|Add/ }), path).toHaveCount(0);
  }
  // A request at the other branch: not listed, and its page doesn't open even with the link.
  const sql = postgres(process.env.E2E_DATABASE_URL || "postgres://postgres@127.0.0.1:5433/declassic_test");
  const [{ id: otherId }] = await sql`
    insert into reservations (reference, branch_id, room_name, stay_type, check_in, check_out, name, phone, contact_method)
    select 'DC-9999', id, 'Standard room', 'overnight', current_date + 1, current_date + 2, 'Other Branch Guest', '08099999999', 'call'
    from branches where name = 'Ikorodu town' returning id`;
  await sql.end();

  await page.goto("/admin/reservations");
  await expect(page.getByText(reference).first()).toBeVisible();
  await expect(page.getByText("Other Branch Guest")).toHaveCount(0);
  await page.goto("/admin/reservations?q=DC-9999");
  await expect(page.getByText("Nothing matches", { exact: true })).toBeVisible();
  await page.goto(`/admin/reservations/${otherId}`);
  await expect(page.getByText("Not available")).toBeVisible();
  await expect(page.getByText("Other Branch Guest")).toHaveCount(0);
});

test("publishing a second branch makes the branch switcher appear", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("branch")).toHaveCount(0);

  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/branches");
  await page
    .locator("div")
    .filter({ hasText: /^Ikorodu town/ })
    .getByRole("link", { name: "Edit branch →" })
    .click();
  await page.getByLabel("Published and taking bookings").check();
  await page.getByRole("button", { name: "Save branch" }).click();
  await expectToast(page, "Saved");

  await signOut(page);
  await page.goto("/");
  const switcher = page.getByRole("banner").getByLabel("branch");
  await expect(switcher).toBeVisible();
  await switcher.selectOption({ label: "Ikorodu town" });
  // The new branch has no rooms yet, so its rooms page says so.
  await page.goto("/rooms");
  await expect(page.getByRole("heading", { name: "rooms coming soon" })).toBeVisible();
});

test("staff sign-in rejects a wrong password in plain words", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(OWNER.email);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match.")).toBeVisible();
  const res = await page.goto("/admin/reservations");
  expect(page.url()).toContain("/admin/login");
  expect(res?.ok()).toBeTruthy();
});
