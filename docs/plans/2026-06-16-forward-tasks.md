# W5-W16 远期任务 — 实现计划

> 日期: 2026-06-16 | 阶段: W5-W16 | 里程碑: M3多人实时 / M4正式发布

## 决策

| 任务 | 方案 |
|------|------|
| T-019 AI | 混合策略 — generator.ts 秒出 + AI 面板按需加载 WebLLM |
| T-020 多人 | Liveblocks Presence API 快速上线 |
| T-021 自建WS | 替换 Liveblocks，完全自控 |
| T-022 加密 | Web Crypto API E2E |
| T-023 测试 | Playwright |
| T-024 文档 | 部署文档 + 技术博客 |

## 执行状态

| 任务 | 状态 | 说明 |
|------|------|------|
| T-019 🤖 AI面板 | ✅ 完成 | 混合策略: generator秒出 + AI模型按需加载 |
| T-020 👻 Liveblocks | ✅ 完成 | GhostParticles 幽灵粒子 + Liveblocks 房间配置 |
| T-021 🔌 自建WS | ✅ 完成 | Express + ws 信令服务器 + useWebSocket hook + 位置广播 |
| T-022 🔐 E2E加密 | ✅ 完成 | Web Crypto API AES-256-GCM + 密钥管理 + 导入/导出 |
| T-023 🧪 E2E测试 | ✅ 完成 | Playwright 5 个烟雾测试 + CI 配置 |
| T-024 📝 文档 | ✅ 完成 | DEPLOY.md 部署指南 + 架构 + 环境变量 |

## ✅ 全部远期任务 100% 完成

## T-019: AI 梦境生成面板 — P1, 8h

**新建文件**: `src/components/AIPanel.tsx`

**需求**:
- HudTop 新增 "🤖 AI" 按钮，打开 SlidePanel
- 面板内显示"AI 梦境生成"引导
- 默认模式: 点击生成 → 调用 `generator.ts`（秒出）
- AI 模式: 点击"加载 AI 模型" → 下载 `@mlc-ai/web-llm` 模型 → 进度条 → 加载完成后可输入提示词生成
- 模型存储到 IndexedDB，第二次打开无需重复下载
- 生成结果可"采纳"写入梦境

**修改**: `src/store/uiStore.ts` 新增 `aiPanelOpen`, `aiModelLoaded`, `aiModelLoading`
