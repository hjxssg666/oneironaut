/**
 * StarVortex — FBM 噪声驱动的漩涡泡沫背景粒子层
 * 独立渲染层,叠加在现有 DreamCloud 之下(depthWrite=false)
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { fbm3D } from '../lib/fbm3d';
import { glowTex } from './DreamCloud';
import { useUIStore, type Quality } from '../store/uiStore';

const FIELD_RADIUS = 200;

function radialColor(distRatio: number): [number, number, number] {
  if (distRatio < 0.12) return [1.0, 0.945, 0.839];    // #fff1d6 暖核 4500K
  if (distRatio < 0.35) return [1.0, 0.969, 0.925];    // #fff7ec 内区
  if (distRatio < 0.7) return [0.9, 0.92, 1.0];        // 过渡蓝白
  return [0.812, 0.878, 1.0];                          // #cfe0ff 旋臂 9000K
}

const Q: Record<Quality, number> = { high: 150000, medium: 60000, low: 20000 };

export default function StarVortex() {
  const { scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef(0);
  const quality = useUIStore((s) => s.quality);
  const particleCount = Q[quality];

  useEffect(() => {
    const g = new THREE.Group();
    groupRef.current = g;
    scene.add(g);
    g.renderOrder = -1;

    const posArr = new Float32Array(particleCount * 3);
    const colArr = new Float32Array(particleCount * 3);
    const sizArr = new Float32Array(particleCount);

    let idx = 0;
    for (let i = 0; i < particleCount * 3 && idx < particleCount; i++) {
      const r = FIELD_RADIUS * Math.pow(Math.random(), 0.6);
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
      const z = r * Math.cos(phi);

      const nv = fbm3D(x * 0.02, y * 0.04, z * 0.02, 6, 2.3, 0.55);
      const distRatio = r / FIELD_RADIUS;
      if (nv < 0.35 + distRatio * 0.25) continue;

      posArr[idx * 3] = x;
      posArr[idx * 3 + 1] = y;
      posArr[idx * 3 + 2] = z;

      const col = radialColor(distRatio);
      colArr[idx * 3] = col[0];
      colArr[idx * 3 + 1] = col[1];
      colArr[idx * 3 + 2] = col[2];
      sizArr[idx] = 1.2 + nv * 2.5 + (1 - distRatio) * 2.0;
      idx++;
    }

    const actualCount = idx;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',
      new THREE.BufferAttribute(posArr.slice(0, actualCount * 3), 3));
    geo.setAttribute('color',
      new THREE.BufferAttribute(colArr.slice(0, actualCount * 3), 3));
    geo.setAttribute('size',
      new THREE.BufferAttribute(sizArr.slice(0, actualCount), 1));

    const seedArr = new Float32Array(actualCount);
    for (let i = 0; i < actualCount; i++) seedArr[i] = Math.random();
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seedArr, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: glowTex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uTime: { value: 0 },
      },
      vertexShader: `attribute float size; attribute vec3 color; attribute float aSeed;
varying vec3 vColor; varying float vSeed; uniform float uPixelRatio; uniform float uTime;
void main(){vColor=color;vSeed=aSeed;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*uPixelRatio*(220.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform sampler2D uTex; uniform float uTime;
varying vec3 vColor; varying float vSeed;
void main(){float tw=0.7+0.3*sin(uTime*0.8+vSeed*6.283);vec4 t=texture2D(uTex,gl_PointCoord);if(t.a<0.01)discard;gl_FragColor=vec4(vColor*tw,1.0)*t.a;}`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    g.add(new THREE.Points(geo, mat));

    const anim = () => {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.016 * 0.003;
        groupRef.current.rotation.x += 0.016 * 0.0005;
      }
      (mat.uniforms.uTime as any).value += 0.016;
      frameRef.current = requestAnimationFrame(anim);
    };
    anim();

    return () => {
      cancelAnimationFrame(frameRef.current);
      scene.remove(g);
      geo.dispose();
      mat.dispose();
    };
  }, [scene, quality]);

  return null;
}
