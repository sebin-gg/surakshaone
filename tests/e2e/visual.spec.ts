import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 568 },
  { name: "mobile-360", width: 360, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-412", width: 412, height: 915 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];

test.describe("Visual - Screenshot Capture", () => {
  for (const vp of VIEWPORTS) {
    test(`captures full page at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveScreenshot(`${vp.name}-homepage.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }
});

test.describe("Visual - Overflow Detection", () => {
  for (const vp of VIEWPORTS) {
    test(`no overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      const overflow = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return {
          bodyOverflow: body.scrollWidth > html.clientWidth,
          fixedElements: Array.from(document.querySelectorAll("*")).some((el) => {
            const style = window.getComputedStyle(el);
            if (style.position === "fixed" || style.position === "sticky") {
              const rect = el.getBoundingClientRect();
              return rect.right > html.clientWidth || rect.left < 0;
            }
            return false;
          }),
        };
      });
      expect(overflow.bodyOverflow).toBe(false);
      expect(overflow.fixedElements).toBe(false);
    });
  }
});

test.describe("Visual - Text Visibility", () => {
  test("all text visible on 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    // Check key elements are visible
    const elements = [
      page.locator("h1"),
      page.locator("text=SURAKSHA"),
      page.locator('a[href="tel:1930"]'),
    ];
    for (const el of elements) {
      const box = await el.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(320 + 1); // Allow 1px tolerance
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
  });

  test("button not clipped on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const btn = page.locator("button", { hasText: "ANALYSE" });
    const box = await btn.boundingBox();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 1);
    }
  });

  test("emergency link visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const link = page.locator('a[href="tel:1930"]');
    await expect(link).toBeVisible();
  });
});

test.describe("Visual - Contrast", () => {
  test("body text has sufficient contrast", async ({ page }) => {
    await page.goto("/");
    const contrast = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      const bg = style.backgroundColor;
      const color = style.color;
      return { bg, color };
    });
    // Basic check: text color should be light (high RGB values) on dark background
    const textMatch = contrast.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (textMatch) {
      const [, r, g, b] = textMatch.map(Number);
      // Text should be relatively bright
      expect(r + g + b).toBeGreaterThan(150);
    }
  });
});

test.describe("Visual - Upload State", () => {
  test("upload area has dashed border", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const label = page.locator("label").filter({ hasText: /choose|screenshot/i });
    const style = await label.evaluate((el) => {
      return window.getComputedStyle(el).borderStyle;
    });
    expect(style).toContain("dashed");
  });
});
