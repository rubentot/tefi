// next.config.js

const webpack = require("webpack")

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
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /pdf-parse\/test/,
        })
      )
    }
    return config
  },
}

module.exports = nextConfig

