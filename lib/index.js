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
 *   /dsh-remote-qr-button/qr.png  -> the live pairing PNG (proxied from the gateway)
 *
 * The gateway's own HTTP surface (/qr.png, /status.json) is the source of
 * truth 鈥?this avoids depending on the exact shape of the remoteLinkGateway
 * service object across hosts. `webServer` is captured lazily via `ctx.inject`
 * (same pattern as dsh-remote-link) so the plugin also loads in hosts where
 * webServer is not a hard-injectable service (e.g. the desktop main process).
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
        handler: async (req, res) => {
          const gateway = ctx.get('remoteLinkGateway', false)
          const port = gateway?.port ?? null
          let shortCode = null
          let secondsLeft = null
          // Prefer the gateway service's snapshot when present鈥?          if (gateway?.pairingSnapshot) {
            try {
              const snap = gateway.pairingSnapshot()
              if (snap !== null && snap !== undefined) {
                shortCode = snap.shortCode ?? null
                secondsLeft = Math.max(0, Math.round((snap.expiresAt - Date.now()) / 1000))
              }
            } catch { /* fall through to HTTP probe */ }
          }
          // 鈥therwise probe the gateway's own loopback status endpoint.
          if (shortCode === null && port !== null) {
            try {
              const r = await fetch(`http://127.0.0.1:${port}/status.json`, { signal: AbortSignal.timeout(2000) })
              if (r.ok) {
                const data = await r.json()
                if (data?.pairing) {
                  shortCode = data.pairing.shortCode ?? null
                  secondsLeft = data.pairing.secondsLeft ?? null
                }
              }
            } catch { /* gateway unreachable */ }
          }
          const available = port !== null && shortCode !== null
          res.setHeader('content-type', 'application/json')
          res.setHeader('cache-control', 'no-store')
          res.end(JSON.stringify({ available, port, shortCode, secondsLeft }))
        },
      })
      const removePng = webServer.register({
        kind: 'exact',
        path: '/dsh-remote-qr-button/qr.png',
        handler: async (req, res) => {
          const gateway = ctx.get('remoteLinkGateway', false)
          const port = gateway?.port ?? null
          let png = null
          // Prefer the gateway service's image generator when present鈥?          if (gateway?.qrImage) {
            try { png = gateway.qrImage() } catch { /* ignore */ }
          }
          // 鈥therwise proxy the gateway's own /qr.png.
          if (png === null && port !== null) {
            try {
              const r = await fetch(`http://127.0.0.1:${port}/qr.png`, { signal: AbortSignal.timeout(3000) })
              if (r.ok) png = Buffer.from(await r.arrayBuffer())
            } catch { /* gateway unreachable */ }
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
