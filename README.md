# 当前线上版本（production）

网站：<https://homehomeanan.icu/>。当前生产代码位于 `production/`，不是仓库根目录的旧原型。

- 前端仓库：<https://github.com/anqi52338-dev/qianduanku/tree/main/production>
- 后端仓库：<https://github.com/anqi52338-dev/my-app-backend/tree/main/production>
- 快照：`20261009T132420Z`，前后端各有同一份 `release.json`，里面是线上运行文件的 SHA-256。
- 腾讯云目前运行目录：`/home/ubuntu/our-home`，服务：`our-home.service`，Node 端口：`127.0.0.1:3100`。

两个仓库组合后还原当前网站；不能用旧 React 根目录的 `npm run build` 替代当前前端。根目录旧项目保留供参考，继续开发请修改 `production/`。

功能包括聊天、服务器记忆、朋友圈、日记、TXT/EPUB 共读室、GIF/WebP 表情包、ElevenLabs 语音、历史搜索与引用、对话收藏、信箱、书影、日程提醒、周期记录、模拟拉黑/小纸条、独立无痕/模型测试窗口，以及导出与恢复。

数据库、上传文件、聊天记录、Claude 登录信息、真实 API Key 和 `voice-config.json` 均不提交 Git。

详见 [部署与开发说明](PRODUCTION.md)。

---

## 旧 React 原型说明（保留参考）

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
