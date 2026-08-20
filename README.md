<div align="center">

# 📱 dsh-remote-qr-button

**DeepSeek Harness WebUI 手机配对二维码悬浮按钮**

[![npm version](https://img.shields.io/npm/v/dsh-remote-qr-button?color=blue)](https://www.npmjs.com/package/dsh-remote-qr-button)
[![license](https://img.shields.io/npm/l/dsh-remote-qr-button)](https://github.com/huaxiren6/dsh-remote-qr-button/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/huaxiren6/dsh-remote-qr-button?style=social)](https://github.com/huaxiren6/dsh-remote-qr-button)

在 DSH WebUI 右下角添加一个悬浮按钮，点击即可在应用内打开手机配对二维码，无需另开浏览器标签页。

</div>

---

## 简介

本插件是 [dsh-remote-link](https://github.com/BotonJ/dsh-remote-link) 的配套 UI：配对页（`/qr`）由 remote-link 网关提供，本插件只负责把入口放进桌面端 WebUI。

- 仅当从 `127.0.0.1` / `localhost` 访问时显示按钮
- 点击弹出应用内浮层，展示配对二维码
- 未安装 dsh-remote-link 时显示「未检测到网关」提示，而不是死链

## 安装

> 先装 dsh-remote-link，再装本插件。

```sh
dsh plugin --profile web add github:BotonJ/dsh-remote-link
dsh plugin --profile web add dsh-remote-qr-button
```

## 工作原理

- **Host 端**（`lib/index.js`）：注册两个同源路由——配置探针 `GET /dsh-remote-qr-button/config`（实时读取 `remoteLinkGateway` 服务的端口、短码与 TTL，无硬编码端口）和 PNG 代理 `GET /dsh-remote-qr-button/qr.png`（从网关取实时配对图）。
- **Client 端**（`lib/client.js`）：点击时请求探针，以同源 `<img>` 渲染二维码，同时显示 6 位短码与倒计时（每 5 秒轮询）。

二维码用 `<img>` 而非 `<iframe>`：Electron 桌面窗口会拦截跨源子框架导航，iframe 指向 `http://127.0.0.1:<port>/qr` 会渲染为空白。同源代理让浮层在浏览器和桌面端都能正常工作。

按钮 id（`dsh-remote-qr-button`）与 dsh-remote-link 代理注入的一致，两者互斥：先挂载者生效，另一个跳过。本插件覆盖直接访问 `127.0.0.1:3080` 的 WebUI 页面。

## 目录结构

```
dsh-remote-qr-button/
  lib/index.js      # host 端：配置探针路由
  lib/client.js     # client 端：悬浮按钮 + 浮层
  cordis.patch.yml  # bundle 补丁，插入插件条目
```

## License

[MIT](LICENSE)
