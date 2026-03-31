/** @type {import("next").NextConfig} */
const nextConfig = {
  // Enable gzip compression.
  compress: true,
  // Remove the X-Powered-By header for a smaller fingerprint.
  poweredByHeader: false,
  // Keep React strict mode enabled for development diagnostics.
  reactStrictMode: true,
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
