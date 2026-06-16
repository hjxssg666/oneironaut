import { useRef, useEffect, useState, useCallback } from 'react';
import { useUIStore } from '../store/uiStore';

/** 落地页 — 渐进体验型，滚动驱动 3 段内容 + 视差联动 */
export default function Landing() {
  const isLandingDone = useUIStore((s) => s.isLandingDone);
  const setLandingProgress = useUIStore((s) => s.setLandingProgress);
  const finishLanding = useUIStore((s) => s.finishLanding);

  const [activeSection, setActiveSection] = useState(0);
  const [exiting, setExiting] = useState(false);
  const accumulated = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const sections = [
    {
      title: '梦海',
      subtitle: 'Oneironaut',
      desc: '每一条梦都是一颗星',
    },
    {
      title: '',
      subtitle: '',
      desc: '梦与梦之间的虚空，\n是尚未发生的叙事。\n闭上眼，星海在呼吸。',
    },
    {
      title: '',
      subtitle: '',
      desc: '',
      cta: '进入梦海',
    },
  ];

  /** 滚动 → progress 映射 */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      accumulated.current += e.deltaY;
      // 每 120px 滚动量映射为 0→1 progress 的 1/3 段
      const step = accumulated.current / 120 / 3;
      const progress = Math.max(0, Math.min(1, step));

      setLandingProgress(progress);

      const section = progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2;
      setActiveSection(section);
    },
    [setLandingProgress],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /** CTA 点击 → 淡出动画 → 标记完成 */
  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => finishLanding(), 800);
  };

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
        background: 'rgba(2, 3, 8, 0.35)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        transition: 'opacity 0.8s var(--ease-spring)',
        opacity: exiting ? 0 : 1,
        pointerEvents: exiting ? 'none' : 'auto',
        userSelect: 'none',
        cursor: activeSection < 2 ? 'default' : 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* 第 1 节：品牌标题 */}
      {activeSection === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeSlideIn 0.8s var(--ease-spring)',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'clamp(48px, 8vw, 96px)',
              color: 'var(--gold-500)',
              fontWeight: 'var(--fw-light)',
              margin: 0,
              letterSpacing: '0.15em',
              animation: 'fadeSlideIn 1.2s var(--ease-spring)',
            }}
          >
            {s.title}
          </h1>
          <span
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'clamp(18px, 3vw, 28px)',
              color: 'var(--fg-200)',
              fontWeight: 'var(--fw-light)',
              letterSpacing: '0.3em',
              marginTop: 4,
            }}
          >
            {s.subtitle}
          </span>
          <p
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'var(--text-heading-2)',
              color: 'var(--muted-100)',
              marginTop: 32,
              animation: 'fadeSlideIn 1.6s var(--ease-spring)',
            }}
          >
            {s.desc}
          </p>
        </div>
      )}

      {/* 第 2 节：诗意引言 */}
      {activeSection === 1 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            animation: 'fadeSlideIn 0.6s var(--ease-spring)',
            maxWidth: 480,
            padding: '0 32px',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'var(--text-heading-2)',
              color: 'var(--fg-200)',
              textAlign: 'center',
              whiteSpace: 'pre-line',
              lineHeight: 2,
              fontWeight: 'var(--fw-light)',
            }}
          >
            {s.desc}
          </p>
        </div>
      )}

      {/* 第 3 节：CTA */}
      {activeSection === 2 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            animation: 'fadeSlideIn 0.6s var(--ease-spring)',
          }}
        >
          <button
            onClick={handleEnter}
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'var(--text-heading-2)',
              color: 'var(--ink-900)',
              background: 'var(--gold-500)',
              border: 'none',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '16px 48px',
              cursor: 'pointer',
              fontWeight: 'var(--fw-regular)',
              letterSpacing: '0.1em',
              transition: 'transform 0.3s, box-shadow 0.3s',
              boxShadow: '0 0 40px rgba(255,210,122,0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 60px rgba(255,210,122,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(255,210,122,0.15)';
            }}
          >
            {s.cta}
          </button>
        </div>
      )}

      {/* 段落指示器 */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          gap: 10,
        }}
      >
        {sections.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === activeSection ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background:
                i === activeSection
                  ? 'var(--gold-500)'
                  : 'var(--alpha-white-12)',
              transition: 'all 0.4s var(--ease-spring)',
            }}
          />
        ))}
      </div>

      {/* 动画注入 */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
