export const name = 'dsh-remote-qr-button'
export const inject = ['webServer']

/**
 * Host half: exposes a loopback config probe so the client can learn the
 * dsh-remote-link gateway port at runtime instead of hardcoding 3081.
 *
 * The plugin is a UI companion to dsh-remote-link: the QR page itself lives on
 * the remote-link gateway (`/qr`), which provides the `remoteLinkGateway`
 * service ({ port }) once its gateway has started. When remote-link is absent
 * the probe reports `available: false` and the client shows a hint instead of
 * a dead iframe.
 */
export function apply(ctx) {
  const remove = ctx.webServer.register({
    kind: 'exact',
    path: '/dsh-remote-qr-button/config',
    handler: (req, res) => {
      const gateway = ctx.get('remoteLinkGateway', false)
      const port = gateway?.port ?? null
      res.setHeader('content-type', 'application/json')
      res.setHeader('cache-control', 'no-store')
      res.end(JSON.stringify({ available: port !== null, port }))
    },
  })
  ctx.effect(() => remove)
}

export default { name, inject, apply }
