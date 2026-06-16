import { Canvas } from '@react-three/fiber';
import StarField from './StarField';
import DreamStars from './DreamStars';
import BloomEffect from './BloomEffect';
import CameraController from './CameraController';
import FluidBackground from './FluidBackground';
import * as THREE from 'three';

/** 3D 主场景 — 流体深空背景 + 星空 + 后期 */
export default function Scene3D() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 0, 150], fov: 60, near: 0.1, far: 600 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        // WebGL2 能力检测（低端设备可降级）
        powerPreference: 'high-performance',
      }}
      onCreated={({ scene, gl: renderer }) => {
        // 深空底色（流体着色器覆盖前的基础色）
        scene.background = new THREE.Color('#030408');
        // 指数雾 — 深空距离感
        scene.fog = new THREE.FogExp2('#04050a', 0.0001);

        // WebGL2 检测
        const isWebGL2 = renderer.capabilities.isWebGL2;
        if (!isWebGL2) {
          console.warn('WebGL2 不可用，流体背景效果将降级');
        }
      }}
    >
      {/* 流体 FBM 噪声背景（深空云层效果） */}
      <FluidBackground />

      {/* 环境光 */}
      <ambientLight intensity={0.08} />

      {/* 3000 颗背景星（支持画质分级） */}
      <StarField />

      {/* 梦境实星（支持 raycaster 精准点击） */}
      <DreamStars />

      {/* UnrealBloom 辉光后期 */}
      <BloomEffect />

      {/* WASD 飞行控制 */}
      <CameraController />
    </Canvas>
  );
}
