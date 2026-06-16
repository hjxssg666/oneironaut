import { useCameraStore } from '../store/cameraStore';
import { useUIStore } from '../store/uiStore';
import { useDreamStore } from '../store/dreamStore';

/** 底部 HUD 栏 - WASD 说明 + 速度 + 操作提示 */
export default function HudBottom() {
  const speed = useCameraStore((s) => s.speed);
  const isHudVisible = useUIStore((s) => s.isHudVisible);
  const selectedDream = useDreamStore((s) => s.selectedDream);

  if (!isHudVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--hud-bottom-height)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-8)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-mono-sm)',
        color: 'var(--muted-100)',
        background: 'rgba(0,0,0,0)',
        pointerEvents: 'none',
      }}
    >
      <span>WASD 飞行 · 拖拽转向 · 滚轮调速</span>
      <span>
        速度 ×{speed.toFixed(1)} · {Math.round(speed)} 单位/秒
        {selectedDream ? ` · 点虚空生成` : ''}
      </span>
      <span style={{ pointerEvents: 'auto' }}>H 键隐藏 UI</span>
    </div>
  );
}
