import type { NextConfig } from "next";
import { execSync } from "child_process";

// Estimate version based on git commit count (since it's a 1.x version line)
let version = "1.0.0";
try {
  const commitCount = execSync("git rev-list --count HEAD", { encoding: "utf-8" }).trim();
  version = `1.0.${commitCount}`;
} catch (error) {
  console.warn("Could not determine git commit count, defaulting version to 1.0.0");
}

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
