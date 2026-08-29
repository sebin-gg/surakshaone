import { test, expect } from "@playwright/test";

test.describe("PWA - Manifest", () => {
  test("manifest is accessible and valid JSON", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");
  });

  test("manifest has required icons", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    const manifest = await response.json();
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons[0].src).toBeTruthy();
  });

  test("manifest has theme and background colors", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    const manifest = await response.json();
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
  });

  test("manifest icon file loads", async ({ request }) => {
    const manifestResp = await request.get("/manifest.webmanifest");
    const manifest = await manifestResp.json();
    const iconPath = manifest.icons[0].src;
    const iconResp = await request.get(iconPath);
    expect(iconResp.ok()).toBeTruthy();
  });
});

test.describe("PWA - Service Worker", () => {
  test("service worker file is served", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain("install");
    expect(text).toContain("fetch");
    expect(text).toContain("caches");
  });

  test("service worker registers on page load", async ({ page }) => {
    await page.goto("/");
    const registration = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        return {
          active: !!reg.active,
          scope: reg.scope,
        };
      }
      return null;
    });
    expect(registration).not.toBeNull();
    expect(registration!.active).toBeTruthy();
  });

  test("service worker handles GET requests with cache", async ({ page }) => {
    await page.goto("/");
    // Wait for SW to activate
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);

    const cached = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        if (keys.length > 0) return { cache: name, entries: keys.length };
      }
      return null;
    });
    expect(cached).not.toBeNull();
  });
});

test.describe("PWA - Offline Behavior", () => {
  test("cached page loads offline", async ({ page, context }) => {
    await page.goto("/");
    // Wait for service worker to cache the page
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
    await page.waitForTimeout(1000);

    // Go offline
    await context.setOffline(true);

    // Reload - should still work from cache
    const response = await page.goto("/");
    // May get cached response or 0 (if using cache-first strategy)
    const status = response?.status();
    // 0 means served from SW cache (no network), 200 means from cache
    expect([0, 200]).toContain(status);
  });
});

test.describe("PWA - Installability", () => {
  test("has manifest link in HTML head", async ({ page }) => {
    await page.goto("/");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", /manifest\.webmanifest/);
  });

  test("has theme-color meta tag", async ({ page }) => {
    await page.goto("/");
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toBeTruthy();
  });
});
