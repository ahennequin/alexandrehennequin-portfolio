import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading the dev server from the LAN IP (e.g. testing on a phone).
  // Without this, Next 16 blocks cross-origin `/_next/*` asset requests with a
  // 403, so the page HTML renders but never hydrates.
  allowedDevOrigins: ["192.168.1.10"],
};

export default nextConfig;
