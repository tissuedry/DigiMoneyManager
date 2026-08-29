import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Diperlukan untuk Docker deployment (menghasilkan server.js standalone)
  output: "standalone",
  basePath: "/digimoney",
};

export default nextConfig;
