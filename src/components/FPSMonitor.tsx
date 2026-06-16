import { useEffect, useRef, useState } from 'react';
import { useUIStore, type Quality } from '../store/uiStore';

/** 根据设备能力自动推荐画质 */
function detectQuality(): Quality {
  const mem = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;

  if (mem >= 8 && cores >= 8 && dpr >= 2) return 'high';
  if (mem >= 4 && cores >= 4) return 'medium';
  return 'low';
}

/** FPS 性能监控组件 — 含画质自动检测 + 帧时间 + 诊断信息 */
export default function FPSMonitor() {
  const isHudVisible = useUIStore((s) => s.isHudVisible);
  const quality = useUIStore((s) => s.quality);
  const setQuality = useUIStore((s) => s.setQuality);

  const [fps, setFps] = useState(60);
  const [minFps, setMinFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16);
  const [autoDetected, setAutoDetected] = useState(false);
  const frameCount = useRef(0);
  const lastSecond = useRef(performance.now());
  const minRef = useRef(Infinity);
  const totalFrames = useRef(0);
  const totalTime = useRef(0);
  const rafId = useRef<number>(0);
  const lastFrame = useRef(performance.now());

  // T-014: 启动时自动检测设备能力
  useEffect(() => {
    if (!autoDetected) {
      const detected = detectQuality();
      setQuality(detected);
      setAutoDetected(true);
    }
  }, [autoDetected, setQuality]);

  useEffect(() => {
    const tick = () => {
      const now = performance.now();
      const ft = now - lastFrame.current;
      lastFrame.current = now;

      frameCount.current++;
      totalFrames.current++;
      totalTime.current += ft;

      if (now - lastSecond.current >= 1000) {
        const currentFps = Math.round((frameCount.current / (now - lastSecond.current)) * 1000);
        setFps(currentFps);
        setFrameTime(Math.round(ft * 100) / 100);

        const avg = Math.round((totalFrames.current / totalTime.current) * 1000);
        setAvgFps(avg);

        if (currentFps < minRef.current) {
          minRef.current = currentFps;
          setMinFps(currentFps);
        }

        frameCount.current = 0;
        lastSecond.current = now;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  if (!isHudVisible) return null;

  const color =
    fps >= 55 ? 'var(--muted-200)' :
    fps >= 30 ? '#d8a878' :
    '#ff5a5a';

  const dotColor =
    fps >= 55 ? '#5ac8a8' :
    fps >= 30 ? '#d8a878' :
    '#ff5a5a';

  const qualityLabel = { high: '高', medium: '中', low: '低' }[quality];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 48,
        left: 16,
        zIndex: 20,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-mono-xs, 11px)',
        background: 'rgba(2, 3, 8, 0.7)',
        padding: '4px 10px',
        borderRadius: 4,
        userSelect: 'none',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
        {fps} FPS · avg {avgFps} · min {minFps}
      </div>
      <div style={{ color: 'var(--muted-200)', fontSize: 10 }}>
        {frameTime}ms · 画质 {qualityLabel}
      </div>
    </div>
  );
}
