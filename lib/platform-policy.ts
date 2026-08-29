/**
 * Platform Policy — Single source of truth for security configuration.
 *
 * Both middleware.ts and next.config.mjs import from here.
 * Changing a header value or CSP directive = one file edit.
 */

// ─── Content Security Policy ─────────────────────────────────────────

export const contentSecurityPolicy=[
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

// ─── Security Headers ────────────────────────────────────────────────

export const securityHeaders:Record<string,string>={
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "X-XSS-Protection":"1; mode=block",
  "Referrer-Policy":"strict-origin-when-cross-origin",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security":"max-age=31536000; includeSubDomains",
};

// ─── Route Exclusion ─────────────────────────────────────────────────

/**
 * Returns true if the path should be excluded from CSP headers.
 * Internal Next.js routes and static assets need to connect back to themselves.
 */
export function shouldExcludeFromCSP(pathname:string):boolean{
  return(
    pathname.startsWith("/_next")||
    pathname.startsWith("/api")||
    pathname.endsWith(".js")||
    pathname.endsWith(".css")||
    pathname.endsWith(".svg")||
    pathname.endsWith(".webmanifest")||
    pathname.endsWith(".ico")
  );
}
