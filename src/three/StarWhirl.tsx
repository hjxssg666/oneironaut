/**
 * StarWhirl — FBM漩涡泡沫背景粒子海
 * 独立层，零交互影响，BufferGeometry + Points
 */
import { useEffect, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { fbm, hash } from '../data/massGenerator';
import { useUIStore } from '../store/uiStore';

const RADIUS = 420;
const Y_FLATTEN = 0.35;
const NS = 0.003;

/** 按画质分级决定粒子数 */
function countForQuality(q: 'high' | 'medium' | 'low'): number {
  if (q === 'high') return 200000;
  if (q === 'medium') return 80000;
  return 30000;
}

function generateVortexFoam(count: number): Float32Array {
  const pos = new Float32Array(count * 3);
  let filled = 0;

  for (let i = 0; i < count * 5 && filled < count; i++) {
    const r = Math.pow(Math.random(), 0.6) * RADIUS;
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.cos(phi) * Y_FLATTEN;
    let z = r * Math.sin(phi) * Math.sin(theta);

    const n = fbm(x * NS, y * NS * 0.5, z * NS, 6);
    const distN = r / RADIUS;
    const threshold = 0.12 + distN * 0.15;

    if (n > threshold) {
      pos[filled * 3] = x;
      pos[filled * 3 + 1] = y;
      pos[filled * 3 + 2] = z;
      filled++;
    }
  }

  for (let i = filled; i < count; i++) {
    const r = Math.pow(Math.random(), 0.6) * RADIUS;
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi) * Y_FLATTEN;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  return pos;
}

const vert = `
  attribute float aSize;
  varying vec3 vColor;
  attribute vec3 aColor;
  varying float vSize;
  void main() {
    vColor = aColor;
    vSize = aSize;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = `
  varying vec3 vColor;
  varying float vSize;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = pow(1.0 - d, 1.5) * 0.55;
    gl_FragColor = vec4(vColor, a);
  }
`;

export default function StarWhirl() {
  const { scene } = useThree();
  const quality = useUIStore((s) => s.quality);
  const ptsRef = useRef<THREE.Points>(null);
  const COUNT = useMemo(() => countForQuality(quality), [quality]);
  const basePos = useMemo(() => generateVortexFoam(COUNT), [COUNT]);
  const frameRef = useRef(0);

  useEffect(() => {
    // 颜色数组（径向渐变）
    const col = new Float32Array(COUNT * 3);
    const sizeArr = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const x = basePos[i * 3], y = basePos[i * 3 + 1], z = basePos[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      const t = Math.min(1, dist / RADIUS);

      if (t < 0.12) { col[i * 3] = 1; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 0.85; }
      else if (t < 0.35) {
        const s = (t - 0.12) / 0.23;
        col[i * 3] = 1 - s * 0.5;
        col[i * 3 + 1] = 0.85 - s * 0.5;
        col[i * 3 + 2] = 0.6 - s * 0.1;
      } else if (t < 0.65) {
        const s = (t - 0.35) / 0.3;
        col[i * 3] = 0.5 - s * 0.35;
        col[i * 3 + 1] = 0.35 - s * 0.25;
        col[i * 3 + 2] = 0.5 + s * 0.2;
      } else {
        col[i * 3] = 0.15;
        col[i * 3 + 1] = 0.1;
        col[i * 3 + 2] = 0.3 + (t - 0.65) * 0.3;
      }
      sizeArr[i] = 1.5 + (hash(i, 0, 0) * 1.5) * (1 - t * 0.5);
    }

    const runningPos = new Float32Array(basePos);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(runningPos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizeArr, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    ptsRef.current = pts;
    scene.add(pts);

    // 差速旋转
    const baseSpeed = 0.0004;
    const rotPos = new Float32Array(COUNT * 3);
    const anim = () => {
      if (!ptsRef.current) return;
      for (let i = 0; i < COUNT; i++) {
        const bx = basePos[i * 3], by = basePos[i * 3 + 1], bz = basePos[i * 3 + 2];
        const dist = Math.sqrt(bx * bx + bz * bz);
        const angSpeed = baseSpeed / (1 + dist / RADIUS);
        const angle = Math.atan2(bz, bx) + angSpeed;
        rotPos[i * 3] = dist * Math.cos(angle);
        rotPos[i * 3 + 1] = by;
        rotPos[i * 3 + 2] = dist * Math.sin(angle);
      }
      (geo.attributes.position as THREE.BufferAttribute).array.set(rotPos);
      geo.attributes.position.needsUpdate = true;
      frameRef.current = requestAnimationFrame(anim);
    };
    anim();

    return () => {
      cancelAnimationFrame(frameRef.current);
      scene.remove(pts);
      geo.dispose();
      mat.dispose();
    };
  }, [scene, basePos]);

  return null;
}
