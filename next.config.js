const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  env: {
    BROWSER: true,
  },
  images: {
    domains: ['raw.githubusercontent.com', 'arweave.net'],
  },
  reactStrictMode: true,
  webpack: (config, opts) => {
    if (!opts.isServer) {
      // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        os: false,
        path: false,
        process: false,
        util: false,
        assert: require.resolve('assert'),
        stream: false,
        http: false,
        https: false,
        querystring: false,
      }
    }

    return config
  },
}

module.exports = nextConfig
