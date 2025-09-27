/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use regular Next.js deployment to allow environment variables at runtime
  // output: 'export', // Commented out to allow env vars

  // Keep image optimization disabled for better compatibility
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