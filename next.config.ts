import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mammoth pulls in some node-only deps; keep it server-external so it isn't bundled for the client.
  serverExternalPackages: ["mammoth"],
};

export default nextConfig;
