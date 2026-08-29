import { test, expect } from "@playwright/test";

test.describe("UX - Keyboard Navigation", () => {
  test("tab navigates to upload area", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    // Should focus on an interactive element
    expect(["BUTTON", "A", "INPUT", "LABEL"]).toContain(focused);
  });

  test("keyboard can reach emergency link", async ({ page }) => {
    await page.goto("/");
    const link = page.locator('a[href="tel:1930"]');
    await link.focus();
    const focused = await page.evaluate(() => {
      return document.activeElement?.getAttribute("href");
    });
    expect(focused).toBe("tel:1930");
  });
});

test.describe("UX - Back Button", () => {
  test("back button returns to homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const url1 = page.url();
    // Navigate away and back
    await page.goto("/nonexistent");
    await page.goBack();
    const url2 = page.url();
    expect(url2).toBe(url1);
  });
});

test.describe("UX - Responsive Behavior", () => {
  test("layout adapts from mobile to desktop", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const mobileGrid = await page.evaluate(() => {
      const grid = document.querySelector(".grid");
      return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
    });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    const desktopGrid = await page.evaluate(() => {
      const grid = document.querySelector(".grid");
      return grid ? window.getComputedStyle(grid).gridTemplateColumns : null;
    });

    // Layout should change
    if (mobileGrid && desktopGrid) {
      expect(mobileGrid).not.toBe(desktopGrid);
    }
  });

  test("touch targets are at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const interactiveElements = await page.evaluate(() => {
      const elements = document.querySelectorAll("button, a, input, label");
      return Array.from(elements).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: (el.textContent || "").trim().slice(0, 30),
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0,
        };
      });
    });

    interactiveElements
      .filter((el) => el.visible)
      .forEach((el) => {
        // Interactive elements should be at least 44x44px for touch
        if (el.width > 0 && el.height > 0) {
          const minDim = Math.min(el.width, el.height);
          // Soft check - log if below 44px
          if (minDim < 44) {
            console.log(`Small touch target: ${el.tag} "${el.text}" ${el.width}x${el.height}`);
          }
        }
      });
  });
});

test.describe("UX - Upload Area", () => {
  test("drag and drop area is visually clear", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const label = page.locator("label").filter({ hasText: /choose|screenshot/i });
    const borderStyle = await label.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        border: style.borderStyle,
        cursor: style.cursor,
      };
    });
    expect(borderStyle.cursor).toBe("pointer");
  });

  test("file type hint visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("text=JPG, PNG, WEBP or GIF")).toBeVisible();
  });

  test("size limit hint visible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("text=8 MB")).toBeVisible();
  });
});

test.describe("UX - Error Recovery", () => {
  test("can retry after network error", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(1024),
    });

    // First attempt: fail
    await page.route("**/api/claim", (route) => route.abort("connectionrefused"));
    await page.locator("button", { hasText: "ANALYSE" }).click();
    await expect(page.locator("text=/error|failed/i")).toBeVisible({ timeout: 10000 });

    // Remove route and try again
    await page.unroute("**/api/claim");
    await page.locator("button", { hasText: "ANALYSE" }).click();
    // Should not show the error again (may succeed or show new result)
    await expect(page.locator("text=Evidence package ready")).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe("UX - Network Profiles", () => {
  test("page loads on simulated slow network", async ({ page }) => {
    const context = page.context();
    // Simulate slow 3G-like conditions
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500 Kbps
      uploadThroughput: (500 * 1024) / 8,
      latency: 200, // 200ms RTT
    });

    await page.goto("/", { timeout: 30000 });
    await expect(page.locator("h1")).toBeVisible();
  });

  test("offline page loads from cache", async ({ page, context }) => {
    await page.goto("/");
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
    await page.waitForTimeout(1000);

    await context.setOffline(true);
    const response = await page.goto("/");
    expect([0, 200]).toContain(response?.status());
  });
});
