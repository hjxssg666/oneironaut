import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import CameraController from './CameraController';
import FluidBackground from './FluidBackground';
import DreamCloud from './DreamCloud';
import StarVortex from './StarVortex';
import BirthFlash from './BirthFlash';
import GiftTrail from './GiftTrail';
import StarWhirl from './StarWhirl';
import { useUIStore } from '../store/uiStore';
import * as THREE from 'three';

const BLOOM_CFG = {
  high:   { intensity: 2.0, radius: 1.0, threshold: 0.03 },
  medium: { intensity: 1.0, radius: 0.6, threshold: 0.1 },
  low:    { intensity: 0,   radius: 0,   threshold: 0.2 },
} as const;

const FOG_CFG = { high: 0.00015, medium: 0.0001, low: 0.00005 } as const;

export default function Scene3D() {
  const quality = useUIStore((s) => s.quality);
  const bloom = BLOOM_CFG[quality];

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      camera={{ position: [0, 40, 180], fov: 60, near: 0.1, far: 600 }}
      gl={{
        antialias: quality !== 'low',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: quality === 'high' ? 1.4 : 1.1,
        powerPreference: quality === 'low' ? 'low-power' : 'high-performance',
        preserveDrawingBuffer: true,
      }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#020208');
        scene.fog = new THREE.FogExp2('#06061a', FOG_CFG[quality]);
      }}
    >
      <FluidBackground />
      <StarVortex />
      <ambientLight intensity={0.08} />
      <StarWhirl />
      <DreamCloud />
      <BirthFlash />
      <GiftTrail />
      <CameraController />
      {bloom.intensity > 0 && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={bloom.threshold}
            luminanceSmoothing={0.9}
            intensity={bloom.intensity}
            radius={bloom.radius}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
