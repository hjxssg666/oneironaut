/** 基于模板的虚空梦境生成器
 * 在词汇池中随机组合，构造类似梦境的片段
 */

const subjects = [
  '一只白鹤', '一条透明的鱼', '一座倒悬的城市', '钟表', '一面镜子',
  '风', '雨滴', '一根羽毛', '一个书架', '灯塔',
];

const verbs = [
  '飞过', '沉入', '溶解在', '穿越', '悬停在',
  '缠绕着', '浮在', '变成了', '穿过了', '推开',
];

const objects = [
  '云层', '深海', '月光里', '时间的边缘', '镜面的另一边',
  '回音里', '沙漏底部', '遗忘的房间里', '星空的缝隙', '童年的门',
];

const moods = [
  '一点声音都没有。', '好像一切都已经发生过。', '我忽然说不出话。',
  '那种熟悉感让我想哭。', '我明白这是梦，但不想醒。',
  '它反过来看了我一眼。', '周围全是雾。', '我的脚离开了地面。',
];

const emotions = ['serene', 'joy', 'fear', 'anger', 'sorrow', 'mystic', 'anxious', 'nostalgic'] as const;
const themePool = ['飞行', '水', '时间', '记忆', '声音', '城市', '自然', '自我', '孤独', '距离', '变化', '星星'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export interface GeneratedDream {
  content: string;
  emotion: string;
  themes: string[];
  timestamp: number;
}

/** 生成一段 3-5 句的梦境片段 */
export function generateVoidDream(): GeneratedDream {
  const sentenceCount = 3 + Math.floor(Math.random() * 3);
  const sentences: string[] = [];

  for (let i = 0; i < sentenceCount; i++) {
    const s = pick(subjects);
    const v = pick(verbs);
    const o = pick(objects);
    sentences.push(`${s}${v}${o}。`);
  }

  // 再加一句情绪结语
  sentences.push(pick(moods));

  return {
    content: sentences.join(''),
    emotion: pick(emotions),
    themes: pickN(themePool, 2 + Math.floor(Math.random() * 2)),
    timestamp: Date.now(),
  };
}
