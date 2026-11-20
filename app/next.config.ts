import type { NextConfig } from "next";
import { resolveApiProxyTarget } from "./src/lib/proxyTarget";

const devServer = process.env.NODE_ENV !== "production";
const apiProxyTarget = resolveApiProxyTarget(process.env.API_PROXY_TARGET);

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  ...(devServer
    ? {
        async rewrites() {
          return [
            {
              source: "/v1/:path*",
              destination: `${apiProxyTarget}/v1/:path*`,
            },
            {
              source: "/health",
              destination: `${apiProxyTarget}/health`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
