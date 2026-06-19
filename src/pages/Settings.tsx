import { useUIStore } from '../store/uiStore';

/** 设置页 */
export default function Settings() {
  const selectedView = useUIStore((s) => s.selectedView);
  const quality = useUIStore((s) => s.quality);
  const setQuality = useUIStore((s) => s.setQuality);
  const setView = useUIStore((s) => s.setView);

  if (selectedView !== 'settings') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'var(--ink-900)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="glass-panel" style={{ width: 400, padding: 'var(--space-10)' }}>
        <h2
          style={{
            fontFamily: 'var(--font-dream)',
            fontSize: 'var(--text-heading-1)',
            color: 'var(--gold-500)',
            fontWeight: 'var(--fw-light)',
            marginBottom: 'var(--space-8)',
          }}
        >
          设置
        </h2>

        {/* 画质 */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <p style={{ color: 'var(--muted-100)', marginBottom: 8 }}>画质</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['high', 'medium', 'low'] as const).map((q) => (
              <button
                key={q}
                className={`tag ${quality === q ? 'active' : ''}`}
                onClick={() => setQuality(q)}
              >
                {q === 'high' ? '高' : q === 'medium' ? '中' : '低'}
              </button>
            ))}
          </div>
        </div>

        {/* 快捷键 */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <p style={{ color: 'var(--muted-100)', marginBottom: 8 }}>快捷键</p>
          <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--fg-200)', fontFamily: 'var(--font-mono)' }}>
            <p>WASD — 飞行</p>
            <p>拖拽 — 转向</p>
            <p>滚轮 — 调速</p>
            <p>H — 隐藏 UI</p>
          </div>
        </div>

        {/* 返回 */}
        <button className="btn btn-primary" onClick={() => setView('stars')} style={{ width: '100%' }}>
          返回星海
        </button>

        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-100)', marginTop: 16, textAlign: 'center' }}>
          梦海 Oneironaut · v0.1.0
        </p>
      </div>
    </div>
  );
}
