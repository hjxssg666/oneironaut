import { Canvas } from '@react-three/fiber';
import StarField from './StarField';
import DreamStars from './DreamStars';
import BloomEffect from './BloomEffect';
import CameraController from './CameraController';
import FluidBackground from './FluidBackground';
import GhostParticles from './GhostParticles';
import * as THREE from 'three';

/** 3D 主场景 — 流体深空背景 + 星空 + 幽灵粒子 + 后期 */
export default function Scene3D() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 0, 150], fov: 60, near: 0.1, far: 600 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        powerPreference: 'high-performance',
      }}
      onCreated={({ scene, gl: renderer }) => {
        scene.background = new THREE.Color('#030408');
        scene.fog = new THREE.FogExp2('#04050a', 0.0001);

        const isWebGL2 = renderer.capabilities.isWebGL2;
        if (!isWebGL2) {
          console.warn('WebGL2 不可用，流体背景效果将降级');
        }
      }}
    >
      <FluidBackground />
      <ambientLight intensity={0.08} />
      <StarField />

      {/* 多人幽灵粒子 */}
      <GhostParticles />

      <DreamStars />
      <BloomEffect />
      <CameraController />
    </Canvas>
  );
}
