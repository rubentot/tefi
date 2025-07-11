import webpack from 'webpack';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other config options here...
  webpack: (config, { isServer }) => {
    // Example: Add a webpack plugin
    config.plugins.push(new webpack.DefinePlugin({
      'process.env.SOME_VAR': JSON.stringify('value'),
    }));
    return config;
  },
};

export default nextConfig;