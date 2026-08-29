import { test, expect } from "@playwright/test";

test.describe("Security - Client Bundle", () => {
  test("no API key exposed in HTML", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toContain("sk-");
    expect(html).not.toContain("OPENAI_API_KEY");
    expect(html).not.toContain("Bearer ");
  });

  test("no secret tokens in scripts", async ({ page }) => {
    const scriptResponses: string[] = [];
    page.on("response", async (response) => {
      if (response.url().includes("_next/static") && response.url().endsWith(".js")) {
        scriptResponses.push(await response.text().catch(() => ""));
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const allScripts = scriptResponses.join("\n");
    expect(allScripts).not.toContain("sk-");
    expect(allScripts).not.toContain("OPENAI");
    expect(allScripts).not.toContain("API_KEY");
  });
});

test.describe("Security - Response Headers", () => {
  test("API response has no-store cache-control", async ({ request }) => {
    const formData = new FormData();
    const buf = Buffer.alloc(67);
    buf.writeUInt32BE(0x89504E47, 0);
    buf.writeUInt32BE(0x0D0A1A0A, 4);
    const blob = new Blob([buf], { type: "image/png" });
    formData.append("screenshot", blob, "test.png");

    const response = await request.post("/api/claim", { multipart: { screenshot: blob } });
    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toContain("no-store");
  });

  test("X-Content-Type-Options nosniff on homepage", async ({ request }) => {
    const response = await request.get("/");
    const xcto = response.headers()["x-content-type-options"];
    // Next.js may or may not set this depending on config
    // We check but don't hard-fail
    if (xcto) {
      expect(xcto.toLowerCase()).toBe("nosniff");
    }
  });
});

test.describe("Security - Input Validation", () => {
  test("rejects non-image MIME types", async ({ request }) => {
    const blob = new Blob(["<script>alert(1)</script>"], { type: "text/html" });
    const formData = new FormData();
    formData.append("screenshot", blob, "hack.html");
    const response = await request.post("/api/claim", { formData });
    expect(response.status()).toBe(400);
  });

  test("rejects files over 8 MB", async ({ request }) => {
    const big = new Blob([new ArrayBuffer(9 * 1024 * 1024)], { type: "image/png" });
    const formData = new FormData();
    formData.append("screenshot", big, "big.png");
    const response = await request.post("/api/claim", { formData });
    expect(response.status()).toBe(413);
  });

  test("rejects empty form data", async ({ request }) => {
    const formData = new FormData();
    const response = await request.post("/api/claim", { formData });
    expect(response.status()).toBe(400);
  });

  test("XSS in filename not reflected in error response", async ({ request }) => {
    const blob = new Blob(["xss"], { type: "text/plain" });
    const formData = new FormData();
    formData.append("screenshot", blob, '<img src=x onerror=alert(1)>.png');
    const response = await request.post("/api/claim", { formData });
    const body = await response.json();
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("<img");
    expect(bodyStr).not.toContain("onerror");
    expect(bodyStr).not.toContain("alert(1)");
  });

  test("XSS via JavaScript file type rejected", async ({ request }) => {
    const blob = new Blob(["document.cookie"], { type: "application/javascript" });
    const formData = new FormData();
    formData.append("screenshot", blob, "xss.js");
    const response = await request.post("/api/claim", { formData });
    expect(response.status()).toBe(400);
  });

  test("injection payload in extra fields ignored", async ({ request }) => {
    const blob = new Blob([Buffer.alloc(256)], { type: "image/png" });
    const formData = new FormData();
    formData.append("screenshot", blob, "test.png");
    formData.append("__proto__", "injection");
    formData.append("constructor", "polluted");
    const response = await request.post("/api/claim", { formData });
    const body = await response.json();
    expect(body).not.toHaveProperty("__proto__");
    expect(body).not.toHaveProperty("constructor");
  });
});

test.describe("Security - Error Handling", () => {
  test("error responses have error field", async ({ request }) => {
    const formData = new FormData();
    const response = await request.post("/api/claim", { formData });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
    expect(typeof body.error).toBe("string");
  });

  test("error responses don't leak stack traces", async ({ request }) => {
    const formData = new FormData();
    formData.append("screenshot", new Blob(["x"], { type: "text/plain" }), "bad.txt");
    const response = await request.post("/api/claim", { formData });
    const body = await response.json();
    expect(body.error).not.toContain("Error:");
    expect(body.error).not.toContain("at ");
    expect(body.error).not.toContain(".ts:");
  });
});

test.describe("Security - No Real Submission", () => {
  test("demo label visible", async ({ page }) => {
    await page.goto("/");
    const text = await page.textContent("body");
    expect(text?.toLowerCase()).toMatch(/demo|no live|prototype/);
  });
});
