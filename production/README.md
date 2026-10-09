# 小手机线上前端

这是实际线上使用的原生 HTML/CSS/JavaScript，样式、共读室、表情包、语音和生活手账均已包含。`public/` 由后端映射为 `/app/`；页面入口由后端在 `/` 返回。

## 检查

无需安装 npm 依赖：

```sh
cd production
npm run check
```

## 本地开发

先按后端仓库的 `production/README.md` 组装并启动本地后端，再启动前端预览：

```sh
cd production
npm run dev
```

打开 <http://127.0.0.1:5173/>。API 默认代理到 `http://127.0.0.1:3100`，可通过 `BACKEND_URL` 修改。本地 HTTP 登录须仅在本地后端使用 `HOME_INSECURE_COOKIE=1`；线上 HTTPS 保持安全 Cookie 默认值。

修改 `public/` 后，运行后端的 `tools/refresh-release.py --frontend /path/to/qianduanku/production`，再检查并提交两个仓库。新增运行文件时也要加入后端 `release.json` 的文件清单，然后再刷新哈希。

当前线上部署不需要 Vite 构建，勿用仓库根目录的 React 原型覆盖这套文件。部署步骤见后端 [production/README.md](https://github.com/anqi52338-dev/my-app-backend/blob/main/production/README.md)。
