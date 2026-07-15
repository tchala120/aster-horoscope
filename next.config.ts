import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // sharp's native build is disabled (see package.json `ignoreScripts`),
    // so skip the optimizer in the standalone runtime rather than error.
    unoptimized: true,
  },
};

export default nextConfig;
