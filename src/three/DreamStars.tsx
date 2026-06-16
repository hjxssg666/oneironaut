import { useMemo, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useDreamStore, type Dream } from '../store/dreamStore';

/** 梦境实星（可交互 + raycaster 精准点击） */
export default function DreamStars() {
  const dreams = useDreamStore((s) => s.dreams);
  const selectDream = useDreamStore((s) => s.selectDream);
  const { camera, gl, raycaster, pointer } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(dreams.length * 3);
    const col = new Float32Array(dreams.length * 3);

    const moodColors: Record<string, THREE.Color> = {
      serene: new THREE.Color('#a8d8ff'),
      joy: new THREE.Color('#ffd27a'),
      fear: new THREE.Color('#7a6aff'),
      anger: new THREE.Color('#ff5a5a'),
      sorrow: new THREE.Color('#5a8aff'),
      mystic: new THREE.Color('#b96aff'),
      anxious: new THREE.Color('#5ac8a8'),
      nostalgic: new THREE.Color('#d8a878'),
    };
    const defaultColor = new THREE.Color('#ffd27a');

    dreams.forEach((d, i) => {
      pos[i * 3] = d.position[0];
      pos[i * 3 + 1] = d.position[1];
      pos[i * 3 + 2] = d.position[2];

      const c = moodColors[d.emotion] ?? defaultColor;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    });

    return [pos, col];
  }, [dreams]);

  /** Raycaster 精准点击检测 */
  const handleClick = useCallback(
    (event: THREE.Event) => {
      event.stopPropagation();

      if (!pointsRef.current || dreams.length === 0) return;

      // 设置射线
      raycaster.setFromCamera(pointer, camera);

      // 增大命中阈值（点粒子坐标精度要求）
      raycaster.params.Points!.threshold = 0.25;

      const intersects = raycaster.intersectObject(pointsRef.current);

      if (intersects.length > 0) {
        const idx = intersects[0].index!;
        if (idx >= 0 && idx < dreams.length) {
          selectDream(dreams[idx]);
        }
      }
    },
    [camera, raycaster, pointer, dreams, selectDream],
  );

  if (dreams.length === 0) return null;

  return (
    <points ref={pointsRef} onClick={handleClick}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={dreams.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={dreams.length}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.4}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.9}
        sizeAttenuation
      />
    </points>
  );
}
