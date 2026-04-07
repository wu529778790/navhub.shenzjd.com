/** @type {import("next").NextConfig} */
const nextConfig = {
  // Enable gzip compression.
  compress: true,
  // Remove the X-Powered-By header for a smaller fingerprint.
  poweredByHeader: false,
  // Keep React strict mode enabled for development diagnostics.
  reactStrictMode: true,
  // Use standalone output for Docker deployments.
  output: "standalone",
  // Prevent CDN from caching HTML pages — only static assets should be cached.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|sw\\.js).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=0, must-revalidate",
          },
        ],
      },
    ];
  },
  // Allow loading GitHub avatars through next/image.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

module.exports = nextConfig;
