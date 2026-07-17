import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // In production, Cloudflare only routes /queue* to this app — every other
  // path (/css, /js, /assets, /partials) already hits GitHub Pages directly,
  // so no rewrite is needed there. Locally there's no Cloudflare in front of
  // us, so mirror that routing by proxying those paths to the live site.
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      { source: "/css/:path*", destination: "https://frugal-innovations.com/css/:path*" },
      { source: "/js/:path*", destination: "https://frugal-innovations.com/js/:path*" },
      { source: "/assets/:path*", destination: "https://frugal-innovations.com/assets/:path*" },
      { source: "/partials/:path*", destination: "https://frugal-innovations.com/partials/:path*" },
    ];
  },
};

export default nextConfig;
