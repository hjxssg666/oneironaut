/** 梦海 vs 诗云 功能差异对比器 — 结构化 JSON 输出 */

interface Feature {
  name: string;
  shiyun: string | boolean | number;
  oneironaut: string | boolean | number;
  gap: '🟢持平' | '🟡差距' | '🔴缺失' | '🟢领先';
  note?: string;
}

interface Category {
  name: string;
  features: Feature[];
}

const comparison: Category[] = [
  {
    name: '3D 渲染系统',
    features: [
      { name: '粒子总量', shiyun: 32657, oneironaut: 35000, gap: '🟢持平', note: '+5,000 装饰粒子' },
      { name: '粒子形状', shiyun: '柔光圆球(Canvas纹理)', oneironaut: '方块+Bloom软化', gap: '🟡差距', note: 'R3F序列化冲突导致CanvasTexture不可用' },
      { name: '粒子分布', shiyun: '噪声云团', oneironaut: '3臂对数螺线+3D值噪声', gap: '🟢持平' },
      { name: '颜色梯度', shiyun: '冷蓝→暖金双向', oneironaut: '4段深蓝→青绿→淡雾→暖金', gap: '🟢持平' },
      { name: '分层渲染', shiyun: '多前景流云层', oneironaut: '4层(星璇+情绪+流云+核心)', gap: '🟢持平' },
      { name: '点亮入场动画', shiyun: true, oneironaut: '4层stagger(0s/1.5s/3s/3.5s)', gap: '🟢持平' },
      { name: '距离感知', shiyun: true, oneironaut: true, gap: '🟢持平', note: 'opacity随相机距离衰减' },
      { name: 'Bloom后处理', shiyun: '中高强度', oneironaut: '双通道1.8+1.2', gap: '🟢持平' },
      { name: '银河旋臂', shiyun: false, oneironaut: true, gap: '🟢领先', note: '3臂对数螺线' },
      { name: '粒子连线', shiyun: false, oneironaut: true, gap: '🟢领先', note: 'DreamConnections神经脉冲' },
      { name: 'Hover高亮', shiyun: true, oneironaut: false, gap: '🔴缺失', note: 'useFrame raycaster状态循环待修复' },
      { name: 'CanvasTexture柔光', shiyun: true, oneironaut: false, gap: '🔴缺失', note: 'R3F序列化冲突' },
    ],
  },
  {
    name: '内容系统',
    features: [
      { name: '内容类型', shiyun: '中国古代诗词', oneironaut: '梦境记录+AI生成', gap: '🟢持平' },
      { name: '内容数量', shiyun: 32657, oneironaut: 35000, gap: '🟢持平' },
      { name: '内容真实性', shiyun: '真实诗歌数据库', oneironaut: '模板随机组合', gap: '🔴缺失', note: '诗云数据更丰富' },
      { name: '用户添加内容', shiyun: false, oneironaut: true, gap: '🟢领先', note: '写梦+AI演梦+虚空捞梦' },
      { name: '内容编辑', shiyun: false, oneironaut: 'CRUD完整', gap: '🟢领先', note: '编辑/删除/公开切换' },
    ],
  },
  {
    name: '交互系统',
    features: [
      { name: '点星看内容', shiyun: true, oneironaut: 'DreamCard面板', gap: '🟢持平' },
      { name: '点虚空生成', shiyun: true, oneironaut: 'onPointerMissed', gap: '🟢持平' },
      { name: '飞行控制', shiyun: 'WASD+拖拽+滚轮', oneironaut: '同款', gap: '🟢持平' },
      { name: '速度显示', shiyun: '×1.00 140单位/秒', oneironaut: '轻掠·N', gap: '🟢持平' },
      { name: 'UI隐藏', shiyun: 'H键', oneironaut: '隐·H', gap: '🟢持平' },
      { name: '搜索', shiyun: false, oneironaut: '寻星搜索', gap: '🟢领先' },
      { name: '分享', shiyun: false, oneironaut: 'URLhash+剪贴板+E2E', gap: '🟢领先' },
      { name: 'AI生成', shiyun: false, oneironaut: '演梦面板', gap: '🟢领先' },
    ],
  },
  {
    name: '筛选与分类',
    features: [
      { name: '诗体/体裁', shiyun: '五绝/七绝/五律/七律/自由', oneironaut: false, gap: '🔴缺失' },
      { name: '词频筛选', shiyun: '常用字/更多', oneironaut: false, gap: '🔴缺失' },
      { name: '情绪筛选', shiyun: false, oneironaut: '8情绪按钮', gap: '🟢领先' },
      { name: '时间线面板', shiyun: false, oneironaut: '溯流', gap: '🟢领先' },
      { name: '收藏面板', shiyun: false, oneironaut: '拾遗', gap: '🟢领先' },
    ],
  },
  {
    name: 'UI与体验',
    features: [
      { name: 'UI风格', shiyun: '极简古风文字按钮', oneironaut: '诗化玻璃面板+梦境字体', gap: '🟢持平' },
      { name: '加载进度', shiyun: '正在点亮32657位诗人', oneironaut: '落地页3段滚动+点亮动画', gap: '🟢持平' },
      { name: '入场体验', shiyun: false, oneironaut: '落地页(品牌→引言→CTA)', gap: '🟢领先' },
      { name: '新用户引导', shiyun: false, oneironaut: 'Onboarding3阶段', gap: '🟢领先' },
      { name: '画质切换', shiyun: '多档', oneironaut: '2档(星辉/薄雾)', gap: '🟡差距' },
      { name: '移动端适配', shiyun: false, oneironaut: '响应式+触控', gap: '🟢领先' },
    ],
  },
  {
    name: '架构与性能',
    features: [
      { name: '测试覆盖', shiyun: '未知', oneironaut: '31项单元测试', gap: '🟢领先' },
      { name: 'CI/CD', shiyun: '未知', oneironaut: 'GitHub Actions', gap: '🟢领先' },
      { name: '多人协作', shiyun: false, oneironaut: 'WebSocket+GhostParticles', gap: '🟢领先' },
      { name: '离线缓存', shiyun: false, oneironaut: 'IndexedDB', gap: '🟢领先' },
    ],
  },
];

/** 生成 Markdown 对比表 */
function toMarkdown(categories: Category[]): string {
  let md = '# 梦海 vs 诗云 — 功能差异对比\n\n';
  md += `> 生成时间: ${new Date().toISOString().slice(0, 10)} | 梦海 v0.2.0\n\n`;

  const counts = { 领先: 0, 持平: 0, 差距: 0, 缺失: 0 };

  for (const cat of categories) {
    md += `## ${cat.name}\n\n`;
    md += '| 功能 | 诗云 | 梦海 | 状态 |\n';
    md += '|------|------|------|:--:|\n';
    for (const f of cat.features) {
      const s = typeof f.shiyun === 'boolean' ? (f.shiyun ? '✅' : '❌') : f.shiyun;
      const o = typeof f.oneironaut === 'boolean' ? (f.oneironaut ? '✅' : '❌') : f.oneironaut;
      const gapTag = f.gap.replace('🟢持平','✅持平').replace('🟡差距','⚠️差距').replace('🔴缺失','❌缺失').replace('🟢领先','⭐领先');
      md += `| ${f.name} | ${s} | ${o} | ${gapTag} |\n`;
      if (f.note) md += `| > ${f.note} | | | |\n`;
    }
    md += '\n';
  }

  // 统计
  for (const cat of categories) {
    for (const f of cat.features) {
      const k = f.gap.includes('领先') ? '领先' : f.gap.includes('持平') ? '持平' : f.gap.includes('缺失') ? '缺失' : '差距';
      counts[k as keyof typeof counts]++;
    }
  }

  md += '## 统计\n\n';
  md += `| 指标 | 数量 |\n`;
  md += `|------|:--:|\n`;
  md += `| ⭐ 梦海领先 | ${counts['领先']} |\n`;
  md += `| ✅ 持平 | ${counts['持平']} |\n`;
  md += `| ⚠️ 有差距 | ${counts['差距']} |\n`;
  md += `| ❌ 梦海缺失 | ${counts['缺失']} |\n`;
  md += `| **总计** | **${Object.values(counts).reduce((a, b) => a + b, 0)}** |\n`;

  return md;
}

/** 生成 JSON */
function toJSON(categories: Category[]): object {
  const counts = { 领先: 0, 持平: 0, 差距: 0, 缺失: 0 };
  for (const cat of categories) {
    for (const f of cat.features) {
      const k = f.gap.includes('领先') ? '领先' : f.gap.includes('持平') ? '持平' : f.gap.includes('缺失') ? '缺失' : '差距';
      counts[k as keyof typeof counts]++;
    }
  }
  return { generatedAt: new Date().toISOString(), version: 'v0.2.0', categories, summary: counts };
}

// 模块导出
export { comparison, toMarkdown, toJSON };

// 直接运行输出 JSON
if (typeof require !== 'undefined' && require.main === module) {
  console.log(JSON.stringify(toJSON(comparison), null, 2));
}
