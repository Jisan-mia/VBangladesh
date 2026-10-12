import type { NextConfig } from 'next';

// A deploy build without SITE_URL would quietly ship a noindex site with localhost preview images, so stop it loudly.
if (process.env.DEPLOY === '1' && !process.env.SITE_URL) throw new Error('SITE_URL is required for deploy builds (DEPLOY=1).');

const security = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  // No tool uses the camera, microphone or location (photos come from a file picker).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Phones on the same Wi-Fi open the dev server by its LAN address (npm run dev:phone).
  allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*', '172.*.*.*', '*.local'],
  async headers() {
    return [
      { source: '/:path*', headers: security },
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // Thumbnails and share images keep their names when a tool is redesigned, so cache for a week, not forever.
      { source: '/previews/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      { source: '/social/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
    ];
  },
};
export default config;
