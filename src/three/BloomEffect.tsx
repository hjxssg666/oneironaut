import { EffectComposer, Bloom } from '@react-three/postprocessing';

/** UnrealBloom 后期效果 - 与诗云同款 */
export default function BloomEffect() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.4}
        luminanceSmoothing={0.6}
        intensity={0.9}
        radius={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}
