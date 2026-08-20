window.__ModuleLoader__.load({
  id: 'dsh-remote-qr-button',
  factory: () => {
    const module = { exports: {} }
    const exports = module.exports
    const inject = []

    // Same element id as the button dsh-remote-link's proxy injects, so the two
    // implementations are mutually exclusive: whichever mounts first wins and
    // the other skips (both guard with getElementById). This plugin covers the
    // direct 127.0.0.1:3080 WebUI page, where remote-link's proxy injection
    // does not run.
    //
    // The QR is rendered via a same-origin <img> + polling the config probe
    // instead of an <iframe>: Electron desktop windows block cross-origin
    // sub-frame navigation (will-frame-navigate), which would leave the
    // iframe blank. The host half proxies both the pairing image
    // (/dsh-remote-qr-button/qr.png) and the short-code/TTL data
    // (/dsh-remote-qr-button/config).
    const BTN_ID = 'dsh-remote-qr-button'
    const CONFIG_PATH = '/dsh-remote-qr-button/config'
    const QR_IMG_PATH = '/dsh-remote-qr-button/qr.png'

    async function gatewayInfo() {
      try {
        const res = await fetch(CONFIG_PATH, { cache: 'no-store' })
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    }

    function apply(ctx) {
      ctx.effect(() => {
        try {
        const local = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
        if (!local || document.getElementById(BTN_ID)) return () => {}
        const style = document.createElement('style')
        style.id = 'dsh-remote-qr-style'
        style.textContent = `
          #${BTN_ID}{position:fixed;right:22px;bottom:22px;z-index:2147483645;width:50px;height:50px;border:0;border-radius:16px;background:linear-gradient(145deg,#60a5fa,#4f46e5);color:#fff;font-size:23px;box-shadow:0 12px 34px #0006;cursor:pointer}
          #dsh-remote-qr-overlay{position:fixed;inset:0;z-index:2147483646;background:#000a;display:none;align-items:center;justify-content:center;padding:20px}
          #dsh-remote-qr-card{width:min(430px,94vw);height:min(650px,88vh);background:#111;border:1px solid #ffffff22;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px #000b;display:flex;flex-direction:column}
          #dsh-remote-qr-head{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#fff;font:600 15px system-ui;flex:none}
          #dsh-remote-qr-close{border:0;background:transparent;color:#fff;font-size:28px;cursor:pointer}
          #dsh-remote-qr-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;min-height:0}
          #dsh-remote-qr-img{width:min(300px,80%);image-rendering:pixelated;background:#fff;border-radius:12px;padding:8px;box-sizing:border-box}
          #dsh-remote-qr-short{font-size:28px;letter-spacing:8px;color:#fff;font:600 28px/1 system-ui;margin:0}
          #dsh-remote-qr-ttl{color:#888;font:400 13px system-ui;margin:0}
          #dsh-remote-qr-missing{flex:1;display:flex;align-items:center;justify-content:center;color:#fca5a5;font:500 14px system-ui;padding:24px;text-align:center;line-height:1.7}
        `
        const button = document.createElement('button')
        button.id = BTN_ID
        button.title = '鎵嬫満杩炴帴浜岀淮鐮?
        button.textContent = '馃摫'
        const overlay = document.createElement('div')
        overlay.id = 'dsh-remote-qr-overlay'
        overlay.innerHTML = `<div id="dsh-remote-qr-card"><div id="dsh-remote-qr-head"><span>鎵嬫満杩炴帴 路 鎵爜閰嶅</span><button id="dsh-remote-qr-close">脳</button></div><div id="dsh-remote-qr-body"><img id="dsh-remote-qr-img" alt="閰嶅浜岀淮鐮?><p id="dsh-remote-qr-short"></p><p id="dsh-remote-qr-ttl"></p><div id="dsh-remote-qr-missing" style="display:none"></div></div></div>`
        const img = overlay.querySelector('#dsh-remote-qr-img')
        const shortEl = overlay.querySelector('#dsh-remote-qr-short')
        const ttlEl = overlay.querySelector('#dsh-remote-qr-ttl')
        const missing = overlay.querySelector('#dsh-remote-qr-missing')
        const body = overlay.querySelector('#dsh-remote-qr-body')
        let pollTimer = null
        let countdown = null
        let left = 0

        const stopTimers = () => {
          if (pollTimer !== null) { clearInterval(pollTimer); pollTimer = null }
          if (countdown !== null) { clearInterval(countdown); countdown = null }
        }
        const showMissing = (text) => {
          img.style.display = 'none'
          shortEl.style.display = 'none'
          ttlEl.style.display = 'none'
          missing.style.display = 'flex'
          missing.textContent = text
        }
        const showPairing = (info) => {
          img.style.display = ''
          shortEl.style.display = ''
          ttlEl.style.display = ''
          missing.style.display = 'none'
          img.src = QR_IMG_PATH + '?t=' + Date.now()
          shortEl.textContent = info.shortCode ?? ''
          if (typeof info.secondsLeft === 'number') {
            left = info.secondsLeft
            ttlEl.textContent = `鏈厤瀵?${left}s 鍐呮湁鏁?路 鍒版湡鑷姩鎹㈡柊鐮乣
            if (countdown !== null) clearInterval(countdown)
            countdown = setInterval(() => {
              left -= 1
              ttlEl.textContent = `鏈厤瀵?${Math.max(0, left)}s 鍐呮湁鏁?路 鍒版湡鑷姩鎹㈡柊鐮乣
              if (left <= 0) refresh()
            }, 1000)
          }
        }
        const refresh = async () => {
          const info = await gatewayInfo()
          if (info === null || info.available !== true) {
            showMissing('鏈娴嬪埌 dsh-remote-link 缃戝叧銆俓n鏈彃浠舵槸 dsh-remote-link 鐨勯厤濂?UI锛岃鍏堝畨瑁?dsh-remote-link锛坓ithub:BotonJ/dsh-remote-link锛夈€?)
            return
          }
          showPairing(info)
        }
        button.onclick = () => {
          overlay.style.display = 'flex'
          stopTimers()
          refresh()
          pollTimer = setInterval(refresh, 5000)
        }
        overlay.onclick = event => { if (event.target === overlay) close() }
        overlay.querySelector('#dsh-remote-qr-close').onclick = close
        function close() {
          overlay.style.display = 'none'
          stopTimers()
        }
        document.head.appendChild(style)
        document.body.append(button, overlay)
        return () => { button.remove(); overlay.remove(); style.remove() }
        } catch (e) { console.error('[dsh-remote-qr-button] 鎸傝浇琚烦杩?', e) }
      })
    }
    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
