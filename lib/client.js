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
    const BTN_ID = 'dsh-remote-qr-button'
    const CONFIG_PATH = '/dsh-remote-qr-button/config'

    async function gatewayPort() {
      try {
        const res = await fetch(CONFIG_PATH, { cache: 'no-store' })
        if (!res.ok) return null
        const data = await res.json()
        return data.available ? data.port : null
      } catch {
        return null
      }
    }

    function apply(ctx) {
      ctx.effect(() => {
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
          #dsh-remote-qr-frame{width:100%;flex:1;border:0;background:#111}
          #dsh-remote-qr-missing{flex:1;display:flex;align-items:center;justify-content:center;color:#fca5a5;font:500 14px system-ui;padding:24px;text-align:center;line-height:1.7}
        `
        const button = document.createElement('button')
        button.id = BTN_ID
        button.title = '鎵嬫満杩炴帴浜岀淮鐮?
        button.textContent = '馃摫'
        const overlay = document.createElement('div')
        overlay.id = 'dsh-remote-qr-overlay'
        overlay.innerHTML = `<div id="dsh-remote-qr-card"><div id="dsh-remote-qr-head"><span>鎵嬫満杩炴帴 路 鎵爜閰嶅</span><button id="dsh-remote-qr-close">脳</button></div><iframe id="dsh-remote-qr-frame" title="鎵嬫満杩炴帴浜岀淮鐮?></iframe><div id="dsh-remote-qr-missing" style="display:none"></div></div>`
        button.onclick = async () => {
          const port = await gatewayPort()
          const frame = document.getElementById('dsh-remote-qr-frame')
          const missing = document.getElementById('dsh-remote-qr-missing')
          if (port === null) {
            frame.style.display = 'none'
            missing.style.display = 'flex'
            missing.textContent = '鏈娴嬪埌 dsh-remote-link 缃戝叧銆俓n鏈彃浠舵槸 dsh-remote-link 鐨勯厤濂?UI锛岃鍏堝畨瑁?dsh-remote-link锛坓ithub:BotonJ/dsh-remote-link锛夈€?
          } else {
            missing.style.display = 'none'
            frame.style.display = ''
            frame.src = 'http://127.0.0.1:' + port + '/qr?t=' + Date.now()
          }
          overlay.style.display = 'flex'
        }
        overlay.onclick = event => { if (event.target === overlay) overlay.style.display = 'none' }
        document.head.appendChild(style)
        document.body.append(button, overlay)
        document.getElementById('dsh-remote-qr-close').onclick = () => { overlay.style.display = 'none' }
        return () => { button.remove(); overlay.remove(); style.remove() }
      })
    }
    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
