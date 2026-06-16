import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useUIStore, type Quality } from '../store/uiStore';

/** 画质 → 粒子数映射 */
const QUALITY_COUNTS: Record<Quality, number> = {
  high: 3000,
  medium: 1500,
  low: 500,
};

/** 画质 → 粒子大小映射 */
const QUALITY_SIZES: Record<Quality, number> = {
  high: 0.25,
  medium: 0.3,
  low: 0.4,
};

/** 背景星粒子 - 球形分布，靛蓝梦境色调，支持画质分级 */
export default function StarField() {
  const quality = useUIStore((s) => s.quality);
  const count = QUALITY_COUNTS[quality];
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    // 靛蓝梦境配色：深靛蓝 → 淡薰衣草 → 少量金点缀
    const indigo = new THREE.Color('#4a6cf7');
    const lavender = new THREE.Color('#c4b5fd');
    const gold = new THREE.Color('#ffd27a');
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = 60 + Math.random() * 250;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // 靛蓝梦境分布：60% 靛蓝→薰衣草 + 30% 薰衣草→淡金 + 10% 纯金点缀
      const t = Math.random();
      if (t < 0.6) {
        tempColor.copy(indigo).lerp(lavender, t / 0.6);
      } else if (t < 0.9) {
        tempColor.copy(lavender).lerp(
          new THREE.Color('#e8d5c4'),
          (t - 0.6) / 0.3,
        );
      } else {
        tempColor.copy(gold).multiplyScalar(0.6);
      }

      col[i * 3] = tempColor.r;
      col[i * 3 + 1] = tempColor.g;
      col[i * 3 + 2] = tempColor.b;
    }

    return [pos, col];
  }, [count]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={QUALITY_SIZES[quality]}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}
