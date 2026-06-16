# W3 核心业务页面 — 实现计划

> 日期: 2026-06-16 | 阶段: W3 | 预计: 11.5h

## 设计决策

| 决策 | 选择 |
|------|------|
| 落地页模式 | 叠加式 — 覆盖 3D 场景之上 |
| 落地页内容 | 渐进体验型 — 品牌 → 引言 → 入梦，滚动驱动 |
| 交互联动 | 视差联动 — 滚动驱动相机 z 轴后拉 (150→250) |
| 列表视图 | 面板浮层 — 玻璃面板侧滑，3D 场景保持可见 |
| 移动端 | 核心可用优先 — 单指滑/双指缩放/点选 |

## 任务清单

### T-007: 落地页 (Landing) — P0, 3h

**新建文件**: `src/components/Landing.tsx`

**需求**:
- 全屏叠加层，3 节滚动驱动内容
- 第 1 节 (0-33%): 品牌标题 "梦海 Oneironaut"，金色大字，淡淡入场动画
- 第 2 节 (33-66%): 诗意引言，字体变小，节奏放缓
- 第 3 节 (66-100%): "进入梦海" CTA 按钮，点击后淡出
- 滚动进度 (0→1) 通过 prop/callback 传递给 CameraController 实现视差
- 背景半透明模糊 (backdrop-filter)，与 Onboarding 同风格但更轻
- 3 个圆点指示器显示当前段落

**技术要点**:
- `position: fixed; inset: 0; z-index: 60` 覆盖层
- 监听 `wheel` 事件，累积滚动量映射到 0→1 progress
- progress 写入 uiStore 新增字段 `landingProgress: number`
- CameraController 读取 progress，`camera.position.z = 150 + progress * 100`
- 着陆后 (`progress >= 1` + 点击 CTA) 设置 `isLandingDone = true`，组件移除

**uiStore 新增**:
```ts
landingProgress: number;  // 0→1, 用于视差联动
isLandingDone: boolean;   // 落地页是否完成
```

### T-008: 时间线列表视图 — P1, 2h

**新建文件**: `src/components/TimelinePanel.tsx`

**需求**:
- 右侧滑入玻璃面板 (宽 400px, max)
- 所有梦境按 createdAt 降序排列
- 每条: 情绪色点 + 内容前 60 字 + 时间戳 + 主题标签
- 点击条目选中梦境 (selectDream)，面板不关闭
- 点击空白/关闭按钮收起面板
- 支持搜索过滤 (复用 T-008 标题内搜索输入)
- 空状态: "还没有梦境，✈ 开始飞行吧"

**触发**: HudTop 中新增 "📋 时间线" 按钮，调用 `uiStore.setView('timeline')`

### T-009: 收藏列表页 — P1, 2h

**新建文件**: `src/components/CollectionPanel.tsx`

**需求**:
- 与 TimelinePanel 共用面板容器 (玻璃侧滑，同尺寸)
- 显示 isPublic 过滤的公开梦境列表
- 每条: 情绪色点 + 内容前 60 字 + 收藏数占位
- 支持搜索过滤
- 空状态: "还没有公开梦境"
- 点击条目查看详情

**触发**: HudTop 中新增 "⭐ 拾遗" 按钮，调用 `uiStore.setView('collect')`

**重构**: 提取共用面板容器 `src/components/SlidePanel.tsx`
```tsx
<SlidePanel open={view === 'timeline'} onClose={close}>
  <TimelinePanel />
</SlidePanel>
<SlidePanel open={view === 'collect'} onClose={close}>
  <CollectionPanel />
</SlidePanel>
```

### T-010: 移动端触控适配 — P1, 2h

**新建文件**: `src/hooks/useMobileTouch.ts`

**需求**:
- 检测 `max-width: 768px` 移动端
- 落地页: wheel → touchmove (单指上下滑切换段落)
- 3D 场景: 双指 pinch 缩放 + 单指 swipe 旋转视角 + 单点 tap 选择梦境星
- HudTop 按钮缩小，HudBottom 字号缩小
- HudBottom 说明改为 "滑动转向 · 双指缩放 · 点选"
- 时间线/收藏面板全屏显示 (移动端浮层空间不够)

**CameraController 改动**:
```ts
// 新增 touch 事件监听
- touchstart/touchmove/touchend
- 单指: 旋转 (替代拖拽)
- 双指: 缩放 (替代滚轮调速)
```

### T-011: 梦境编辑功能 — P2, 1.5h

**修改文件**: `src/components/DreamCard.tsx`, `src/store/dreamStore.ts`

**需求**:
- DreamCard 详情面板新增 "✏️ 编辑" 按钮
- 点击进入编辑模式: 内容变为 textarea，情绪/主题可改
- "保存" / "取消" 按钮
- dreamStore 新增 `updateDream(id, partial)` 方法
- 编辑后同步更新 IndexedDB

### T-012: 分享链接生成 — P2, 1h

**修改文件**: `src/components/DreamCard.tsx`, `src/App.tsx`

**需求**:
- DreamCard 分享按钮改为 URL hash: `#dream=d-xxxxx`
- 点击分享: 复制 `https://梦海域名#dream=d-xxxxx` 到剪贴板
- Toast 提示 "链接已复制" (替代 alert)
- App.tsx 启动时检测 `window.location.hash`:
  - 匹配 `#dream=xxx` → 滚动到该梦境 / 高亮选中
- 打开应用时如果 hash 中有 dream id，自动选中该梦境 (selectDream)

## 执行顺序

```
T-007 (Landing) → T-008 (Timeline) → T-009 (Collection)
                                              ↓
T-010 (Mobile Touch) ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                                              ↓
T-011 (Edit) → T-012 (Share)
```

**理由**: Landing 是入口，先做；Timeline/Collection 共用 SlidePanel 容器；Mobile Touch 在所有组件完成后统一适配；Edit/Share 是 DreamCard 的功能扩展，放在最后。
