# dsh-remote-qr-button

📱 A floating phone-pairing QR button for the DeepSeek Harness Web UI.

Adds a small floating button to the bottom-right corner of the DSH WebUI
(visible only when accessed from `127.0.0.1` / `localhost`). Clicking it opens
an in-app overlay with the phone-pairing QR page, so you can scan it to connect
your phone to the harness without opening another browser tab.

## ⚠️ Dependency: this plugin is a companion UI for dsh-remote-link

This plugin **does not generate QR codes itself**. The pairing page (`/qr`) is
served by [dsh-remote-link](https://github.com/BotonJ/dsh-remote-link) — the
plugin that exposes the WebUI to your LAN and mints the one-time pairing QR.
This plugin only adds a convenient entry point to that page inside the desktop
WebUI.

**Install dsh-remote-link first**, then this plugin:

```sh
dsh plugin --profile web add github:BotonJ/dsh-remote-link
dsh plugin --profile web add dsh-remote-qr-button
```

If dsh-remote-link is missing, the button still appears but shows a clear
"未检测到 dsh-remote-link 网关" hint instead of a dead iframe.

## How it works

- **Host half** (`lib/index.js`): registers a loopback-only config probe
  (`GET /dsh-remote-qr-button/config`) that reads the `remoteLinkGateway`
  service port at request time — no hardcoded ports.
- **Client half** (`lib/client.js`): on click, fetches the probe, then loads
  `http://127.0.0.1:<port>/qr` into the overlay iframe.

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
