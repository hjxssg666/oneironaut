/**
 * GiftTrail — 浏览足迹流光轨迹
 * 记录用户点击过的梦境序列，渲染星空蓝贝塞尔路径
 * 30 秒后依次渐变消失
 */
import { useEffect, useRef, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useUIStore } from '../store/uiStore';
import { useDreamStore } from '../store/dreamStore';

const MAX_AGE = 30;
const STEPS = 24;

function bezier3(a: THREE.Vector3, b: THREE.Vector3, seed: number): (t: number) => THREE.Vector3 {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lift = Math.max(2, dist * 0.08);
  const cp1x = a.x + dx * 0.33;
  const cp1y = a.y + dy * 0.33 + lift;
  const cp1z = a.z + dz * 0.33;
  const cp2x = a.x + dx * 0.67;
  const cp2y = a.y + dy * 0.67 + lift;
  const cp2z = a.z + dz * 0.67;
  return (t: number) => {
    const u = 1 - t;
    return new THREE.Vector3(
      u*u*u*a.x + 3*u*u*t*cp1x + 3*u*t*t*cp2x + t*t*t*b.x,
      u*u*u*a.y + 3*u*u*t*cp1y + 3*u*t*t*cp2y + t*t*t*b.y,
      u*u*u*a.z + 3*u*u*t*cp1z + 3*u*t*t*cp2z + t*t*t*b.z,
    );
  };
}

export default function GiftTrail() {
  const { scene } = useThree();
  const trail = useUIStore((s) => s.giftTrail);
  const expireTrail = useUIStore((s) => s.expireTrail);
  const dreams = useDreamStore((s) => s.dreams);
  const ref = useRef<THREE.LineSegments | null>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const frameRef = useRef(0);

  const lineData = useMemo(() => {
    if (trail.length < 2) return null;
    const positions: number[] = [];
    const tVals: number[] = [];
    const seeds: number[] = [];
    const ages: number[] = [];
    const pairs: [number, number, number, number, number, number, number][] = [];

    for (let i = 0; i < trail.length - 1; i++) {
      const da = dreams.find(d => d.id === trail[i].id);
      const db = dreams.find(d => d.id === trail[i + 1].id);
      if (!da || !db) continue;
      pairs.push([da.position[0], da.position[1], da.position[2], db.position[0], db.position[1], db.position[2], trail[i].ts]);
    }

    for (let pi = 0; pi < pairs.length; pi++) {
      const [ax, ay, az, bx, by, bz, ts] = pairs[pi];
      const a = new THREE.Vector3(ax, ay, az);
      const b = new THREE.Vector3(bx, by, bz);
      const seed = Math.random();
      const curve = bezier3(a, b, seed);
      const ageStart = (performance.now() - ts) / 1000;
      for (let j = 0; j < STEPS; j++) {
        const pt = curve(j / (STEPS - 1));
        positions.push(pt.x, pt.y, pt.z);
        tVals.push(j / (STEPS - 1));
        seeds.push(seed);
        ages.push(ageStart);
      }
    }

    const idx: number[] = [];
    const segsPerPair = STEPS - 1;
    for (let pi = 0; pi < pairs.length; pi++) {
      const base = pi * STEPS;
      for (let j = 0; j < segsPerPair; j++) {
        idx.push(base + j, base + j + 1);
      }
    }

    return {
      positions: new Float32Array(positions),
      tVals: new Float32Array(tVals),
      seeds: new Float32Array(seeds),
      ages: new Float32Array(ages),
      indices: new Uint32Array(idx),
    };
  }, [trail, dreams]);

  useEffect(() => {
    if (ref.current) { scene.remove(ref.current); ref.current = null; }
    if (!lineData || lineData.indices.length === 0) return;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(lineData.positions, 3));
    geo.setAttribute('aT', new THREE.BufferAttribute(lineData.tVals, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(lineData.seeds, 1));
    geo.setAttribute('aAge', new THREE.BufferAttribute(lineData.ages, 1));
    geo.setIndex(new THREE.BufferAttribute(lineData.indices, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMaxAge: { value: MAX_AGE } },
      vertexShader: `attribute float aT; attribute float aSeed; attribute float aAge;
varying float vT; varying float vSeed; varying float vAge;
void main(){vT=aT;vSeed=aSeed;vAge=aAge;
gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragmentShader: `uniform float uTime; uniform float uMaxAge;
varying float vT; varying float vSeed; varying float vAge;
void main(){
  float age=vAge+uTime;
  float fade=1.0-smoothstep(uMaxAge-5.0,uMaxAge,age);
  float phase=fract(uTime*0.06-vSeed*0.13);
  float d=abs(vT-phase);
  float pulse=1.5*smoothstep(0.14,0.0,d);
  gl_FragColor=vec4(vec3(0.30,0.60,1.0)*(0.9+pulse)*fade,0.92*fade);
}`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });

    ref.current = new THREE.LineSegments(geo, mat);
    matRef.current = mat;
    scene.add(ref.current);

    let lastExpire = performance.now();
    const tick = () => {
      if (matRef.current) matRef.current.uniforms.uTime.value += 0.016;
      const now = performance.now();
      if (now - lastExpire > 1000) {
        expireTrail();
        lastExpire = now;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (ref.current) { scene.remove(ref.current); geo.dispose(); mat.dispose(); }
    };
  }, [lineData, scene, expireTrail]);

  return null;
}
