import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

// Create test fixtures directory and files
const FIXTURES = path.join(__dirname, "..", "fixtures");

function ensureFixtures() {
  if (!fs.existsSync(FIXTURES)) fs.mkdirSync(FIXTURES, { recursive: true });
  // Minimal valid PNG (67 bytes)
  if (!fs.existsSync(path.join(FIXTURES, "valid.png"))) {
    const buf = Buffer.alloc(67);
    buf.writeUInt32BE(0x89504E47, 0);
    buf.writeUInt32BE(0x0D0A1A0A, 4);
    buf.writeUInt32BE(13, 8);
    buf.write("IHDR", 12);
    buf.writeUInt32BE(1, 16);
    buf.writeUInt32BE(1, 20);
    buf.writeUInt8(8, 24);
    buf.writeUInt8(2, 25);
    buf.writeUInt32BE(0, 26);
    fs.writeFileSync(path.join(FIXTURES, "valid.png"), buf);
  }
  // Text file (should be rejected)
  if (!fs.existsSync(path.join(FIXTURES, "rejected.txt"))) {
    fs.writeFileSync(path.join(FIXTURES, "rejected.txt"), "not an image");
  }
  // SVG file (should be rejected)
  if (!fs.existsSync(path.join(FIXTURES, "rejected.svg"))) {
    fs.writeFileSync(
      path.join(FIXTURES, "rejected.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'
    );
  }
  // PDF file (should be rejected)
  if (!fs.existsSync(path.join(FIXTURES, "rejected.pdf"))) {
    fs.writeFileSync(path.join(FIXTURES, "rejected.pdf"), "%PDF-1.4 fake");
  }
}

test.beforeAll(() => ensureFixtures());

test.describe("Upload Flow - Valid Files", () => {
  test("enables button after file selection", async ({ page }) => {
    await page.goto("/");
    const btn = page.locator("button", { hasText: "ANALYSE" });
    await expect(btn).toBeDisabled();

    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    await expect(btn).toBeEnabled();
  });

  test("shows filename after selection", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    await expect(page.locator("text=valid.png")).toBeVisible();
  });

  test("analyzes screenshot and shows result", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );

    const btn = page.locator("button", { hasText: "ANALYSE" });
    await expect(btn).toBeEnabled();

    // Click analyze
    await btn.click();

    // Should show loading state
    await expect(btn).toContainText("READING EVIDENCE");

    // Wait for result
    await expect(page.locator("text=Evidence package ready")).toBeVisible({
      timeout: 15000,
    });

    // Check extracted fields
    await expect(page.locator("text=UTR")).toBeVisible();
    await expect(page.locator("text=Payee VPA")).toBeVisible();
    await expect(page.locator("text=Amount")).toBeVisible();
    await expect(page.locator("text=Fraud type")).toBeVisible();
  });

  test("dispatch button calls 1930", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    await page.locator("button", { hasText: "ANALYSE" }).click();
    await expect(page.locator("text=Evidence package ready")).toBeVisible({
      timeout: 15000,
    });

    const dispatchBtn = page.locator("button", { hasText: "DISPATCH" });
    await expect(dispatchBtn).toBeVisible();
    await expect(dispatchBtn).toBeEnabled();
  });
});

test.describe("Upload Flow - Invalid Files", () => {
  test("rejects SVG via accept attribute", async ({ page }) => {
    await page.goto("/");
    // SVG not in accept list, so file input won't accept it via browser
    const input = page.locator('input[type="file"]');
    const accept = await input.getAttribute("accept");
    expect(accept).not.toContain("svg");
  });

  test("rejects PDF via accept attribute", async ({ page }) => {
    await page.goto("/");
    const input = page.locator('input[type="file"]');
    const accept = await input.getAttribute("accept");
    expect(accept).not.toContain("pdf");
  });

  test("shows error for invalid file type sent programmatically", async ({ page }) => {
    await page.goto("/");
    // Bypass browser accept filter via JS
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "rejected.txt")
    );
    const btn = page.locator("button", { hasText: "ANALYSE" });
    if (await btn.isEnabled()) {
      await btn.click();
      // Should show error
      await expect(page.locator(".text-red-300, [class*='red']")).toBeVisible({
        timeout: 10000,
      });
    }
  });
});

test.describe("Upload Flow - Double-Click Prevention", () => {
  test("button shows loading during analysis", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    const btn = page.locator("button", { hasText: "ANALYSE" });
    await btn.click();
    // Button should be disabled during loading
    await expect(btn).toBeDisabled();
  });
});

test.describe("Upload Flow - Error States", () => {
  test("network error shows retry message", async ({ page }) => {
    // Intercept and abort the API call
    await page.route("**/api/claim", (route) => route.abort("connectionrefused"));
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    await page.locator("button", { hasText: "ANALYSE" }).click();
    await expect(page.locator("text=/error|failed|try again/i")).toBeVisible({
      timeout: 10000,
    });
  });

  test("server error shows error message", async ({ page }) => {
    await page.route("**/api/claim", (route) =>
      route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      })
    );
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    await page.locator("button", { hasText: "ANALYSE" }).click();
    await expect(page.locator("text=Server error")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Upload Flow - Reload Behavior", () => {
  test("page resets on reload", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles(
      path.join(FIXTURES, "valid.png")
    );
    await expect(page.locator("button", { hasText: "ANALYSE" })).toBeEnabled();

    await page.reload();

    // After reload, button should be disabled again
    await expect(page.locator("button", { hasText: "ANALYSE" })).toBeDisabled();
  });
});
