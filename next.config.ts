import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['unpdf', 'pdfjs-dist'],
};

export default nextConfig;