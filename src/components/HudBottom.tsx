import { useCameraStore } from '../store/cameraStore';
import { useUIStore, type Quality } from '../store/uiStore';
import { useDreamStore } from '../store/dreamStore';

const Q_LABEL: Record<Quality, string> = { high: '星辉', medium: '薄雾', low: '微光' };

export default function HudBottom() {
  const speed = useCameraStore((s) => s.speed);
  const isHudVisible = useUIStore((s) => s.isHudVisible);
  const quality = useUIStore((s) => s.quality);
  const cycleQuality = useUIStore((s) => s.cycleQuality);
  const fiberNetMode = useUIStore((s) => s.fiberNetMode);
  const dreamCount = useDreamStore((s) => s.dreams.length);

  if (!isHudVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 44,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        fontFamily: 'var(--font-dream)',
        fontSize: 'var(--text-caption)',
        color: 'var(--muted-100)',
        background: 'rgba(0,0,0,0)',
        pointerEvents: 'none',
      }}
    >
      <span style={{ opacity: 0.55, fontSize: 'var(--text-body-sm)' }}>御风而行 · 拖拽览星 · 滚轮疾驰</span>

      {fiberNetMode === 'all' && (
        <span style={{
          color: 'var(--cyan-300)',
          fontSize: 'var(--text-body)',
          fontWeight: 600,
          textShadow: '0 0 20px var(--cyan-400), 0 0 40px var(--cyan-400)',
          letterSpacing: 1,
          animation: 'breathe-glow 2s ease-in-out infinite',
        }}>
          {Math.floor(dreamCount / 2).toLocaleString()} 条星脉共振中
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ opacity: 0.6, fontSize: 'var(--text-body-sm)' }}>轻掠 · {Math.round(speed)}</span>

        <button
          onClick={cycleQuality}
          style={{
            pointerEvents: 'auto',
            fontFamily: 'var(--font-dream)',
            fontSize: 'var(--text-body)',
            fontWeight: 500,
            color: 'var(--gold-400)',
            background: 'var(--alpha-gold-16)',
            border: '1px solid var(--alpha-gold-50)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 20px',
            cursor: 'pointer',
            transition: 'all 0.35s var(--ease-natural)',
            animation: 'breathe-glow 3s ease-in-out infinite',
            textShadow: '0 0 8px var(--gold-400)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--alpha-gold-40)';
            e.currentTarget.style.transform = 'scale(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--alpha-gold-16)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {Q_LABEL[quality]}
        </button>
      </div>

      <span style={{ opacity: 0.5, fontSize: 'var(--text-body-sm)', cursor: 'default', pointerEvents: 'auto' }}>隐 · H</span>
    </div>
  );
}
