# 梦海 (Oneironaut)

Web 3D 多人梦境可视化与生成平台。灵感来自 [诗云 (Poetry Cloud)](https://shiyun.cohenjikan.com)。

## 技术栈

| 技术 | 版本 |
|------|------|
| React | 19 |
| Three.js + R3F | 0.184 + 9.x |
| Zustand | 5 |
| Vite | 8 |
| TypeScript | 6 |
| WebSocket | ws + Express |

## 快速开始

```bash
# 安装依赖
npm install

# 启动前端开发服务器
npm run dev          # → http://localhost:5173

# 启动 WebSocket 服务器
npm run server       # → ws://localhost:3001

# 同时启动前后端
npm run dev:full
```

## 项目结构

```
oneironaut/
├── src/
│   ├── three/           # 3D 渲染 (R3F Canvas / 粒子 / Bloom / 相机)
│   ├── components/      # UI 组件 (HUD / 面板 / 搜索)
│   ├── pages/           # 页面 (星海 / 输入 / 设置)
│   ├── store/           # Zustand 状态管理
│   ├── data/            # 梦境数据 + 生成器
│   ├── lib/             # 工具 (存储 / 加密 / 生成器)
│   └── hooks/           # 自定义 Hook (WebSocket)
├── server/
│   └── index.ts         # Express + WebSocket 信令服务器
├── docs/                # 设计文档 & 计划
└── e2e/                 # Playwright 端到端测试
```

## 操作说明

| 操作 | 说明 |
|------|------|
| WASD | 飞行 |
| 拖拽 | 转向 |
| 滚轮 | 缩放 FOV |
| H | 隐藏 UI |
| 底部按钮 | 光纤网模式 / 画质切换 |

## 运行测试

```bash
npm test              # 单元测试 (Vitest)
npm run e2e           # 端到端测试 (Playwright)
```

## 构建 & 部署

```bash
npm run build         # 构建到 dist/
```

详见 [DEPLOY.md](DEPLOY.md)。

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `WS_PORT` | 3001 | WebSocket 端口 |
| `NODE_ENV` | development | 环境模式 |

复制 `.env.example` 为 `.env` 后修改。

## 许可证

MIT
