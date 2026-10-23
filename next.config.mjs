import path from "node:path";
import { fileURLToPath } from "node:url";
import { contentSecurityPolicy, securityHeaders } from "./lib/platform-policy.mjs";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        ...Object.entries(securityHeaders).map(([key, value]) => ({ key, value })),
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
      ],
    },
  ],
};

export default nextConfig;
