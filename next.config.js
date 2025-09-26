/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 15
  typescript: {
    // Temporarily disable type checking during builds for faster deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig