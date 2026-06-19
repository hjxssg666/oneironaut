import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useDreamStore } from '../store/dreamStore';

/** T-013: 交互式场景引导 — 相机自动飞行 + 脉冲星发现 */
export default function Onboarding() {
  const isOnboarding = useUIStore((s) => s.isOnboarding);
  const setOnboarding = useUIStore((s) => s.setOnboarding);
  const dreams = useDreamStore((s) => s.dreams);
  const selectDream = useDreamStore((s) => s.selectDream);

  const [phase, setPhase] = useState<'fly' | 'pulse' | 'done'>('fly');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!isOnboarding) return;

    // Phase 1: 自动飞行 3.5s
    setPhase('fly');
    timerRef.current = setTimeout(() => {
      // Phase 2: 脉冲星提示 3s
      setPhase('pulse');
      timerRef.current = setTimeout(() => {
        // Phase 3: 欢迎文字 2s → 结束
        setPhase('done');
        timerRef.current = setTimeout(() => {
          setOnboarding(false);
        }, 2500);
      }, 3000);
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOnboarding, setOnboarding]);

  /** 点击脉冲星 → 立即结束引导并选中 */
  const handleStarClick = () => {
    if (dreams.length > 0) {
      selectDream(dreams[0]);
    }
    setOnboarding(false);
  };

  if (!isOnboarding) return null;

  return (
    <>
      {/* fly 阶段：飞行提示 */}
      {phase === 'fly' && (
        <div style={{ position:'fixed', bottom:'30%', left:'50%', transform:'translateX(-50%)', zIndex:25, pointerEvents:'none' }}>
          <p style={{ fontFamily:'var(--font-dream)', fontSize:'var(--text-body-lg)', color:'var(--gold-500)', opacity:0.7, textShadow:'0 0 16px var(--gold-500)66', animation:'breathe-glow 3s ease-in-out infinite' }}>
            正在飞向星海深处...
          </p>
        </div>
      )}

      {/* 半透明遮罩 (仅在 done 阶段显示文字时才需要) */}
      {phase === 'done' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 25,
            background: 'rgba(2,3,8,0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'var(--text-heading-2)',
              color: 'var(--gold-500)',
              fontWeight: 'var(--fw-light)',
              animation: 'fadeSlideIn 0.8s var(--ease-spring)',
              textAlign: 'center',
            }}
          >
            你的梦是一颗星
            <br />
            <span style={{ fontSize: 'var(--text-body-md)', color: 'var(--fg-200)', marginTop: 12, display: 'inline-block' }}>
              WASD 飞行 · 拖拽转向 · 滚轮调速 · H 隐藏
            </span>
          </p>
        </div>
      )}

      {/* 脉冲星指示器 (fly + pulse 阶段) */}
      {(phase === 'fly' || phase === 'pulse') && (
        <div
          onClick={handleStarClick}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 25,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--gold-500)',
            boxShadow: phase === 'pulse'
              ? '0 0 30px var(--gold-500), 0 0 60px var(--gold-500)'
              : '0 0 15px var(--gold-500)',
            animation: phase === 'pulse' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            cursor: 'pointer',
            transition: 'box-shadow 0.5s',
          }}
          title="点我"
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
          50% { transform: translate(-50%, -50%) scale(1.8); opacity: 1; }
        }
      `}</style>
    </>
  );
}
