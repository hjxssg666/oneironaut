/**
 * 海量梦境生成器 — 螺旋 + FBM 有机分布
 *
 * 策略：
 *   1. 4 条对数螺旋臂（银河系骨架）
 *   2. FBM 噪声扰动角度/高度/半径（消除机械感）
 *   3. 中心幂律密集、边缘稀疏
 *   4. 臂间有足够粒子过渡（无空洞、无团块）
 */
import type { Dream } from '../store/dreamStore';

const IR = 25, OR = 380;
const EMOTIONS = ['sorrow', 'fear', 'anxious', 'nostalgic', 'mystic', 'anger', 'joy', 'serene'] as const;
const DREAM_TYPES = ['碎片', '叙事', '长梦', '短歌'] as const;

// ====== 哈希 ======
export function hash(x: number, y: number, z: number): number {
  let v = x * 374761393 + y * 668265263 + z * 1440677083;
  return (((v ^ (v >> 13)) * 1274126177) >>> 0 & 0x7fffffff) / 0x7fffffff;
}

// ====== 3D Perlin / FBM ======
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
export function perlin(x: number, y: number, z: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  return lerp(
    lerp(lerp(hash(ix, iy, iz), hash(ix + 1, iy, iz), ux),
         lerp(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), ux), uy),
    lerp(lerp(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), ux),
         lerp(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), ux), uy), uz);
}
export function fbm(x: number, y: number, z: number, octaves = 4): number {
  let v = 0, amp = 0.5, total = 0;
  for (let i = 0; i < octaves; i++) {
    v += perlin(x * (1 << i), y * (1 << i), z * (1 << i)) * amp;
    total += amp; amp *= 0.5;
  }
  return v / total;
}

// ====== FBM 主导有机分布:微弱螺旋倾向 ======
const NS = 0.005;
const BRANCHES = 4;
const WEAK_TWIST = 0.15;
const MAX_R = OR;

function softGauss(a: number, b: number, c: number): number { return (a+b+c)/3; }

function cloudPos(idx: number): [number, number, number] {
  const t = idx / 3600;
  const r = IR + (OR - IR) * Math.pow(t, 0.7);
  const rt = r / MAX_R;

  // 微弱螺旋偏向
  const h = hash(idx, 1, 2);
  const weakBranch = Math.floor(h * BRANCHES) / BRANCHES * Math.PI * 2;
  const weakTwist = rt * WEAK_TWIST * Math.PI * 2;
  // 臂内大幅随机散布
  const ah=hash(idx,3,4), bh=hash(idx,5,6), ch=hash(idx,7,8);
  const armDev = (softGauss(ah,bh,ch)-0.5)*3.0;
  // 全局随机角度
  const randAngle = (hash(idx,9,10)-0.5)*Math.PI*2*(0.5+0.5*(1-rt));

  const angle = weakBranch + weakTwist + armDev + randAngle;

  const bulge = 1 + Math.max(0,0.45-rt)*2.6;
  const yh=hash(idx,11,12);
  let y=(yh-0.5)*r*0.25*bulge;
  y*=0.7; // 棉花态球体

  let x=r*Math.cos(angle), z=r*Math.sin(angle);

  // FBM大扭曲
  const wXY=120, wY=50;
  const dx=(fbm(x*NS,y*NS,z*NS,4)-0.5)*wXY;
  const dy=(fbm(x*NS+5,y*NS,z*NS+3,4)-0.5)*wY;
  const dz=(fbm(x*NS+10,y*NS,z*NS+7,4)-0.5)*wXY;

  return [x+dx, y+dy, z+dz];
}

// ====== 梦境内容 ======
const SUBJECTS = ['我', '他', '她', '我们', '那只猫', '一片落叶', '童年的影子', '月光', '深海', '一阵风', '一面镜', '某个人', '时间', '无尽的雨', '记忆', '星空', '一条路', '那扇门', '一声叹息', '梦里的声音', '迷雾', '远方', '老照片', '水面的倒影'];
const VERBS = ['穿过', '沉入', '飞越', '凝视', '听见', '触摸', '溶解在', '飘向', '坠入', '拥抱着', '追逐着', '遗忘了', '编织着', '回响在'];
const OBJECTS = ['云层', '深渊', '花园', '走廊', '灯塔', '雪原', '篝火旁', '雨林', '海底', '星河', '旧房间', '春天的第一片叶', '空无一人的车站', '镜中的世界'];

function genDreamContent(idx: number, _emotion: string): string {
  const s1 = SUBJECTS[idx % SUBJECTS.length];
  const s2 = SUBJECTS[(idx * 7 + 3) % SUBJECTS.length];
  const v1 = VERBS[(idx * 3) % VERBS.length];
  const v2 = VERBS[(idx * 5 + 2) % VERBS.length];
  const o1 = OBJECTS[(idx * 4) % OBJECTS.length];
  const o2 = OBJECTS[(idx * 7 + 1) % OBJECTS.length];
  const templates = [
    `${s1}。${s2}${v1}了${o1}。`,
    `${s1}${v1}${o1}。在${o1}里，${s2}静静地不再说话。`,
    `我${v1}${o1}。远处，${s2}正${v2}${o2}。`,
    `${s1}${v2}${o2}，然后${v1}了${o1}。`,
    `在${o1}深处，${s1}${v2}了${s2}。`,
    `${o1}的边缘，${s1}看见${s2}正在${v1}。`,
  ];
  return templates[idx % templates.length];
}

function genThemeDreamContent(idx: number, theme: string): string {
  const s1 = SUBJECTS[(idx * 13 + 7) % SUBJECTS.length];
  const v1 = VERBS[(idx * 11 + 1) % VERBS.length];
  const o1 = OBJECTS[(idx * 9 + 2) % OBJECTS.length];
  return [`${s1}${v1}了${o1}。`, `在${o1}里，${s1}遇见了一个${theme}。`, `${s1}${v1}了${o1}，那是关于${theme}的梦。`][idx % 3];
}

// ====== 导出 ======
interface SubDream {
  emotion: string;
  content: string;
  position: [number, number, number];
}

let _cache: { dreams: Dream[]; subDreams: Map<string, SubDream[]> } | null = null;

export function getMassDreams(): { dreams: Dream[]; subDreams: Map<string, SubDream[]> } {
  if (_cache) return _cache;

  const dreams: Dream[] = [];
  const subDreams = new Map<string, SubDream[]>();

  for (let i = 0; i < 3600; i++) {
    const emotion = EMOTIONS[i % EMOTIONS.length];
    const pos = cloudPos(i);
    const subCount = 130 + Math.floor(hash(i, 3000, 0) * 210); // 130~339
    const dream: Dream = {
      id: `star-${i}`,
      content: genDreamContent(i, emotion),
      emotion,
      type: DREAM_TYPES[i % DREAM_TYPES.length],
      themes: [SUBJECTS[i % SUBJECTS.length], OBJECTS[(i * 3) % OBJECTS.length]],
      isPublic: true,
      position: pos,
      subCount,
      createdAt: Date.now() - Math.random() * 86400000 * 30,
    };
    dreams.push(dream);

    const subs: SubDream[] = [];
    for (let s = 0; s < subCount; s++) {
      const subEmo = EMOTIONS[s % EMOTIONS.length];
      const phi = Math.acos(2 * hash(i, s + 100, 0) - 1);
      const theta = hash(i, s + 200, 0) * Math.PI * 2;
      const dist = 8 + hash(i, s + 300, 0) * 16;
      subs.push({
        emotion: subEmo,
        content: genThemeDreamContent(i + s, subEmo),
        position: [
          pos[0] + Math.sin(phi) * Math.cos(theta) * dist,
          pos[1] + Math.cos(phi) * dist,
          pos[2] + Math.sin(phi) * Math.sin(theta) * dist,
        ],
      });
    }
    subDreams.set(dream.id, subs);
  }

  _cache = { dreams, subDreams };
  return _cache;
}
