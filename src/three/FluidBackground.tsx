import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** FBM 噪声 + 暖金色调流体空间背景 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorGold;

  // 2D 值噪声
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // FBM (Fractal Brownian Motion) — 6 层叠加
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float persistence = 0.55;
    float lacunarity = 2.1;

    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(p * frequency);
      frequency *= lacunarity;
      amplitude *= persistence;
    }
    return value;
  }

  void main() {
    // 域扭曲：噪声驱动坐标偏移，产生流体感
    vec2 q = vUv;
    float warp = noise(q * 2.5 + uTime * 0.03) * 0.08;
    q.x += warp;
    q.y += noise(q * 3.0 + uTime * 0.04 + 1.5) * 0.06;

    // FBM 叠加慢速漂移
    float f = fbm(q * 3.5 + uTime * 0.015);

    // 第二层大尺度流
    float f2 = fbm(q * 1.8 - uTime * 0.01 + vec2(2.0, 4.0));

    // 混合深度色、中间色、金色高光
    float mix1 = smoothstep(0.25, 0.65, f * 0.7 + f2 * 0.3);
    float mix2 = smoothstep(0.58, 0.78, f + f2 * 0.4);

    vec3 color = mix(uColorDeep, uColorMid, mix1);
    color = mix(color, uColorGold, mix2 * 0.25);

    // 微弱的渐晕
    float vignette = 1.0 - length(vUv - 0.5) * 0.45;
    color *= vignette;

    // 极低的整体亮度，保持星空为主视觉
    color *= 0.55;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function FluidBackground() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorDeep: { value: new THREE.Color('#04050a') },
      uColorMid: { value: new THREE.Color('#0a0f2e') },
      uColorGold: { value: new THREE.Color('#1a1040') },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (meshRef.current) {
      uniforms.uTime.value += dt || 0.016;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -490]} renderOrder={-1}>
      <planeGeometry args={[1400, 1400]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        transparent
      />
    </mesh>
  );
}
