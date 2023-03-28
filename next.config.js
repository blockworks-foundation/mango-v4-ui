const { i18n } = require('./next-i18next.config')
const webpack = require('webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    domains: ['raw.githubusercontent.com', 'arweave.net'],
  },
  reactStrictMode: true,
  //proxy for openserum api blocking cors
  rewrites: async () => {
    return [
      {
        source: '/openSerumApi/:path*',
        destination: 'https://openserum.io/api/serum/:path*',
      },
    ]
  },
  webpack: (config, opts) => {
    if (!opts.isServer) {
      // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
      }
    }

    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env': {
          BUILD_ID: JSON.stringify(opts.buildId),
        },
      })
    )

    return config
  },
}

module.exports = nextConfig
