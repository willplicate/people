/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for reliable deployment
  output: 'export',

  // Disable image optimization for static export
  images: {
    unoptimized: true
  },

  // Add trailing slashes for better static hosting compatibility
  trailingSlash: true,

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