import { expect, test, type Page } from "@playwright/test";

import { resetDemoDatabase } from "../helpers/demo-db";

test.beforeEach(async () => {
  await resetDemoDatabase();
});

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

async function signUp(page: Page, name: string, email: string, password: string) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

test("sign up and sign in flows work", async ({ page }) => {
  await signUp(page, "Taylor Stone", "taylor@pulse.local", "StrongPass123A");
  await expect(page.getByRole("heading", { name: "Taylor Stone" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "taylor@pulse.local", "StrongPass123A");
});

test("a signed-in user can submit a report, see a match, and join a room", async ({ page }) => {
  await signIn(page, "jade@pulse.local", "PulseDemo123!");

  await page.goto("/report");
  await page.getByLabel("Short title").fill("Recurring leaks and mold at Eastline housing");
  await page
    .getByLabel("What happened?")
    .fill("Leaks and mold keep returning in the Eastline hallways, and residents are still waiting on real repairs.");
  await page.getByLabel("Approximate location").fill("Eastline Terrace area");
  await page.getByLabel("Institution or context tag").fill("Eastline Terrace");
  await page.getByLabel("Latitude").fill("40.7604");
  await page.getByLabel("Longitude").fill("-74.0031");
  await page.getByLabel("Occurrence date").fill("2026-04-14");
  await page.getByRole("button", { name: "Submit private report" }).click();

  await expect(page).toHaveURL(/\/report\/.+\/results$/, { timeout: 30_000 });
  await expect(page.getByText("You are not alone")).toBeVisible();
  await expect(page.getByRole("button", { name: "Join private action room" })).toBeVisible();
  await page.getByRole("button", { name: "Join private action room" }).click();

  await expect(page).toHaveURL(/\/rooms\//);
  await expect(page.getByRole("heading", { name: /action room/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Discussion thread" })).toBeVisible();
});

test("unsupported uploads and invalid report input show safe errors", async ({ page }) => {
  await page.goto("/report");
  await page.getByRole("button", { name: "Submit private report" }).click();
  await expect(page.getByText("Please review the highlighted fields.")).toBeVisible();

  await page.getByLabel("Short title").fill("Recurring campus outage in library");
  await page
    .getByLabel("What happened?")
    .fill("The library elevator keeps failing and students cannot reach the upper floors safely.");
  await page.getByLabel("Approximate location").fill("Rivergate University library");
  await page.getByLabel("Latitude").fill("40.744");
  await page.getByLabel("Longitude").fill("-73.982");
  await page.getByLabel("Occurrence date").fill("2026-04-15");
  await page.getByLabel("Evidence file").setInputFiles({
    name: "note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("unsupported"),
  });
  await page.getByRole("button", { name: "Submit private report" }).click();

  await expect(page.getByText("Please upload a JPG, PNG, WEBP image, or PDF.")).toBeVisible();
});

test("unauthorized room visitors are blocked from private content", async ({ page }) => {
  await signUp(page, "Chris Rowan", "chris@pulse.local", "Password123A");

  await page.goto("/rooms/room-housing-1");
  await expect(page.getByText("Access is limited to matched users")).toBeVisible();
  await expect(page.getByText("Discussion thread")).not.toBeVisible();
});

test("flagging a report sends it to the moderation dashboard", async ({ page }) => {
  await signIn(page, "sam@pulse.local", "PulseDemo123!");

  await page.goto("/report");
  await page.getByLabel("Short title").fill("Bus stop lighting keeps failing again");
  await page
    .getByLabel("What happened?")
    .fill("The bus stop lighting near Harbor Avenue is still out late at night and riders are reporting the same safety issue.");
  await page.getByLabel("Approximate location").fill("Harbor Avenue transit stop");
  await page.getByLabel("Institution or context tag").fill("City Transit");
  await page.getByLabel("Issue category").selectOption("Public Safety");
  await page.getByLabel("Latitude").fill("40.7314");
  await page.getByLabel("Longitude").fill("-74.0104");
  await page.getByLabel("Occurrence date").fill("2026-04-15");
  await page.getByRole("button", { name: "Submit private report" }).click();

  await expect(page).toHaveURL(/\/report\/.+\/results$/);
  await page.getByLabel("Need moderation review?").fill("Please review before showing this in public patterns.");
  await page.getByRole("button", { name: "Flag for moderator review" }).click();
  await expect(page.getByText("Thanks. The report was sent to moderation review.")).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "moderator@pulse.local", "PulseAdmin123!");
  await page.goto("/admin/moderation");

  await expect(page.getByText("Bus stop lighting keeps failing again")).toBeVisible();
});
