import { createProxyMiddleware } from 'http-proxy-middleware'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
module.exports = function (app: any) {
  app.use(
    '/openSerumApi',
    createProxyMiddleware({
      target: 'https://openserum.io/api/serum/',
      changeOrigin: true,
    }),
  )
}
