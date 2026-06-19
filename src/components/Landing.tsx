import { useRef, useEffect, useState, useCallback } from 'react';
import { useUIStore } from '../store/uiStore';

export default function Landing() {
  const isLandingDone = useUIStore((s) => s.isLandingDone);
  const setLandingProgress = useUIStore((s) => s.setLandingProgress);
  const finishLanding = useUIStore((s) => s.finishLanding);
  const [activeSection, setActiveSection] = useState(0);
  const [exiting, setExiting] = useState(false);
  const accumulated = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // 触控起始位置
  const touchStartY = useRef(0);

  const sections = [
    { title: '梦海', subtitle: 'Oneironaut', desc: '每一条梦都是一颗星' },
    { title: '', subtitle: '', desc: '梦与梦之间的虚空，\n是尚未发生的叙事。\n闭上眼，星海在呼吸。' },
    { title: '', subtitle: '', desc: '', cta: '进入梦海' },
  ];

  const advance = useCallback((delta: number) => {
    accumulated.current += delta;
    const step = accumulated.current / 120 / 3;
    const progress = Math.max(0, Math.min(1, step));
    setLandingProgress(progress);
    setActiveSection(progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2);
  }, [setLandingProgress]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      advance(e.deltaY);
    },
    [advance],
  );

  /** 触控滑动 */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const dy = touchStartY.current - e.touches[0].clientY;
    advance(dy - (accumulated.current * 120 * 3)); // 基于当前位置
    touchStartY.current = e.touches[0].clientY;
  }, [advance]);

  const handleClick = useCallback(() => {
    setLandingProgress(1);
    setExiting(true);
    setTimeout(() => finishLanding(), 800);
  }, [setLandingProgress, finishLanding]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('click', handleClick);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('click', handleClick);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleClick, handleTouchStart, handleTouchMove]);

  if (isLandingDone) return null;
  const s = sections[activeSection];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',  // 透明，让星辰穿透
        transition: 'opacity 0.8s var(--ease-spring)',
        opacity: exiting ? 0 : 1,
        pointerEvents: exiting ? 'none' : 'auto',
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      {/* 段落指示器 */}
      <div style={{ position: 'absolute', bottom: 60, display: 'flex', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: activeSection === i ? 24 : 8,
              height: 2,
              background: activeSection === i ? 'var(--gold-500)' : 'var(--alpha-white-12)',
              borderRadius: 1,
              transition: 'all 0.4s var(--ease-spring)',
            }}
          />
        ))}
      </div>

      {/* 提示：点击任意位置进入 */}
      <div style={{
        position: 'absolute', bottom: 24, color: 'var(--muted-100)',
        fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-sm)', opacity: 0.7,
        animation: 'breathe-glow 3s ease-in-out infinite',
      }}>
        点击任意位置进入梦海
      </div>

      {activeSection === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, animation: 'fadeSlideIn 0.8s var(--ease-spring)', textShadow: '0 0 24px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.9)' }}>
          <h1 style={{ fontFamily: 'var(--font-dream)', fontSize: 'clamp(52px, 10vw, 100px)', color: 'var(--gold-500)', fontWeight: 'var(--fw-light)', margin: 0, letterSpacing: '0.18em' }}>{s.title}</h1>
          <span style={{ fontFamily: 'var(--font-dream)', fontSize: 'clamp(16px, 2.5vw, 24px)', color: 'var(--fg-200)', fontWeight: 'var(--fw-light)', letterSpacing: '0.3em' }}>{s.subtitle}</span>
          <p style={{ fontFamily: 'var(--font-dream)', fontSize: 'var(--text-heading-2)', color: 'var(--fg-200)', marginTop: 40 }}>{s.desc}</p>
        </div>
      )}

      {activeSection === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, animation: 'fadeSlideIn 0.6s var(--ease-spring)', maxWidth: 480, padding: '0 32px', textShadow: '0 0 20px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.9)' }}>
          <p style={{ fontFamily: 'var(--font-dream)', fontSize: 'var(--text-heading-2)', color: 'var(--fg-200)', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 2.2, fontWeight: 'var(--fw-light)' }}>{s.desc}</p>
        </div>
      )}

      {activeSection === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeSlideIn 0.5s var(--ease-spring)' }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleClick(); }}
            style={{
              fontFamily: 'var(--font-dream)', fontSize: 'var(--text-heading-2)', color: 'var(--ink-900)', background: 'var(--gold-500)',
              border: 'none', borderRadius: 'var(--radius-full)', padding: '14px 56px', cursor: 'pointer',
              boxShadow: '0 0 40px rgba(255,210,122,0.15)', transition: 'all 0.4s var(--ease-natural)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 60px rgba(255,210,122,0.35)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 40px rgba(255,210,122,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >{s.cta}</button>
        </div>
      )}
    </div>
  );

  // 注入动画
  if (typeof document !== 'undefined' && !(document as any).__landingStyleDone) {
    (document as any).__landingStyleDone = true;
    const s = document.createElement('style');
    s.textContent = '@keyframes fadeSlideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(s);
  }
}
