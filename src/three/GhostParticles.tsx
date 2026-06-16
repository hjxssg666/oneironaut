import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWebSocket } from '../hooks/useWebSocket';

/** T-021: 多人幽灵粒子 — 通过 WebSocket 实时同步其他用户位置 */
export default function GhostParticles() {
  const { users, connected } = useWebSocket();
  const pointsRef = useRef<THREE.Points>(null);

  const ghostData = useMemo(() => {
    return users.map((u) => ({
      pos: [u.position.x, u.position.y, u.position.z] as [number, number, number],
      color: u.color,
      id: u.id,
    }));
  }, [users]);

  const count = ghostData.length;
  if (count === 0) return null;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    ghostData.forEach((g, i) => {
      arr[i * 3] = g.pos[0];
      arr[i * 3 + 1] = g.pos[1];
      arr[i * 3 + 2] = g.pos[2];
    });
    return arr;
  }, [ghostData]);

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    ghostData.forEach((g, i) => {
      const c = new THREE.Color(g.color);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    });
    return arr;
  }, [ghostData]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = connected ? 0.35 + Math.sin(t * 1.5) * 0.15 : 0.15;
  });

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
        size={4}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}
