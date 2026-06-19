/**
 * BirthFlash — "缀一颗星" 创建闪光粒子动画
 * 新星诞生时在坐标位置播2.2秒闪光粒子
 */
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDreamStore } from '../store/dreamStore';
import { glowTex } from './DreamCloud';

const FLASH_COUNT = 60;
const DURATION = 2.2;
const RADIUS = 18;

export default function BirthFlash() {
  const { scene } = useThree();
  const dreams = useDreamStore((s) => s.dreams);
  const prevCount = useRef(dreams.length);
  const ref = useRef<THREE.Points | null>(null);

  useEffect(() => {
    if (dreams.length > prevCount.current) {
      const latest = dreams[dreams.length - 1];
      const [cx, cy, cz] = latest.position;
      prevCount.current = dreams.length;

      const posArr = new Float32Array(FLASH_COUNT * 3);
      const colArr = new Float32Array(FLASH_COUNT * 3);
      const sizArr = new Float32Array(FLASH_COUNT);
      const seedArr = new Float32Array(FLASH_COUNT);

      for (let i = 0; i < FLASH_COUNT; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        const r = RADIUS * Math.pow(Math.random(), 0.5);
        posArr[i * 3] = cx + r * Math.sin(phi) * Math.cos(theta);
        posArr[i * 3 + 1] = cy + r * Math.sin(phi) * Math.sin(theta);
        posArr[i * 3 + 2] = cz + r * Math.cos(phi);
        colArr[i * 3] = 1.0;
        colArr[i * 3 + 1] = 0.84;
        colArr[i * 3 + 2] = 0.4;
        sizArr[i] = 3.0 + Math.random() * 4.0;
        seedArr[i] = Math.random();
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizArr, 1));
      geo.setAttribute('aSeed', new THREE.BufferAttribute(seedArr, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { uTex: { value: glowTex }, uTime: { value: 0 }, uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) } },
        vertexShader: `attribute float size; attribute vec3 color; varying vec3 vColor; uniform float uPixelRatio;
void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*uPixelRatio*(300.0/-mv.z);gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `uniform sampler2D uTex; uniform float uTime; varying vec3 vColor;
void main(){vec4 t=texture2D(uTex,gl_PointCoord);if(t.a<0.01)discard;float a=t.a*max(0.0,1.0-uTime/2.2);gl_FragColor=vec4(vColor,1.0)*a;}`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      });

      ref.current = new THREE.Points(geo, mat);
      scene.add(ref.current);

      const start = performance.now();
      const tick = () => {
        const elapsed = (performance.now() - start) / 1000;
        if (elapsed > DURATION) {
          scene.remove(ref.current!);
          geo.dispose();
          mat.dispose();
          ref.current = null;
          return;
        }
        (mat.uniforms.uTime as any).value = elapsed;
        requestAnimationFrame(tick);
      };
      tick();
    }
  }, [dreams.length, scene, dreams]);

  return null;
}
