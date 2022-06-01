/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BROWSER: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        os: false,
        path: false,
        process: false,
        util: false,
        assert: false,
        stream: false,
        http: false,
        https: false,
        querystring: false,
        events: false,
      }
    }

    return config
  },
}

module.exports = nextConfig
