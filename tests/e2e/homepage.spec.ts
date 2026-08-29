import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and displays main content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Suraksha/i);
    await expect(page.locator("h1")).toContainText("Freeze the trail");
    await expect(page.locator("text=SURAKSHA")).toBeVisible();
  });

  test("has emergency 1930 link", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href="tel:1930"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText("1930");
  });

  test("file upload input exists with correct accept", async ({ page }) => {
    await page.goto("/");
    const input = page.locator('input[type="file"]');
    await expect(input).toHaveAttribute("accept", /image\/(jpeg|png|webp|gif)/);
  });

  test("upload button is disabled initially", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("button", { hasText: "ANALYSE" });
    await expect(btn).toBeDisabled();
  });

  test("shows three-step process", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=STEP 01")).toBeVisible();
    await expect(page.locator("text=No typing")).toBeVisible();
    await expect(page.locator("text=Under 8 MB")).toBeVisible();
    await expect(page.locator("text=Private by design")).toBeVisible();
  });

  test("demo/prototype label visible", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("text=/demo|prototype|no live submission/i")
    ).toBeVisible();
  });

  test("service worker registered", async ({ page }) => {
    const swPromise = page.waitForResponse("**/sw.js");
    await page.goto("/");
    const swResponse = await swPromise;
    expect(swResponse.status()).toBe(200);
  });

  test("manifest linked", async ({ page }) => {
    const manifestPromise = page.waitForResponse("**/manifest.webmanifest");
    await page.goto("/");
    const manifestResponse = await manifestPromise;
    expect(manifestResponse.status()).toBe(200);
  });
});

test.describe("Accessibility", () => {
  test("has h1 heading", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("file input has associated label", async ({ page }) => {
    await page.goto("/");
    // Check label element or aria-label on the input or its parent
    const label = page.locator("label").filter({ hasText: /upload|screenshot|choose/i });
    await expect(label).toBeVisible();
  });

  test("page has lang attribute", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });
});
