const { i18n } = require('./next-i18next.config')
const webpack = require('webpack')
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net/**',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net/**',
      },
    ],
  },
  reactStrictMode: true,
  //proxy for openserum api cors
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
      }),
    )

    return config
  },
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,

    org: 'mango',
    project: 'mango-v4-ui',
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  },
)
