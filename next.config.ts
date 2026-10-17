import type { NextConfig } from "next";

// Build APK : export statique hors-ligne (routes API écartées par scripts/build-offline.mjs)
const isStaticExport = process.env.CHILL_STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      images: { unoptimized: true },
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    }
  : {
      output: "standalone",
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    };

export default nextConfig;
