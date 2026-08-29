import { defineConfig, devices } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 2,
  workers: 3,
  reporter: [
    ["html", { outputFolder: "./test-report", open: "never" }],
    ["json", { outputFile: "./test-report/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: BASE,
    screenshot: "on",
    trace: "on-first-retry",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome 1920×1080",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: "Desktop Chrome 1366×768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
    {
      name: "Desktop Firefox 1920×1080",
      use: { ...devices["Desktop Firefox"], viewport: { width: 1920, height: 1080 } },
    },
    {
      name: "Mobile iPhone SE 375×667",
      use: { ...devices["iPhone SE"], viewport: { width: 375, height: 667 } },
    },
    {
      name: "Mobile iPhone 14 390×844",
      use: { ...devices["iPhone 14"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "Mobile Galaxy S20 360×800",
      use: { ...devices["Pixel 5"], viewport: { width: 360, height: 800 } },
    },
    {
      name: "Mobile Small 320×568",
      use: { ...devices["iPhone SE"], viewport: { width: 320, height: 568 } },
    },
    {
      name: "Tablet iPad 768×1024",
      use: { ...devices["iPad (gen 7)"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "Mobile Landscape",
      use: { ...devices["iPhone 14"], viewport: { width: 844, height: 390 } },
    },
    {
      name: "Tablet Landscape",
      use: { ...devices["iPad (gen 7)"], viewport: { width: 1024, height: 768 } },
    },
  ],
});
