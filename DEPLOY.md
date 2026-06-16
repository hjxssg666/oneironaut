# 梦海 Oneironaut · 部署指南

> Web 3D 多人梦境可视化与生成平台 | 技术栈 React 19 + R3F + WebSocket

## 快速开始

```bash
# 安装依赖
npm install

# 启动 WebSocket 服务器 (端口 3001)
npm run server

# 启动开发服务器 (端口 5173)
npm run dev

# 同时启动两者
npm run dev:full
```

## 架构

```
浏览器 (React + Three.js)
  ↕ WebSocket
信令服务器 (Express + ws)
  ↕ 广播
其他用户的幽灵粒子
```

## 生产构建

```bash
npm run build    # → dist/
```

`dist/` 目录可直接部署到任意静态托管服务。

## 部署选项

### Cloudflare Pages

1. 推送代码到 GitHub
2. Cloudflare Dashboard → Pages → Connect Git
3. Build command: `npm run build`
4. Output directory: `dist`
5. 设置环境变量 `WS_PORT=3001`（如果使用自建 WS 服务器）

### 自建服务器

```bash
# 同时提供静态文件 + WebSocket
node server/index.ts
```

访问 `http://localhost:3001` 查看在线状态。

### PWA

应用支持渐进式 Web 应用安装：
- Chrome/Edge: 地址栏右侧安装按钮
- Safari: 分享菜单 → 添加到主屏幕
- 离线可用（Service Worker 缓存核心资源）

## E2E 加密

梦境内容通过 AES-256-GCM 端到端加密：
- 密钥存储在浏览器 `localStorage`
- 加密/解密完全在客户端执行
- 密钥可通过 `exportKey()` / `importKey()` 共享

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WS_PORT` | 3001 | WebSocket 服务器端口 |
| `NODE_ENV` | development | 环境模式 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 3D 渲染 | Three.js + React Three Fiber |
| 状态管理 | Zustand 5 |
| 持久化 | IndexedDB |
| 通信 | WebSocket (ws) |
| 加密 | Web Crypto API (AES-256-GCM) |
| 构建 | Vite 8 |
| 测试 | Playwright |
| 样式 | Tailwind CSS + CSS Custom Properties |

## 性能

- 画质自动检测（基于 GPU / CPU / DPR）
- 粒子数分级：高 3000 / 中 1500 / 低 500
- FBM 着色器 6 层分形噪声
- FPS 实时监控

## 许可证

MIT
