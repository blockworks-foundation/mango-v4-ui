const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    domains: ['raw.githubusercontent.com', 'arweave.net'],
  },
  reactStrictMode: true,
  webpack: (config, opts) => {
    if (!opts.isServer) {
      // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
      }
    }

    return config
  },
}

module.exports = nextConfig
