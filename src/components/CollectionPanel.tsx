import { useState, useMemo } from 'react';
import { useDreamStore } from '../store/dreamStore';
import SlidePanel from './SlidePanel';
import { useUIStore } from '../store/uiStore';
import { moodLabels, moodColors } from '../constants/moods';

/** 拾遗收藏面板 — 数据源为 localStorage 珍藏列表 */
export default function CollectionPanel() {
  const dreams = useDreamStore((s) => s.dreams);
  const selectDream = useDreamStore((s) => s.selectDream);
  const selectedView = useUIStore((s) => s.selectedView);
  const setView = useUIStore((s) => s.setView);

  const [search, setSearch] = useState('');

  // 从 localStorage 读取珍藏的 dream ID 列表
  const favIds: string[] = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('dreamsea-favs') || '[]'); }
    catch { return []; }
  }, []);

  // 匹配的珍藏梦境
  const favDreams = useMemo(
    () => dreams.filter(d => favIds.includes(d.id)),
    [dreams, favIds],
  );

  const filtered = search.trim()
    ? favDreams.filter(
        (d) =>
          d.content.includes(search) ||
          d.themes.some((t) => t.includes(search)),
      )
    : favDreams;

  return (
    <SlidePanel
      open={selectedView === 'collect'}
      onClose={() => setView('stars')}
      title="拾遗 · 收藏"
    >
      {/* 搜索 */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索珍藏梦境..."
        style={{
          width: '100%',
          padding: '8px 12px',
          marginBottom: 16,
          background: 'var(--alpha-white-04)',
          border: '1px solid var(--alpha-white-12)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--fg-100)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--text-body-sm)',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* 统计 */}
      <p
        style={{
          color: 'var(--muted-200)',
          fontSize: 'var(--text-caption)',
          fontFamily: 'var(--font-mono)',
          marginBottom: 16,
        }}
      >
        共 {favDreams.length} 条珍藏梦境
      </p>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: 'var(--muted-100)',
            fontFamily: 'var(--font-dream)',
            fontSize: 'var(--text-body-md)',
          }}
        >
          {favDreams.length === 0
            ? '还没有珍藏的梦境，点击梦境详情中的 ⭐ 珍藏'
            : '未找到匹配的梦境'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => { selectDream(d); useUIStore.getState().setDreamCardOpen(true); }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px',
                background: 'var(--alpha-white-03)',
                border: '1px solid var(--alpha-white-06)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--alpha-white-06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--alpha-white-03)';
              }}
            >
              {/* 情绪色点 */}
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: moodColors[d.emotion] ?? 'var(--gold-500)',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    color: 'var(--fg-200)',
                    fontFamily: 'var(--font-dream)',
                    fontSize: 'var(--text-body-sm)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.5,
                  }}
                >
                  {d.content.slice(0, 60)}
                  {d.content.length > 60 ? '...' : ''}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 6,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    color: moodColors[d.emotion] ?? 'var(--gold-500)',
                  }}>
                    {moodLabels[d.emotion] ?? d.emotion}
                  </span>
                  {d.themes.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="tag"
                      style={{ fontSize: 9, padding: '1px 6px' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 收藏占位 */}
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--muted-200)',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              >
                ⭐
              </span>
            </button>
          ))}
        </div>
      )}
    </SlidePanel>
  );
}
