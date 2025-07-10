/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        if (request?.includes("pdf-parse/test")) {
          return callback(null, "commonjs " + request)
        }
        callback()
      })
    }
    return config
  },
}

export default nextConfig
