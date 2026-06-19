
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDreamStore } from '../store/dreamStore';
import { useUIStore } from '../store/uiStore';
import { useCameraStore } from '../store/cameraStore';

// ===== 共享随机函数 =====
const rand = (i: number, salt: number): number => {
  const v = ((i * 374761393 + salt * 668265263) >>> 0);
  return (((v ^ (v >> 13)) * 1274126177) >>> 0 & 0x7fffffff) / 0x7fffffff;
};

// ===== 三次贝塞尔曲线（诗云风格弧线） =====
const BEZIER_PTS = 81; // 保留为声明（贝塞尔采样用qp.bezierPts动态）
function bezierSample(
  p0x: number, p0y: number, p0z: number,
  p1x: number, p1y: number, p1z: number,
  p2x: number, p2y: number, p2z: number,
  p3x: number, p3y: number, p3z: number,
  t: number,
): [number, number, number] {
  const u = 1 - t, u2 = u * u, u3 = u2 * u;
  const t2 = t * t, t3 = t2 * t;
  return [
    u3 * p0x + 3 * u2 * t * p1x + 3 * u * t2 * p2x + t3 * p3x,
    u3 * p0y + 3 * u2 * t * p1y + 3 * u * t2 * p2y + t3 * p3y,
    u3 * p0z + 3 * u2 * t * p1z + 3 * u * t2 * p2z + t3 * p3z,
  ];
}

// ==================== 8 情绪色 ====================
const EMOTION_COLOR: Record<string, { r: number; g: number; b: number }> = {
  sorrow:    { r: 0.55, g: 0.22, b: 0.45 },
  fear:      { r: 0.20, g: 0.50, b: 0.42 },
  anxious:   { r: 0.28, g: 0.55, b: 0.48 },
  nostalgic: { r: 0.60, g: 0.42, b: 0.25 },
  mystic:    { r: 0.35, g: 0.18, b: 0.60 },
  anger:     { r: 0.60, g: 0.20, b: 0.28 },
  joy:       { r: 0.62, g: 0.50, b: 0.20 },
  serene:    { r: 0.30, g: 0.48, b: 0.60 },
};
const DEFAULT_COLOR = EMOTION_COLOR.mystic;

// ===== 诗云距离渐变（绿 → 青 → 品红 → 紫） =====
function posColor(px: number, py: number, pz: number): { r: number; g: number; b: number } {
  const dist = Math.sqrt(px * px + py * py + pz * pz);
  const t = Math.max(0, Math.min(1, dist / 400));

  let r: number, g: number, b: number;
  if (t < 0.20) {
    // 翠绿 → 青绿
    const s = t / 0.20;
    r = 0.18 * (1 - s) + 0.08 * s;
    g = 0.80 * (1 - s) + 0.65 * s;
    b = 0.40 * (1 - s) + 0.75 * s;
  } else if (t < 0.50) {
    // 青绿 → 品红/粉
    const s = (t - 0.20) / 0.30;
    r = 0.08 * (1 - s) + 0.75 * s;
    g = 0.65 * (1 - s) + 0.30 * s;
    b = 0.75 * (1 - s) + 0.55 * s;
  } else if (t < 0.75) {
    // 粉 → 紫
    const s = (t - 0.50) / 0.25;
    r = 0.75 * (1 - s) + 0.40 * s;
    g = 0.30 * (1 - s) + 0.18 * s;
    b = 0.55 * (1 - s) + 0.70 * s;
  } else {
    // 紫 → 深紫
    const s = (t - 0.75) / 0.25;
    r = 0.40 * (1 - s) + 0.20 * s;
    g = 0.18 * (1 - s) + 0.10 * s;
    b = 0.70 * (1 - s) + 0.55 * s;
  }
  return { r, g, b };
}

// ==================== 柔光纹理（256px 诗云品质） ====================
function makeGlow(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0,     'rgba(255,255,255,1)');
  g.addColorStop(0.02,  'rgba(255,255,255,0.95)');
  g.addColorStop(0.06,  'rgba(255,255,255,0.75)');
  g.addColorStop(0.14,  'rgba(255,255,255,0.45)');
  g.addColorStop(0.28,  'rgba(255,255,255,0.18)');
  g.addColorStop(0.48,  'rgba(255,255,255,0.05)');
  g.addColorStop(0.72,  'rgba(255,255,255,0.01)');
  g.addColorStop(1,     'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
export const glowTex = makeGlow();

// ==================== 恒星纹理着色器 ====================
const stellarVert = `
  attribute float size;
  attribute vec3 color;
  attribute float seed;
  varying vec3 vColor;
  varying float vSeed;
  varying vec2 vUv;
  uniform float uPixelRatio;
  uniform float uTime;
  void main() {
    vColor = color;
    vSeed = seed;
    vUv = vec2(seed, uTime * 0.1);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const stellarFrag = `
  varying vec3 vColor;
  varying float vSeed;
  uniform float uTime;
  float h(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float n(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);
  }
  float fbm(vec2 p) {
    float v=0.,a=0.5;
    for(int i=0;i<4;i++){v+=n(p)*a;p*=2.;a*=.5;}
    return v;
  }
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv*2.0);
    if(d>1.0) discard;
    // 炽白核心 — 更亮但更小,不和子星抢视觉
    float core = pow(1.0-smoothstep(0.,0.15,d),3.5);
    // 内层光晕 — 收窄范围,避免溢出到子星轨道
    float halo = 1.0 - smoothstep(0.04, 0.48, d);
    halo = pow(halo, 2.2) * 0.55;
    // 外层辉光 — 大幅收缩:只到半径 55%,不再覆盖全点
    float outerGlow = 1.0 - smoothstep(0.15, 0.52, d);
    outerGlow = pow(outerGlow, 3.5) * 0.18;
    vec2 nuv = uv*5.0+vSeed*40.0;
    float surf = fbm(nuv)*0.12+fbm(nuv*0.5+vSeed*15.0)*0.05;
    float hs = (vSeed-0.5)*0.25;
    vec3 sc = clamp(vColor+vec3(hs,hs*0.3,-hs*0.2),0.0,1.0);
    vec3 wh = vec3(1.0,0.97,0.92);
    // 光冕流动（UV偏移随时间变化）
    vec2 coronaUV = uv*3.0 + vSeed*20.0 + uTime*0.03;
    float coronaNoise = fbm(coronaUV)*0.08;
    float alpha = clamp(core+halo+outerGlow+surf*0.5+coronaNoise,0.0,1.0);
    vec3 col = wh*core*2.0+sc*(halo+outerGlow+surf+coronaNoise);
    col *= 0.9+vSeed*0.2;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ==================== 画质配置映射 ====================
import type { Quality } from '../store/uiStore';

const Q: Record<Quality, { perDream: number; nucleus: number; subs: number; bezierPts: number; rotSpeed: number }> = {
  high:   { perDream: 16, nucleus: 6000, subs: 235, bezierPts: 81, rotSpeed: 0.00004 },
  medium: { perDream: 10, nucleus: 1500, subs: 120, bezierPts: 41, rotSpeed: 0.00003 },
  low:    { perDream: 6,  nucleus: 700,  subs: 60,  bezierPts: 21, rotSpeed: 0.00002 },
};

const FOG_SPREAD = 13;
const FOG_Y = 1.0;
const SUB_DIST = 12;

// ==================== 组件 ====================
export default function DreamCloud() {
  const { scene, camera, gl } = useThree();
  const ptsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Points>(null);
  const subRef = useRef<THREE.Points>(null);
  const fiberGroupRef = useRef<THREE.Group | null>(null);
  const highlightRef = useRef<THREE.Points | null>(null);
  const fiberCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef(0);
  const groupRef = useRef<THREE.Group>(null);

  const dreams = useDreamStore((s) => s.dreams);
  const selectedDream = useDreamStore((s) => s.selectedDream);
  const subDreams = useDreamStore((s) => s.subDreams);
  const emotionFilter = useUIStore((s) => s.emotionFilter);
  const themeFilter = useUIStore((s) => s.themeFilter);
  const dreamTypeFilter = useUIStore((s) => s.dreamTypeFilter);
  const selectDream = useDreamStore((s) => s.selectDream);
  const isLandingDone = useUIStore((s) => s.isLandingDone);
  const fiberNetMode = useUIStore((s) => s.fiberNetMode);
  const quality = useUIStore((s) => s.quality);
  // 画质参数
  const qp = Q[quality];
  const PER_DREAM = qp.perDream;
  const NUCLEUS_PARTS = qp.nucleus;
  const SUBS_PER_CORE = qp.subs;

  useEffect(() => {
    if (dreams.length < 100) return;

    if (groupRef.current) {
      scene.remove(groupRef.current);
      groupRef.current.traverse((o: any) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }

    const g = new THREE.Group();
    groupRef.current = g;
    scene.add(g);

    const list = dreams.filter(d => {
      if (emotionFilter && d.emotion !== emotionFilter) return false;
      if (themeFilter && !d.themes.includes(themeFilter)) return false;
      if (dreamTypeFilter && d.type !== dreamTypeFilter) return false;
      return true;
    });
    const N = isLandingDone ? list.length : Math.min(800, list.length);
    if (N === 0) return;

    const TOTAL = N * PER_DREAM;
    const posArr = new Float32Array((TOTAL + NUCLEUS_PARTS) * 3);
    const colArr = new Float32Array((TOTAL + NUCLEUS_PARTS) * 3);
    const sizArr = new Float32Array(TOTAL + NUCLEUS_PARTS);

    // ===== 雾粒子渲染：空间色决定颜色 =====
    for (let i = 0; i < N; i++) {
      const d = list[i];
      const [px, py, pz] = d.position;
      // 主星越大，雾粒子散得更开
      const fogScale = 1.0 + Math.max(0, Math.min(1, ((d.subCount || 8) - 130) / 210)) * 0.6;

      for (let j = 0; j < PER_DREAM; j++) {
        const idx = i * PER_DREAM + j;
        const ang1 = rand(i, j * 7 + 1) * Math.PI * 2;
        const ang2 = rand(i, j * 7 + 2) * Math.PI;
        const el = d.emotion.charCodeAt(0) % 8;
        const spread = FOG_SPREAD * fogScale * (1.0 + el * 0.08) * (0.1 + rand(i, j * 7 + 3) * 0.9);
        const wx = px + Math.sin(ang2) * Math.cos(ang1) * spread;
        const wy = py + Math.cos(ang2) * spread * FOG_Y;
        const wz = pz + Math.sin(ang2) * Math.sin(ang1) * spread;
        posArr[idx * 3]     = wx;
        posArr[idx * 3 + 1] = wy;
        posArr[idx * 3 + 2] = wz;

        // HII桃红区 4% / 空间色96%
        if (rand(i, j + 1000) < 0.04) {
          colArr[idx * 3]     = 1.0;
          colArr[idx * 3 + 1] = 0.43;
          colArr[idx * 3 + 2] = 0.57;
        } else {
          const c = posColor(wx, wy, wz);
          const jitter = 0.85 + rand(i, j + 99) * 0.3;
          colArr[idx * 3]     = Math.min(1, c.r * jitter);
          colArr[idx * 3 + 1] = Math.min(1, c.g * jitter);
          colArr[idx * 3 + 2] = Math.min(1, c.b * jitter);
        }

        sizArr[idx] = 0.4 + rand(i, j * 7 + 5) * 1.0;
      }
    }

    for (let i = 0; i < NUCLEUS_PARTS; i++) {
      const idx = TOTAL + i;
      const r = 22 * Math.pow(Math.random(), 2.5);
      const phi2 = Math.acos(2 * Math.random() - 1);
      const theta2 = Math.random() * Math.PI * 2;
      const nx = r * Math.sin(phi2) * Math.cos(theta2);
      const ny = r * Math.cos(phi2) * 0.5;
      const nz = r * Math.sin(phi2) * Math.sin(theta2);
      posArr[idx * 3]     = nx;
      posArr[idx * 3 + 1] = ny;
      posArr[idx * 3 + 2] = nz;

      // 核颜色:暖白核(#fff1d6) + 4% HII桃红
      const c = posColor(nx, ny, nz);
      const heat = 1 - r / 22;
      const t = heat;
      if (r > 8 && r < 15 && Math.random() < 0.04) {
        colArr[idx * 3]     = 1.0;
        colArr[idx * 3 + 1] = 0.43;
        colArr[idx * 3 + 2] = 0.57;
        sizArr[idx] = 2.0 + Math.random() * 1.5;
      } else {
        colArr[idx * 3]     = Math.min(2.2, c.r * (1 - t) + 1.0 * t * 1.8);
        colArr[idx * 3 + 1] = Math.min(2.2, c.g * (1 - t) + 0.945 * t * 1.8);
        colArr[idx * 3 + 2] = Math.min(2.2, c.b * (1 - t) + 0.839 * t * 1.8);
        sizArr[idx] = 1.5 + heat * 5.0 + Math.random() * 0.8;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizArr, 1));

    const fogSeed = new Float32Array(TOTAL + NUCLEUS_PARTS);
    for (let i = 0; i < TOTAL + NUCLEUS_PARTS; i++) fogSeed[i] = Math.random();
    geo.setAttribute('aSeed', new THREE.BufferAttribute(fogSeed, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: glowTex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size; attribute vec3 color; attribute float aSeed;
        varying vec3 vColor; varying float vSeed; uniform float uPixelRatio; uniform float uTime;
        void main() {
          vColor = color; vSeed = aSeed;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex; uniform float uTime;
        varying vec3 vColor; varying float vSeed;
        void main() { float tw = 0.7+0.3*sin(uTime*0.8+vSeed*6.283); vec4 t = texture2D(uTex, gl_PointCoord); if (t.a < 0.01) discard; gl_FragColor = vec4(vColor*tw,1.0) * t.a; }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });

    ptsRef.current = new THREE.Points(geo, mat);
    g.add(ptsRef.current);

    const cN = N;
    const cP = new Float32Array(cN * 3);
    const cC = new Float32Array(cN * 3);
    const cS = new Float32Array(cN);
    for (let i = 0; i < cN; i++) {
      const d = list[i];
      cP[i * 3] = d.position[0]; cP[i * 3 + 1] = d.position[1]; cP[i * 3 + 2] = d.position[2];
      const pc = posColor(d.position[0], d.position[1], d.position[2]);
      const subNorm = Math.max(0, Math.min(1, ((d.subCount || 8) - 130) / 210));
      const w = 0.3 + subNorm * 0.4;
      cC[i * 3]     = Math.min(2.0, pc.r * (1 - w) + 1.0 * w * 1.6);
      cC[i * 3 + 1] = Math.min(2.0, pc.g * (1 - w) + 0.945 * w * 1.6);
      cC[i * 3 + 2] = Math.min(2.0, pc.b * (1 - w) + 0.839 * w * 1.6);
      cS[i] = 6.0 + subNorm * 8.0 + rand(i, 777) * 1.5;
    }
    const cSeed = new Float32Array(cN);
    for (let i = 0; i < cN; i++) cSeed[i] = rand(i, 9999);
    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute('position', new THREE.BufferAttribute(cP, 3));
    cGeo.setAttribute('color', new THREE.BufferAttribute(cC, 3));
    cGeo.setAttribute('size', new THREE.BufferAttribute(cS, 1));
    cGeo.setAttribute('seed', new THREE.BufferAttribute(cSeed, 1));
    const cMat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }, uTime: { value: 0 } },
      vertexShader: stellarVert,
      fragmentShader: stellarFrag,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    coreRef.current = new THREE.Points(cGeo, cMat);
    g.add(coreRef.current);

    // ===== 子恒星（每核周围 SUBS_PER_CORE 颗） =====
    const sN = N * SUBS_PER_CORE;
    const sP = new Float32Array(sN * 3);
    const sC = new Float32Array(sN * 3);
    const sS = new Float32Array(sN);

    for (let i = 0; i < N; i++) {
      const d = list[i];
      const [px, py, pz] = d.position;

      for (let s = 0; s < SUBS_PER_CORE; s++) {
        const idx = i * SUBS_PER_CORE + s;
        const phi = Math.acos(2 * rand(i, 900 + s) - 1);
        const theta = rand(i, 950 + s) * Math.PI * 2;
        // 轨道半径略微扩大: 10~28(原本 8~24),远离主星辉光
        const orbitR = 10 + rand(i, 1000 + s) * 20;
        const sx = px + Math.sin(phi) * Math.cos(theta) * orbitR;
        const sy = py + Math.cos(phi) * orbitR;
        const sz = pz + Math.sin(phi) * Math.sin(theta) * orbitR;
        sP[idx * 3]     = sx;
        sP[idx * 3 + 1] = sy;
        sP[idx * 3 + 2] = sz;

        const c = posColor(sx, sy, sz);
        // 亮度: 0.55~0.70(适度平衡,不抢主星 + 不卡顿)
        const b = 0.55 + rand(i, 1200 + s) * 0.15;
        sC[idx * 3]     = Math.min(1, c.r * b);
        sC[idx * 3 + 1] = Math.min(1, c.g * b);
        sC[idx * 3 + 2] = Math.min(1, c.b * b);

        // 尺寸加大: 3~7px(原本 2~4px)
        sS[idx] = 3.5 + rand(i, 1300 + s) * 3.5;
      }
    }

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sP, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(sC, 3));
    sGeo.setAttribute('size', new THREE.BufferAttribute(sS, 1));
    const sMat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: glowTex }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
      vertexShader: `
        attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uPixelRatio;
        void main() { vColor = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * uPixelRatio * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }
      `,
      fragmentShader: `
        uniform sampler2D uTex; varying vec3 vColor;
        void main() { vec4 t = texture2D(uTex, gl_PointCoord); if (t.a < 0.01) discard; gl_FragColor = vec4(vColor,1.0) * t.a; }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    subRef.current = new THREE.Points(sGeo, sMat);
    g.add(subRef.current);

    const anim = () => {
      if (groupRef.current) {
        groupRef.current.rotation.y += qp.rotSpeed * 0.75;
        groupRef.current.rotation.x += qp.rotSpeed * 0.05;
        groupRef.current.rotation.z += qp.rotSpeed * 0.1;
      }
      // 光冕流动时间
      if (coreRef.current?.material) {
        (coreRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value += 0.016;
      }
      if (ptsRef.current?.material) {
        (ptsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value += 0.016;
      }
      // 光纤流光
      if (fiberGroupRef.current) {
        fiberGroupRef.current.traverse((o: any) => {
          if (o.__fiberMat?.uniforms?.uTime) {
            o.__fiberMat.uniforms.uTime.value += 0.016;
          }
          // 全量模式缓速展开
          if (o.__fiberAnim) {
            const elapsed = (performance.now() - o.__fiberAnim.appearStart) / 1000;
            o.__fiberAnim.uAppear.value = Math.min(1.3, elapsed / 3.5);
          }
          // 选中模式光纤展开：平面散开 + 垂直延展
          if (o.__fiberExpand) {
            const elapsed = (performance.now() - o.__fiberExpand.startTime) / 1000;
            o.__fiberExpand.uExpand.value = Math.min(1.4, elapsed / 2.5);
          }
        });
      }
      frameRef.current = requestAnimationFrame(anim);
    };
    anim();

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (fiberCloseTimer.current) clearTimeout(fiberCloseTimer.current);
      scene.remove(g);
      geo.dispose(); mat.dispose();
      cGeo.dispose(); cMat.dispose();
      sGeo.dispose(); sMat.dispose();
    };
  }, [scene, dreams, emotionFilter, themeFilter, dreamTypeFilter, isLandingDone, quality]);

  // ===== 层 1：光纤网 + 高亮 =====
  useEffect(() => {
    // 清旧
    if (fiberCloseTimer.current) { clearTimeout(fiberCloseTimer.current); fiberCloseTimer.current = null; }
    if (fiberGroupRef.current) {
      groupRef.current?.remove(fiberGroupRef.current);
      fiberGroupRef.current.traverse((o: any) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    if (highlightRef.current) {
      groupRef.current?.remove(highlightRef.current);
      highlightRef.current.geometry.dispose();
      (highlightRef.current.material as THREE.Material).dispose();
      highlightRef.current = null;
    }
    if (!groupRef.current) return;

    const mode = fiberNetMode;
    const sel = selectedDream;
    const showHighlight = (mode === 'selected' || mode === 'all') && sel;
    const showFiber = (mode === 'selected' || mode === 'all') && sel;

    // ===== 选中模式：核心 → 子星光网（缓速展开 + 垂直上升） =====
    if (showFiber) {
      const dreamIdx = dreams.findIndex(d => d.id === sel.id);
      const subCount = SUBS_PER_CORE;
      const [cx, cy, cz] = sel.position;

      // 计算视觉子星位置 + 归一化距离(轨道与视觉层一致)
      const subPos: [number, number, number][] = [];
      const subDistNorm: number[] = []; // 0=最近, 1=最远
      let minDist = 24, maxDist = 8;
      const tempData: { pos: [number, number, number]; orbitR: number }[] = [];
      for (let s = 0; s < subCount; s++) {
        const phi = Math.acos(2 * rand(dreamIdx, 900 + s) - 1);
        const theta = rand(dreamIdx, 950 + s) * Math.PI * 2;
        const orbitR = 10 + rand(dreamIdx, 1000 + s) * 20; // 与视觉层一致
        tempData.push({
          pos: [
            cx + Math.sin(phi) * Math.cos(theta) * orbitR,
            cy + Math.cos(phi) * orbitR,
            cz + Math.sin(phi) * Math.sin(theta) * orbitR,
          ],
          orbitR,
        });
        if (orbitR < minDist) minDist = orbitR;
        if (orbitR > maxDist) maxDist = orbitR;
      }
      // 归一化距离
      const distRange = maxDist - minDist || 1;
      for (const d of tempData) {
        subPos.push(d.pos);
        subDistNorm.push((d.orbitR - minDist) / distRange);
      }

      const n = subCount * 2; // 水平 + 垂直
      const verts = new Float32Array(n * 6);
      const cols  = new Float32Array(n * 6);
      const progs = new Float32Array(n * 6);
      const phases = new Float32Array(n * 2);
      const lineDists = new Float32Array(n * 6); // 每条线距中心归一化距离

      for (let i = 0; i < subCount; i++) {
        const [sx, sy, sz] = subPos[i];
        const dn = subDistNorm[i];
        const subCol = posColor(sx, sy, sz);
        const sr = Math.min(1, subCol.r * 1.2);
        const sg = Math.min(1, subCol.g * 1.2);
        const sb = Math.min(1, subCol.b * 1.2);
        const hi = i * 6;
        const vi = (subCount + i) * 6;

        // 水平线：核心(progress=0) → 子星赤道投影(progress=1)
        verts[hi] = cx; verts[hi+1] = cy; verts[hi+2] = cz;
        verts[hi+3] = sx; verts[hi+4] = cy; verts[hi+5] = sz;
        cols[hi] = sr; cols[hi+1] = sg; cols[hi+2] = sb;
        cols[hi+3] = sr; cols[hi+4] = sg; cols[hi+5] = sb;
        progs[hi] = 0; progs[hi+1] = 0; progs[hi+2] = 0;
        progs[hi+3] = 1; progs[hi+4] = 0; progs[hi+5] = 0;

        // 垂直线：赤道投影(progress=0) → 子星终点(progress=1)
        verts[vi] = sx; verts[vi+1] = cy; verts[vi+2] = sz;
        verts[vi+3] = sx; verts[vi+4] = sy; verts[vi+5] = sz;
        const vr = sr * 0.8, vg = sg * 0.8, vb = sb * 0.8;
        cols[vi] = vr * 0.4; cols[vi+1] = vg * 0.4; cols[vi+2] = vb * 0.4;
        cols[vi+3] = sr; cols[vi+4] = sg; cols[vi+5] = sb;
        progs[vi] = 0; progs[vi+1] = 0; progs[vi+2] = 0;
        progs[vi+3] = 1; progs[vi+4] = 0; progs[vi+5] = 0;

        // 每条线的距离属性（水平+垂直相同距离）
        lineDists[hi] = dn; lineDists[hi+1] = dn; lineDists[hi+2] = dn;
        lineDists[hi+3] = dn; lineDists[hi+4] = dn; lineDists[hi+5] = dn;
        lineDists[vi] = dn; lineDists[vi+1] = dn; lineDists[vi+2] = dn;
        lineDists[vi+3] = dn; lineDists[vi+4] = dn; lineDists[vi+5] = dn;

        phases[i * 2] = Math.random();
        phases[i * 2 + 1] = Math.random();
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      geo.setAttribute('progress', new THREE.BufferAttribute(progs, 3));
      geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
      geo.setAttribute('lineDist', new THREE.BufferAttribute(lineDists, 3));

      const uExpand = { value: 0 };
      const uTime = { value: 0 };
      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime, uExpand },
        vertexShader: `
          attribute float progress; attribute float phase;
          attribute vec3 color; attribute float lineDist;
          varying float vProgress; varying float vPhase;
          varying vec3 vColor; varying float vLineDist;
          uniform float uExpand;
          void main() {
            vProgress=progress; vPhase=phase; vColor=color;
            vLineDist=lineDist;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
          }`,
        fragmentShader: `
          varying float vProgress; varying float vPhase;
          varying vec3 vColor; varying float vLineDist;
          uniform float uTime; uniform float uExpand;
          float n(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
          void main(){
            float tex=0.94+n(gl_FragCoord.xy*0.4)*0.12;

            float appear = smoothstep(vLineDist-0.08, vLineDist+0.08, uExpand);
            appear = clamp(appear, 0.0, 1.0);

            float flow = mod(uTime*0.2+vPhase, 1.0);
            float spot = exp(-abs(vProgress-flow)*abs(vProgress-flow)*100.0);

            // 模拟光导纤维质感：核心亮 + 边缘光晕
            float alpha = (0.55+spot*3.0)*appear;
            alpha*=tex;

            // 光纤色温：核心偏白 + 边缘保留原色
            vec3 hot = mix(vColor, vec3(1.0,0.95,0.85), 0.3);
            vec3 col = mix(hot*alpha, vec3(1.0,0.95,0.85), spot*0.45*appear);
            gl_FragColor = vec4(col,1.0);
          }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });

      const fg = new THREE.Group();
      fiberGroupRef.current = fg;
      const segs = new THREE.LineSegments(geo, mat);
      (segs as any).__fiberMat = mat;
      (segs as any).__fiberExpand = { uExpand, startTime: performance.now() };
      fg.add(segs);

      // ===== 赤道环（诗云风格）：水平面发光环 =====
      const ringPts = 128;
      const ringRadius = 24;
      const ringVerts = new Float32Array(ringPts * 3);
      for (let r = 0; r < ringPts; r++) {
        const angle = (r / ringPts) * Math.PI * 2;
        ringVerts[r * 3] = cx + Math.cos(angle) * ringRadius;
        ringVerts[r * 3 + 1] = cy;
        ringVerts[r * 3 + 2] = cz + Math.sin(angle) * ringRadius;
      }
      const ringGeo = new THREE.BufferGeometry();
      ringGeo.setAttribute('position', new THREE.BufferAttribute(ringVerts, 3));
      const ringCol = EMOTION_COLOR[sel.emotion] ?? DEFAULT_COLOR;
      const uRingExpand = uExpand; // 共享同一个展开进度
      const uRingSplit = { value: 0.6 }; // 环在水平段 60% 时完全显现
      const ringMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime, uExpand: uRingExpand, uSplit: uRingSplit,
          uColor: { value: new THREE.Vector3(ringCol.r * 1.5, ringCol.g * 1.5, ringCol.b * 1.5) },
          uBright: { value: 0.7 },
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vPos;
          uniform float uTime; uniform float uExpand;
          uniform float uSplit; uniform vec3 uColor; uniform float uBright;
          void main() {
            // 环随水平段出现：当 uExpand 到达 uSplit 时环完全可见
            float appear = uSplit <= 0.0 ? 1.0 : clamp(uExpand / uSplit, 0.0, 1.0);
            float alpha = appear * uBright;
            // 环上微弱的流光
            alpha *= 0.6 + 0.4 * sin(uTime * 2.0 + atan(vPos.y, vPos.x) * 6.0) * 0.15;
            gl_FragColor = vec4(uColor * alpha, alpha);
          }`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const ringLine = new THREE.LineLoop(ringGeo, ringMat);
      (ringLine as any).__ringMat = ringMat;
      fg.add(ringLine);

      groupRef.current.add(fg);
    }

    // --- 高亮：核心 + 子星（使用与视觉渲染一致的位置） ---
    if (showHighlight) {
      const dreamIdx = dreams.findIndex(d => d.id === sel.id);
      const subCount = SUBS_PER_CORE;
      const col = EMOTION_COLOR[sel.emotion] ?? DEFAULT_COLOR;
      const [cx, cy, cz] = sel.position;

      const ptCount = 1 + subCount;
      const hP = new Float32Array(ptCount * 3);
      const hC = new Float32Array(ptCount * 3);
      const hS = new Float32Array(ptCount);
      hP[0] = cx; hP[1] = cy; hP[2] = cz;
      hC[0] = Math.min(1, col.r * 4); hC[1] = Math.min(1, col.g * 4); hC[2] = Math.min(1, col.b * 4);
      hS[0] = 12.0;
      for (let i = 0; i < subCount; i++) {
        const o = (i + 1) * 3;
        const phi = Math.acos(2 * rand(dreamIdx, 900 + i) - 1);
        const theta = rand(dreamIdx, 950 + i) * Math.PI * 2;
        const orbitR = 10 + rand(dreamIdx, 1000 + i) * 20; // 与视觉层一致
        hP[o] = cx + Math.sin(phi) * Math.cos(theta) * orbitR;
        hP[o+1] = cy + Math.cos(phi) * orbitR;
        hP[o+2] = cz + Math.sin(phi) * Math.sin(theta) * orbitR;
        const sc = posColor(hP[o], hP[o+1], hP[o+2]);
        hC[o] = Math.min(1, sc.r * 2.5);
        hC[o+1] = Math.min(1, sc.g * 2.5);
        hC[o+2] = Math.min(1, sc.b * 2.5);
        hS[i + 1] = 4.5;
      }
      const hGeo = new THREE.BufferGeometry();
      hGeo.setAttribute('position', new THREE.BufferAttribute(hP, 3));
      hGeo.setAttribute('color', new THREE.BufferAttribute(hC, 3));
      hGeo.setAttribute('size', new THREE.BufferAttribute(hS, 1));
      const hSeed = new Float32Array(ptCount);
      for (let i = 0; i < ptCount; i++) hSeed[i] = Math.random();
      hGeo.setAttribute('seed', new THREE.BufferAttribute(hSeed, 1));
      const hMat = new THREE.ShaderMaterial({
        uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
        vertexShader: stellarVert,
        fragmentShader: stellarFrag,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      highlightRef.current = new THREE.Points(hGeo, hMat);
      groupRef.current.add(highlightRef.current);

      // 自动关闭：选中模式 11s，全量模式 12s
      const duration = mode === 'all' ? 12000 : 11000;
      if (fiberCloseTimer.current) clearTimeout(fiberCloseTimer.current);
      fiberCloseTimer.current = setTimeout(() => {
        useDreamStore.getState().selectDream(null);
      }, duration);
    }

    // ===== 全量模式：贝塞尔弧线互联（诗云风格） =====
    if (mode === 'all') {
      const RADIUS = 50;
      const STRIDE = 2;
      const pairs: [number, number, number, number, number, number][] = [];
      const key = (x: number, y: number, z: number) => `${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)}`;
      const edgeCount = new Map<string, number>();

      for (let i = 0; i < dreams.length; i += STRIDE) {
        const a = dreams[i].position;
        const ak = key(a[0], a[1], a[2]);
        let bestDist = RADIUS * RADIUS;
        let bestIdx = -1;
        for (let j = i + 1; j < dreams.length; j++) {
          const b = dreams[j].position;
          const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
          const d = dx * dx + dy * dy + dz * dz;
          if (d < bestDist) {
            const bk = key(b[0], b[1], b[2]);
            if ((edgeCount.get(ak) || 0) < 5 && (edgeCount.get(bk) || 0) < 5) {
              bestDist = d;
              bestIdx = j;
            }
          }
        }
        if (bestIdx >= 0) {
          const b = dreams[bestIdx].position;
          const bk = key(b[0], b[1], b[2]);
          edgeCount.set(ak, (edgeCount.get(ak) || 0) + 1);
          edgeCount.set(bk, (edgeCount.get(bk) || 0) + 1);
          pairs.push([a[0], a[1], a[2], b[0], b[1], b[2]]);
        }
      }

      if (pairs.length > 0) {
        const pn = pairs.length;
        const totalVerts = pn * qp.bezierPts;
        const totalSegs = pn * (qp.bezierPts - 1);

        const verts = new Float32Array(totalVerts * 3);
        const cols  = new Float32Array(totalVerts * 3);
        const tVals = new Float32Array(totalVerts);     // 0→1 沿曲线
        const seeds = new Float32Array(totalVerts);     // 每曲线独立种子
        const distNorms = new Float32Array(totalVerts); // 展开距离

        const indices = new Uint32Array(totalSegs * 2);

        for (let i = 0; i < pn; i++) {
          const ax = pairs[i][0], ay = pairs[i][1], az = pairs[i][2];
          const bx = pairs[i][3], by = pairs[i][4], bz = pairs[i][5];
          const dx = bx - ax, dy = by - ay, dz = bz - az;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const lift = dist * 0.18; // 18% 弧高

          // 贝塞尔控制点：1/3 和 2/3 处提起
          const cp1x = ax + dx * 0.33, cp1y = ay + dy * 0.33 + lift, cp1z = az + dz * 0.33;
          const cp2x = ax + dx * 0.67, cp2y = ay + dy * 0.67 + lift, cp2z = az + dz * 0.67;

          // 端点颜色（星空蓝高亮渐变）
          // 距离决定蓝调明暗：近亮蓝 → 远深靛
          const distA = Math.sqrt(ax*ax + ay*ay + az*az);
          const distB = Math.sqrt(bx*bx + by*by + bz*bz);
          const midD = (distA + distB) / 2;
          const tBlue = Math.max(0, Math.min(1, midD / 400));
          // 亮蓝 (0.50, 0.85, 1.00) → 冰蓝 (0.30, 0.55, 0.90) → 深靛 (0.10, 0.20, 0.60)
          const blendA = (a: number, b: number) => a * (1 - tBlue) + b * tBlue;
          const blueR1 = 0.50, blueG1 = 0.85, blueB1 = 1.00;
          const blueR2 = 0.30, blueG2 = 0.55, blueB2 = 0.90;
          const blueR3 = 0.10, blueG3 = 0.20, blueB3 = 0.60;
          const cA = {
            r: tBlue < 0.5 ? blendA(blueR1, blueR2) : blendA(blueR2, blueR3),
            g: tBlue < 0.5 ? blendA(blueG1, blueG2) : blendA(blueG2, blueG3),
            b: tBlue < 0.5 ? blendA(blueB1, blueB2) : blendA(blueB2, blueB3),
          };
          const cB = {
            r: tBlue < 0.5 ? blendA(blueR1, blueR2) : blendA(blueR2, blueR3),
            g: tBlue < 0.5 ? blendA(blueG1, blueG2) : blendA(blueG2, blueG3),
            b: tBlue < 0.5 ? blendA(blueB1, blueB2) : blendA(blueB2, blueB3),
          };

          // 曲线中点距中心距离
          const mx = (ax + bx) * 0.5, my = (ay + by) * 0.5, mz = (az + bz) * 0.5;
          const midDist = Math.sqrt(mx * mx + my * my + mz * mz) / 400;

          const curveSeed = Math.random();
          const bpts = qp.bezierPts;
          const base = i * bpts;
          const idxBase = i * (bpts - 1) * 2;

          for (let j = 0; j < bpts; j++) {
            const t = j / (bpts - 1);
            const [px, py, pz] = bezierSample(ax, ay, az, cp1x, cp1y, cp1z, cp2x, cp2y, cp2z, bx, by, bz, t);
            const vi = base + j;

            verts[vi * 3] = px; verts[vi * 3 + 1] = py; verts[vi * 3 + 2] = pz;

            // 颜色：端点色插值（不衰减，保持整条线亮度）
            const fade = 0.6 + 0.4 * Math.sin(Math.PI * t);
            cols[vi * 3]     = (cA.r * (1 - t) + cB.r * t) * fade;
            cols[vi * 3 + 1] = (cA.g * (1 - t) + cB.g * t) * fade;
            cols[vi * 3 + 2] = (cA.b * (1 - t) + cB.b * t) * fade;

            tVals[vi] = t;
            seeds[vi] = curveSeed;
            distNorms[vi] = midDist;

            // 相邻顶点索引（除曲线末点外）
            if (j < bpts - 1) {
              indices[idxBase + j * 2] = vi;
              indices[idxBase + j * 2 + 1] = vi + 1;
            }
          }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(cols, 3));
        geo.setAttribute('aT', new THREE.BufferAttribute(tVals, 1));
        geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
        geo.setAttribute('aDistNorm', new THREE.BufferAttribute(distNorms, 1));
        geo.setIndex(new THREE.BufferAttribute(indices, 1));

        const uAppear = { value: 0 };
        const mat = new THREE.ShaderMaterial({
          uniforms: { uTime: { value: 0 }, uAppear },
          vertexShader: `
            attribute vec3 aColor; attribute float aT;
            attribute float aSeed; attribute float aDistNorm;
            varying vec3 vColor; varying float vT;
            varying float vSeed; varying float vDistNorm;
            void main() {
              vColor = aColor; vT = aT; vSeed = aSeed;
              vDistNorm = aDistNorm;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `
            varying vec3 vColor; varying float vT;
            varying float vSeed; varying float vDistNorm;
            uniform float uTime; uniform float uAppear;
            float n(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
            void main() {
              float tex = 0.92 + n(gl_FragCoord.xy * 0.5) * 0.16;

              // 缓速展开：内圈先亮，外圈后亮
              float appear = smoothstep(0.0, 0.35, uAppear - vDistNorm * 0.8);
              appear = clamp(appear, 0.0, 1.0);

              // 流光沿曲线移动
              float flow = mod(uTime * 0.18 + vSeed, 1.0);
              float spot = exp(-abs(vT - flow) * abs(vT - flow) * 90.0);

              // 星罗全量模式：直接显示星空蓝顶点色（提高亮度）
              float alpha = (0.65 + spot * 3.0) * appear;
              alpha *= tex;
              vec3 col = vColor * alpha * 1.6;
              gl_FragColor = vec4(col, 1.0);
            }`,
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        });

        // 复用已有fiberGroup（如果有选中光纤网则追加，不覆盖）
        const fg = fiberGroupRef.current || new THREE.Group();
        fiberGroupRef.current = fg;
        const segsAll = new THREE.LineSegments(geo, mat);
        const appearStart = performance.now();
        (segsAll as any).__fiberMat = mat;
        (segsAll as any).__fiberAnim = { appearStart, mat, uAppear };
        fg.add(segsAll);
        groupRef.current.add(fg);
      }
    }

    return () => {
      if (fiberCloseTimer.current) { clearTimeout(fiberCloseTimer.current); fiberCloseTimer.current = null; }
    };
  }, [selectedDream, fiberNetMode, dreams, subDreams, groupRef]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!camera || !coreRef.current || !gl) return;
      if (!(e.target instanceof HTMLElement)) return;
      if (e.target.closest('[data-ui]') || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      // 仅"选中"或"全量"模式允许点击选梦
      const mode = useUIStore.getState().fiberNetMode;
      if (mode === 'off') return;

      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const rc = new THREE.Raycaster();
      rc.setFromCamera(mouse, camera);
      rc.params.Points.threshold = 1.5;

      const list = dreams.filter(d => {
        if (emotionFilter && d.emotion !== emotionFilter) return false;
        if (themeFilter && !d.themes.includes(themeFilter)) return false;
        if (dreamTypeFilter && d.type !== dreamTypeFilter) return false;
        return true;
      });

      // 先检测主恒星
      const coreHits = rc.intersectObject(coreRef.current);
      if (coreHits.length > 0) {
        const idx = coreHits[0].index || 0;
        if (idx < list.length) {
          const dream = list[idx];
          selectDream(dream);
          useUIStore.getState().setDreamCardOpen(true);
          useUIStore.getState().pushToTrail(dream.id);
        }
        return;
      }

      // 再检测子恒星（选中/全量模式下可点）
      if (subRef.current) {
        const subHits = rc.intersectObject(subRef.current);
        if (subHits.length > 0) {
          const idx = subHits[0].index || 0;
          const dreamIdx = Math.floor(idx / SUBS_PER_CORE);
          const subIdx = idx % SUBS_PER_CORE;
          if (dreamIdx < list.length) {
            const dream = list[dreamIdx];
            // 先选中主星，再获取子星数据
            const subs = subDreams.get(dream.id) ?? [];
            if (subIdx < subs.length) {
              selectDream(dream);
              useDreamStore.getState().selectSubDream(subs[subIdx]);
              useUIStore.getState().setDreamCardOpen(true);
            } else {
              selectDream(dream);
              useUIStore.getState().setDreamCardOpen(true);
            }
          }
        }
      }
    };

    // 空点双击 → 缀星(单点出蓝光团)
    let emptyClickTimer: ReturnType<typeof setTimeout> | null = null;

    // 虚空光团:主恒星同款shader,更亮,4秒漂移
    // 光团长在用户视觉的鼠标点击处：记录 NDC，每帧从相机沿鼠标射线取近点
    const spawnVoidGlow = (ndcX: number, ndcY: number) => {
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
      cg.setAttribute('color', new THREE.BufferAttribute(new Float32Array([2.5,2.2,2.8]), 3));
      cg.setAttribute('size', new THREE.BufferAttribute(new Float32Array([3.0]), 1));
      cg.setAttribute('seed', new THREE.BufferAttribute(new Float32Array([Math.random()]), 1));
      const cm = new THREE.ShaderMaterial({
        uniforms:{uPixelRatio:{value:Math.min(window.devicePixelRatio,2)},uFade:{value:0}},
        vertexShader:stellarVert,
        fragmentShader:`varying vec3 vColor;varying float vSeed;uniform float uFade;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=0.5;for(int i=0;i<5;i++){v+=n(p)*a;p*=2.;a*=.5;}return v;}
void main(){vec2 uv=gl_PointCoord-0.5;float d=length(uv*2.0);if(d>1.0)discard;
// 星体本体：软边实心圆 + 表面 FBM 纹理 + 中心高亮
float body=1.0-smoothstep(0.0,1.0,d);
body=pow(body,1.2);
// FBM 表面斑纹（星体纹理）
vec2 nuv=uv*3.5+vSeed*40.0;float surf=fbm(nuv)*0.6+fbm(nuv*0.4+vSeed*15.0)*0.3;
float surfaceMask=1.0-smoothstep(0.0,0.85,d);
float texture=surf*surfaceMask;
// 中心高光（极亮核心，范围更大）
float hotCore=pow(1.0-smoothstep(0.0,0.3,d),3.0);
// 颜色：核心纯白 → 表面带蓝紫 → 边缘
vec3 hot=vec3(1.0,0.98,0.95);
vec3 bodyCol=clamp(vColor+vec3(0.4,0.3,0.5),0.0,3.0);
float alpha=clamp(body+texture*0.5,0.0,1.0);
alpha*=max(0.0,1.0-uFade/4.0);
// 提亮：核心 12x（极亮），本体 3x，纹理 1.5x
vec3 col=hot*hotCore*12.0+bodyCol*body*3.0+vColor*texture*1.5;
gl_FragColor=vec4(col,alpha);}`,
        transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,
      });
      const core = new THREE.Points(cg, cm);

      // 初始位置：出现在鼠标点击的3D空间位置（相机射线前方35单位）
      const initRC = new THREE.Raycaster();
      initRC.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera!);
      const initDir = initRC.ray.direction.clone().normalize();
      core.position.set(
        camera!.position.x + initDir.x * 35,
        camera!.position.y + initDir.y * 35,
        camera!.position.z + initDir.z * 35,
      );
      scene.add(core);

      // 自由漂移：出现在点击处后，在星云中自由游走
      const vx=(Math.random()-0.5)*2.0, vy=(Math.random()-0.5)*1.5, vz=(Math.random()-0.5)*2.0;
      let elapsed=0;
      const tick=()=>{
        elapsed+=0.016; cm.uniforms.uFade.value=elapsed;
        core.position.x += vx * 0.016;
        core.position.y += vy * 0.016;
        core.position.z += vz * 0.016;
        if(elapsed>4.0){scene.remove(core);cg.dispose();cm.dispose();return;}
        requestAnimationFrame(tick);
      };tick();
    };

    useCameraStore.getState().setOnClickHandler((e: MouseEvent) => {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const rc = new THREE.Raycaster(); rc.setFromCamera(mouse, camera!); rc.params.Points.threshold = 0.6;
      const hits = rc.intersectObject(coreRef.current!);

      if (hits.length > 0) {
        // 点到了星 → 原有逻辑
        onClick(e);
        return;
      }

      // 空点 → 光团长在用户视觉的鼠标点击处（屏幕空间锚定 + 每帧 re-project）
      spawnVoidGlow(mouse.x, mouse.y);

      if (emptyClickTimer) {
        clearTimeout(emptyClickTimer); emptyClickTimer = null;
        useUIStore.getState().setInputOpen(true);
      } else {
        emptyClickTimer = setTimeout(() => { emptyClickTimer = null; }, 600);
      }
    });

    // 双击 → 飞近
    const onDblClick = (e: MouseEvent) => {
      if (!camera || !coreRef.current || !gl) return;
      if (e.target instanceof HTMLElement && e.target.closest('[data-ui],button,a')) return;
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const rc = new THREE.Raycaster(); rc.setFromCamera(mouse, camera); rc.params.Points.threshold = 1.5;
      const hits = rc.intersectObject(coreRef.current);
      if (hits.length > 0) {
        const list = dreams.filter(d => {
          if (emotionFilter && d.emotion !== emotionFilter) return false;
          if (themeFilter && !d.themes.includes(themeFilter)) return false;
          if (dreamTypeFilter && d.type !== dreamTypeFilter) return false;
          return true;
        });
        const idx = hits[0].index || 0;
        if (idx < list.length) useCameraStore.getState().setFlyToTarget(list[idx].position);
      }
    };

    // hover 检测 → tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `position:fixed;z-index:100;pointer-events:none;
      font-family:var(--font-dream);font-size:12px;color:var(--gold-500);
      background:rgba(4,5,10,0.85);border:1px solid var(--alpha-gold-40);
      border-radius:8px;padding:6px 12px;max-width:240px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      display:none;backdrop-filter:blur(8px);`;
    document.body.appendChild(tooltip);
    let hoverTimer: ReturnType<typeof setTimeout>;

    const onHover = (e: MouseEvent) => {
      if (!camera || !coreRef.current || !gl) return;
      if (e.target instanceof HTMLElement && e.target.closest('[data-ui],button,a')) {
        clearTimeout(hoverTimer);
        tooltip.style.display = 'none';
        return;
      }
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      const rc = new THREE.Raycaster();
      rc.setFromCamera(mouse, camera);
      rc.params.Points.threshold = 1.5;
      const list = dreams.filter(d => {
        if (emotionFilter && d.emotion !== emotionFilter) return false;
        if (themeFilter && !d.themes.includes(themeFilter)) return false;
        if (dreamTypeFilter && d.type !== dreamTypeFilter) return false;
        return true;
      });
      const hits = rc.intersectObject(coreRef.current);
      if (hits.length > 0) {
        const idx = hits[0].index || 0;
        if (idx < list.length) {
          const d = list[idx];
          tooltip.textContent = d.content.slice(0, 30) + (d.content.length > 30 ? '...' : '');
          tooltip.style.left = (e.clientX + 18) + 'px';
          tooltip.style.top = (e.clientY - 36) + 'px';
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => { tooltip.style.display = 'block'; }, 800);
        }
      } else {
        clearTimeout(hoverTimer);
        tooltip.style.display = 'none';
      }
    };

    window.addEventListener('mousemove', onHover, { passive: true });
    window.addEventListener('dblclick', onDblClick);
    return () => {
      useCameraStore.getState().setOnClickHandler(null);
      window.removeEventListener('mousemove', onHover);
      window.removeEventListener('dblclick', onDblClick);
      document.body.removeChild(tooltip);
    };
  }, [camera, dreams, emotionFilter, themeFilter, dreamTypeFilter, selectDream, gl, subDreams]);

  return null;
}
