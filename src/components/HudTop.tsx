import { useDreamStore } from '../store/dreamStore';
import { useUIStore } from '../store/uiStore';
import { useEffect, useState } from 'react';

/** 顶部 HUD 栏 - 梦海 title + 搜索 + 时间线 + 收藏 */
export default function HudTop() {
  const dreamCount = useDreamStore((s) => s.dreams.length);
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const setInputOpen = useUIStore((s) => s.setInputOpen);
  const isHudVisible = useUIStore((s) => s.isHudVisible);
  const selectedView = useUIStore((s) => s.selectedView);
  const setView = useUIStore((s) => s.setView);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isHudVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--hud-top-height)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-8)',
        background: 'rgba(0,0,0,0)',
        pointerEvents: 'none',
      }}
    >
      {/* 左：品牌 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 32, pointerEvents: 'auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-dream)',
            fontSize: isMobile ? 'var(--text-heading-2)' : 'var(--text-heading-1)',
            color: 'var(--gold-500)',
            fontWeight: 'var(--fw-light)',
            margin: 0,
            userSelect: 'none',
          }}
        >
          梦海
        </h1>
        <span style={{ color: 'var(--muted-100)', fontSize: 'var(--text-body-sm)' }}>
          {dreamCount} 条
        </span>
      </div>

      {/* 右：操作 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, pointerEvents: 'auto' }}>
        <button
          className="btn"
          onClick={() => setView(selectedView === 'timeline' ? 'stars' : 'timeline')}
          style={{ fontSize: isMobile ? 12 : undefined }}
        >
          📋 {isMobile ? '' : '时间线'}
        </button>
        <button
          className="btn"
          onClick={() => setView(selectedView === 'collect' ? 'stars' : 'collect')}
          style={{ fontSize: isMobile ? 12 : undefined }}
        >
          ⭐ {isMobile ? '' : '拾遗'}
        </button>
        <button
          className="btn"
          onClick={() => setView(selectedView === 'ai' ? 'stars' : 'ai')}
          style={{ fontSize: isMobile ? 12 : undefined, color: selectedView === 'ai' ? 'var(--gold-500)' : undefined }}
        >
          🤖 {isMobile ? '' : 'AI'}
        </button>
        <button className="btn" onClick={toggleSearch} style={{ fontSize: isMobile ? 12 : undefined }}>
          🔍 {isMobile ? '' : '搜索'}
        </button>
        <button className="btn btn-primary" onClick={() => setInputOpen(true)} style={{ fontSize: isMobile ? 12 : undefined }}>
          + {isMobile ? '' : '记下你的梦'}
        </button>
      </div>
    </div>
  );
}
