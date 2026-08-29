import { test, expect } from "@playwright/test";

test.describe("Performance - Metrics", () => {
  test("First Contentful Paint under 3 seconds", async ({ page }) => {
    await page.goto("/");
    const fcp = await page.evaluate(() => {
      const entry = performance.getEntriesByName("first-contentful-paint")[0] as PerformanceEntry;
      return entry ? entry.startTime : null;
    });
    if (fcp !== null) {
      expect(fcp).toBeLessThan(3000);
      console.log(`FCP: ${fcp.toFixed(0)}ms`);
    }
  });

  test("Time to Interactive under 5 seconds", async ({ page }) => {
    await page.goto("/");
    const tti = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return nav ? nav.domInteractive : null;
    });
    if (tti !== null) {
      expect(tti).toBeLessThan(5000);
      console.log(`TTI: ${tti.toFixed(0)}ms`);
    }
  });

  test("Largest Contentful Paint under 4 seconds", async ({ page }) => {
    await page.goto("/");
    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const last = entries[entries.length - 1];
          resolve(last ? last.startTime : null);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });
    if (lcp !== null) {
      expect(lcp).toBeLessThan(4000);
      console.log(`LCP: ${lcp.toFixed(0)}ms`);
    }
  });
});

test.describe("Performance - Bundle Size", () => {
  test("total JS under 500KB", async ({ page }) => {
    const resources: number[] = [];
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("_next/static") && url.endsWith(".js")) {
        const body = await response.body().catch(() => null);
        if (body) resources.push(body.length);
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const total = resources.reduce((a, b) => a + b, 0);
    console.log(`Total JS: ${(total / 1024).toFixed(1)}KB`);
    expect(total).toBeLessThan(500 * 1024);
  });

  test("no large images loaded unnecessarily", async ({ page }) => {
    const images: { url: string; size: number }[] = [];
    page.on("response", async (response) => {
      const ct = response.headers()["content-type"] || "";
      if (ct.includes("image/")) {
        const body = await response.body().catch(() => null);
        if (body) images.push({ url: response.url(), size: body.length });
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    images.forEach((img) => {
      console.log(`Image: ${img.url} - ${(img.size / 1024).toFixed(1)}KB`);
      expect(img.size).toBeLessThan(500 * 1024); // No image > 500KB
    });
  });
});

test.describe("Performance - Layout Stability", () => {
  test("no layout shift on 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let score = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              score += (entry as any).value;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
        setTimeout(() => resolve(score), 3000);
      });
    });
    console.log(`CLS: ${cls}`);
    expect(cls).toBeLessThan(0.1);
  });

  test("no horizontal overflow on 320px screen", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });

  test("no horizontal overflow on 390px screen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });

  test("no horizontal overflow on 1920px screen", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);
  });
});

test.describe("Performance - API Timeout", () => {
  test("API responds within 45 seconds (server timeout)", async ({ page }) => {
    const start = Date.now();
    const response = await page.request.post("/api/claim", {
      multipart: {
        screenshot: {
          name: "test.png",
          mimeType: "image/png",
          buffer: Buffer.alloc(1024),
        },
      },
    });
    const elapsed = Date.now() - start;
    console.log(`API response time: ${elapsed}ms`);
    // Should respond within 45 seconds (server-side timeout)
    expect(elapsed).toBeLessThan(45000);
  });
});
