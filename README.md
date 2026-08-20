# dsh-remote-qr-button

馃摫 A floating phone-pairing QR button for the DeepSeek Harness Web UI.

Adds a small floating button to the bottom-right corner of the DSH WebUI
(visible only when accessed from `127.0.0.1` / `localhost`). Clicking it opens
an in-app overlay with the phone-pairing QR page, so you can scan it to connect
your phone to the harness without opening another browser tab.

## 鈿狅笍 Dependency: this plugin is a companion UI for dsh-remote-link

This plugin **does not generate QR codes itself**. The pairing page (`/qr`) is
served by [dsh-remote-link](https://github.com/BotonJ/dsh-remote-link) 鈥?the
plugin that exposes the WebUI to your LAN and mints the one-time pairing QR.
This plugin only adds a convenient entry point to that page inside the desktop
WebUI.

**Install dsh-remote-link first**, then this plugin:

```sh
dsh plugin --profile web add github:BotonJ/dsh-remote-link
dsh plugin --profile web add dsh-remote-qr-button
```

If dsh-remote-link is missing, the button still appears but shows a clear
"鏈娴嬪埌 dsh-remote-link 缃戝叧" hint instead of a dead iframe.

## How it works

- **Host half** (`lib/index.js`): registers two same-origin loopback routes 鈥?  a config probe (`GET /dsh-remote-qr-button/config`) that reads the
  `remoteLinkGateway` service port, short code and TTL at request time (no
  hardcoded ports), and a PNG proxy (`GET /dsh-remote-qr-button/qr.png`) that
  returns the live pairing image straight from the gateway.
- **Client half** (`lib/client.js`): on click, fetches the probe, then renders
  the QR as a same-origin `<img>` plus the 6-digit short code and a live
  countdown (polled every 5s).

The QR is rendered with an `<img>`, not an `<iframe>`: Electron desktop
windows block cross-origin sub-frame navigation (`will-frame-navigate`), which
would leave an iframe pointed at `http://127.0.0.1:<port>/qr` blank. Proxying
over same-origin routes keeps the overlay working in both the browser and the
DSH Desktop app.

The button id (`dsh-remote-qr-button`) matches the one dsh-remote-link's proxy
injects, so the two implementations are mutually exclusive: whichever mounts
first wins, the other skips. This plugin covers the direct `127.0.0.1:3080`
WebUI page, where remote-link's proxy injection does not run.

## Development

```
plugin/
  lib/index.js      # host half: config probe route
  lib/client.js     # client half: floating button + overlay
  cordis.patch.yml  # bundle patch inserting the plugin row
```

## License

MIT
