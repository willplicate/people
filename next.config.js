/** @type {import('next').NextConfig} */
const nextConfig = {
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