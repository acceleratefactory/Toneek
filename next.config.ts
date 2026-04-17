import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set the Turbopack workspace root to silence the lockfile
  // detection warning and prevent the middleware.js.nft.json error on Vercel.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
