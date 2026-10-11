import type { NextConfig } from 'next';

// Phones on the same Wi-Fi open the dev server by its LAN address (npm run dev:phone).
const config: NextConfig = { poweredByHeader: false, devIndicators: false, allowedDevOrigins: ['127.0.0.1', '192.168.*.*', '10.*.*.*', '172.*.*.*', '*.local'] };
export default config;
