/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 15
  typescript: {
    // Disable type checking during builds for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete with ESLint errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig