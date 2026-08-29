import{describe,it,expect}from"vitest";
import{contentSecurityPolicy,securityHeaders,shouldExcludeFromCSP}from"../../lib/platform-policy";

describe("contentSecurityPolicy",()=>{
  it("starts with default-src 'self'",()=>expect(contentSecurityPolicy).toMatch(/^default-src 'self'/));
  it("includes frame-ancestors 'none'",()=>expect(contentSecurityPolicy).toContain("frame-ancestors 'none'"));
  it("includes base-uri 'self'",()=>expect(contentSecurityPolicy).toContain("base-uri 'self'"));
  it("includes form-action 'self'",()=>expect(contentSecurityPolicy).toContain("form-action 'self'"));
  it("is a single string",()=>expect(typeof contentSecurityPolicy).toBe("string"));
});

describe("securityHeaders",()=>{
  it("has X-Content-Type-Options: nosniff",()=>expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff"));
  it("has X-Frame-Options: DENY",()=>expect(securityHeaders["X-Frame-Options"]).toBe("DENY"));
  it("has X-XSS-Protection",()=>expect(securityHeaders["X-XSS-Protection"]).toContain("mode=block"));
  it("has HSTS",()=>expect(securityHeaders["Strict-Transport-Security"]).toContain("max-age="));
  it("has Referrer-Policy",()=>expect(securityHeaders["Referrer-Policy"]).toBeTruthy());
  it("has Permissions-Policy",()=>expect(securityHeaders["Permissions-Policy"]).toContain("camera=()"));
  it("has 6 headers total",()=>expect(Object.keys(securityHeaders)).toHaveLength(6));
});

describe("shouldExcludeFromCSP",()=>{
  it("excludes /_next/static/chunks/app.js",()=>expect(shouldExcludeFromCSP("/_next/static/chunks/app.js")).toBe(true));
  it("excludes /api/claim",()=>expect(shouldExcludeFromCSP("/api/claim")).toBe(true));
  it("excludes /icon.svg",()=>expect(shouldExcludeFromCSP("/icon.svg")).toBe(true));
  it("excludes /manifest.webmanifest",()=>expect(shouldExcludeFromCSP("/manifest.webmanifest")).toBe(true));
  it("excludes /favicon.ico",()=>expect(shouldExcludeFromCSP("/favicon.ico")).toBe(true));
  it("does NOT exclude /",()=>expect(shouldExcludeFromCSP("/")).toBe(false));
  it("does NOT exclude /about",()=>expect(shouldExcludeFromCSP("/about")).toBe(false));
});
