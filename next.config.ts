import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/search",
  images: {
    domains: ["hub.haeahn.com", "bim-cdn.haeahn.com"],
  },
};

export default nextConfig;
