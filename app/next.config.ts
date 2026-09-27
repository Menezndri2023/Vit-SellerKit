import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const isDev = process.env.NODE_ENV !== 'production';

// No user accounts or secrets in the browser: a strict-but-simple CSP without nonces
// (Next.js inline scripts need 'unsafe-inline' unless every page is rendered with a nonce).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // The app lives in a monorepo folder: trace files from here, not from a parent lockfile
  outputFileTracingRoot: process.cwd(),
  // PDF generation runs in Node.js with its own font files
  serverExternalPackages: ['@react-pdf/renderer', '@stackforge-eu/factur-x', 'libxml2-wasm'],
  // Fonts, ICC profile and the Factur-X XSD schemas are read from disk at runtime
  outputFileTracingIncludes: { '/**': ['./assets/**/*', './node_modules/@stackforge-eu/factur-x/schema/**/*', './node_modules/libxml2-wasm/**/*.wasm'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default createNextIntlPlugin()(nextConfig);
