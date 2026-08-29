import{securityHeaders}from"./lib/platform-policy.js";

/** @type {import('next').NextConfig} */
const nextConfig={
  reactStrictMode:true,
  headers:async()=>[
    {
      source:"/(.*)",
      headers:Object.entries(securityHeaders).map(([key,value])=>({key,value})),
    },
  ],
};
export default nextConfig;
