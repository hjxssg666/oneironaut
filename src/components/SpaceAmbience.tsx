/**
 * SpaceAmbience — 星空氛围音
 * Web Audio API 生成低频太空式回响，低音量不打扰
 */
import { useEffect, useRef } from 'react';

export default function SpaceAmbience() {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // 用户交互后才允许 AudioContext
    const start = () => {
      if (ctxRef.current) return;
      const ctx = new AudioContext();
      ctxRef.current = ctx;

      // 低频嗡嗡底音
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 62;
      gain1.gain.value = 0.04;
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start();

      // 轻微波动和声
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 110;
      gain2.gain.value = 0.02;
      // LFO 调制音量：缓起缓落
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08; // 12秒一周期
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain).connect(gain2.gain);
      lfo.start();
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start();

      // 高频微光
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.value = 280;
      const lfo2 = ctx.createOscillator();
      const lfoGain2 = ctx.createGain();
      lfo2.type = 'sine';
      lfo2.frequency.value = 0.05;
      lfoGain2.gain.value = 0.01;
      lfo2.connect(lfoGain2).connect(gain3.gain);
      lfo2.start();
      gain3.gain.value = 0.015;
      osc3.connect(gain3).connect(ctx.destination);
      osc3.start();

      window.removeEventListener('click', start);
      window.removeEventListener('touchstart', start);
    };

    window.addEventListener('click', start);
    window.addEventListener('touchstart', start);
    return () => {
      window.removeEventListener('click', start);
      window.removeEventListener('touchstart', start);
      ctxRef.current?.close();
    };
  }, []);

  return null;
}
