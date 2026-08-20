export const name = 'dsh-remote-qr-button'
export const inject = []

/**
 * Host half: exposes same-origin endpoints so the client can render the
 * pairing QR without cross-origin navigation.
 *
 * The plugin is a UI companion to dsh-remote-link: the QR pairing page lives
 * on the remote-link gateway (`/qr`, port `remoteLinkGateway.port`). Electron
 * desktop windows block cross-origin sub-frame navigation, so an iframe to
 * `http://127.0.0.1:<port>/qr` renders blank there. Instead this host half
 * proxies the two pieces over same-origin routes:
 *
 *   /dsh-remote-qr-button/config  -> { available, port, shortCode, secondsLeft }
 *   /dsh-remote-qr-button/qr.png  -> the live pairing PNG (gateway-generated)
 *
 * `webServer` is captured lazily via `ctx.inject` (same pattern as
 * dsh-remote-link) so this plugin also loads in hosts where webServer is not
 * a hard-injectable service (e.g. the desktop main process); if it is never
 * available the plugin simply does nothing.
 */
export function apply(ctx) {
  let webServer = null
  let cleanup = () => {}
  try {
    ctx.inject?.(['webServer'], (scoped) => {
      webServer = scoped.webServer
      cleanup()
      if (webServer === undefined || webServer === null) return
      const removeConfig = webServer.register({
        kind: 'exact',
        path: '/dsh-remote-qr-button/config',
        handler: (req, res) => {
          const gateway = ctx.get('remoteLinkGateway', false)
          const port = gateway?.port ?? null
          let shortCode = null
          let secondsLeft = null
          if (gateway?.pairingSnapshot) {
            try {
              const snap = gateway.pairingSnapshot()
              if (snap !== null && snap !== undefined) {
                shortCode = snap.shortCode ?? null
                secondsLeft = Math.max(0, Math.round((snap.expiresAt - Date.now()) / 1000))
              }
            } catch { /* pairing snapshot unavailable */ }
          }
          const available = port !== null && typeof gateway?.qrImage === 'function'
          res.setHeader('content-type', 'application/json')
          res.setHeader('cache-control', 'no-store')
          res.end(JSON.stringify({ available, port, shortCode, secondsLeft }))
        },
      })
      const removePng = webServer.register({
        kind: 'exact',
        path: '/dsh-remote-qr-button/qr.png',
        handler: (req, res) => {
          const gateway = ctx.get('remoteLinkGateway', false)
          let png = null
          if (gateway?.qrImage) {
            try { png = gateway.qrImage() } catch { /* ignore */ }
          }
          if (png === null || png === undefined) {
            res.writeHead(404)
            res.end()
            return
          }
          res.setHeader('content-type', 'image/png')
          res.setHeader('cache-control', 'no-store')
          res.end(png)
        },
      })
      cleanup = () => {
        removeConfig()
        removePng()
      }
    })
  } catch { /* hosts without lazy-inject API: plugin stays inert */ }
  ctx.effect(() => cleanup)
}

export default { name, inject, apply }
