import { useDreamStore } from '../store/dreamStore';
import { useUIStore } from '../store/uiStore';
import { useEffect, useState, useMemo } from 'react';

const EMO = ['全部', '悲伤', '恐惧', '焦虑', '怀旧', '神秘', '愤怒', '喜悦', '平静'] as const;
const EMO_KEY: Record<string, string | null> = {
  全部: null, 悲伤: 'sorrow', 恐惧: 'fear', 焦虑: 'anxious',
  怀旧: 'nostalgic', 神秘: 'mystic', 愤怒: 'anger', 喜悦: 'joy', 平静: 'serene',
};

export default function HudTop() {
  const dreamCount = useDreamStore((s) => s.dreams.length);
  const toggleSearch = useUIStore((s) => s.toggleSearch);
  const setInputOpen = useUIStore((s) => s.setInputOpen);
  const isHudVisible = useUIStore((s) => s.isHudVisible);
  const selectedView = useUIStore((s) => s.selectedView);
  const setView = useUIStore((s) => s.setView);
  const filter = useUIStore((s) => s.emotionFilter);
  const setFilter = useUIStore((s) => s.setEmotionFilter);
  const fiberNetMode = useUIStore((s) => s.fiberNetMode);
  const cycleFiberNetMode = useUIStore((s) => s.cycleFiberNetMode);
  const isFilterBarExpanded = useUIStore((s) => s.isFilterBarExpanded);
  const toggleFilterBar = useUIStore((s) => s.toggleFilterBar);
  const themeFilter = useUIStore((s) => s.themeFilter);
  const dreamTypeFilter = useUIStore((s) => s.dreamTypeFilter);

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
        zIndex: 10,
        pointerEvents: 'none',
        paddingTop: 'var(--space-4)',
      }}
    >
      {/* 主 HUD 行 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-8)',
          minHeight: 'var(--hud-top-height)',
          background: 'rgba(0,0,0,0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 32, pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h1 style={{
              fontFamily: 'var(--font-dream)',
              fontSize: isMobile ? 'var(--text-heading-2)' : 'var(--text-heading-1)',
              color: 'var(--gold-500)',
              fontWeight: 'var(--fw-light)',
              margin: 0,
              userSelect: 'none',
              animation: 'breathe-glow 3s ease-in-out infinite',
            }}>梦海</h1>
            <span style={{
              fontFamily: 'var(--font-dream)',
              fontSize: isMobile ? 'var(--text-caption)' : 'var(--text-body-sm)',
              color: 'var(--muted-200)',
              fontWeight: 'var(--fw-light)',
              letterSpacing: '0.15em',
            }}>Oneironaut</span>
          </div>
          <span style={{ color: 'var(--muted-100)', fontSize: 'var(--text-body-sm)', fontFamily: 'var(--font-dream)' }}>
            星语 · {dreamCount}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12, pointerEvents: 'auto' }}>
          {[ ['溯流','timeline'],['拾遗','collect'],['演梦','ai'],['设置','settings'] ].map(([label,view]) => (
            <button key={view}
              className="btn"
              onClick={() => setView(selectedView === view ? 'stars' : view as any)}
              style={{
                fontSize: isMobile ? 12 : undefined, fontFamily: 'var(--font-dream)',
                color: selectedView === view ? 'var(--gold-500)' : undefined,
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >{label}</button>
          ))}
          <button className="btn" onClick={() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return;
            const wm = document.createElement('canvas');
            wm.width = canvas.width; wm.height = canvas.height;
            const ctx = wm.getContext('2d')!;
            ctx.drawImage(canvas, 0, 0);
            ctx.fillStyle = 'rgba(255,210,122,0.6)';
            ctx.font = '14px "LXGW WenKai","Kaiti SC",serif';
            ctx.fillText('梦海 Oneironaut', 12, canvas.height - 20);
            const a = document.createElement('a');
            a.download = '梦海-' + Date.now() + '.png';
            a.href = wm.toDataURL('image/png');
            a.click();
          }}
            style={{ fontSize: isMobile ? 12 : undefined, fontFamily: 'var(--font-dream)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >留影</button>
          <button className="btn" onClick={toggleSearch}
            style={{ fontSize: isMobile ? 12 : undefined, fontFamily: 'var(--font-dream)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >寻星</button>
          <button className="btn" onClick={cycleFiberNetMode}
            style={{ fontSize: isMobile ? 12 : undefined, fontFamily: 'var(--font-dream)', color: fiberNetMode !== 'off' ? 'var(--gold-500)' : 'var(--muted-200)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >{{ off: '静海', selected: '牵星', all: '星罗' }[fiberNetMode]}</button>
          <button className="btn btn-primary" onClick={() => setInputOpen(true)}
            style={{ fontSize: isMobile ? 12 : undefined, fontFamily: 'var(--font-dream)', animation: 'breathe-glow 3s ease-in-out infinite', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
          >缀一颗星</button>
        </div>
      </div>

      {/* Task 5: 筛选区 — 收缩栏,贴在主 HUD 行下方左对齐 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 6,
          margin: '8px 0 0 var(--space-8)',
          width: 'fit-content',
          maxWidth: 'calc(100vw - 32px)',
          pointerEvents: 'auto',
        }}
      >
        {/* 始终可见的胶囊条 — 收起态 / 展开态的标题栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 10px 6px 14px',
            background: 'var(--alpha-white-04)',
            backdropFilter: 'blur(10px) saturate(160%)',
            WebkitBackdropFilter: 'blur(10px) saturate(160%)',
            border: '1px solid var(--alpha-white-08)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-dream)',
            fontSize: isMobile ? 11 : 'var(--text-caption)',
            color: 'var(--muted-100)',
            transition: 'all 0.3s var(--ease-natural)',
          }}
        >
          <span
            style={{
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--muted-200)',
              fontSize: 'var(--text-overline)',
              userSelect: 'none',
            }}
          >
            筛选
          </span>

          {/* 收起态:显示当前激活的标签(没有激活时显示提示) */}
          {!isFilterBarExpanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {filter && (
                <ActiveTag
                  group="情绪"
                  label={EMO.find((l) => EMO_KEY[l] === filter) || '全部'}
                  onClear={() => setFilter(null)}
                />
              )}
              {dreamTypeFilter && (
                <ActiveTag
                  group="类型"
                  label={dreamTypeFilter}
                  onClear={() => useUIStore.getState().setDreamTypeFilter(null)}
                />
              )}
              {themeFilter && (
                <ActiveTag
                  group="主题"
                  label={themeFilter}
                  onClear={() => useUIStore.getState().setThemeFilter(null)}
                />
              )}
              {!filter && !dreamTypeFilter && !themeFilter && (
                <span style={{ color: 'var(--muted-200)', fontSize: isMobile ? 11 : 'var(--text-caption)' }}>
                  未筛选
                </span>
              )}
            </div>
          )}

          {/* 展开按钮 */}
          <button
            onClick={toggleFilterBar}
            aria-label={isFilterBarExpanded ? '收起筛选' : '展开筛选'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              marginLeft: 2,
              background: 'transparent',
              border: '1px solid var(--alpha-white-12)',
              borderRadius: '50%',
              color: 'var(--muted-100)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.25s var(--ease-natural)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--gold-500)';
              e.currentTarget.style.borderColor = 'var(--gold-500)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted-100)';
              e.currentTarget.style.borderColor = 'var(--alpha-white-12)';
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: isFilterBarExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s var(--ease-natural)',
                lineHeight: 1,
              }}
            >
              ⌄
            </span>
          </button>
        </div>

        {/* 展开态:3 行 chip 网格(带进入动画) */}
        {isFilterBarExpanded && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 6,
              padding: '10px 14px 12px',
              background: 'var(--alpha-white-04)',
              backdropFilter: 'blur(10px) saturate(160%)',
              WebkitBackdropFilter: 'blur(10px) saturate(160%)',
              border: '1px solid var(--alpha-white-08)',
              borderRadius: 'var(--radius-xl)',
              animation: 'fadeSlideIn 0.25s var(--ease-natural)',
              maxWidth: 'min(720px, calc(100vw - 48px))',
            }}
          >
            <FilterGroup label="情绪">
              {EMO.map((label) => {
                const key = EMO_KEY[label];
                const active = (key === null && !filter) || key === filter;
                return (
                  <FilterChip
                    key={label}
                    label={label}
                    active={active}
                    onClick={() => { setFilter(key); toggleFilterBar(); }}
                    isMobile={isMobile}
                  />
                );
              })}
            </FilterGroup>

            <FilterGroup label="类型">
              <DreamTypeRow
                isMobile={isMobile}
                onPick={() => toggleFilterBar()}
              />
            </FilterGroup>

            <FilterGroup label="主题" subtle>
              <ThemeFreqRow
                isMobile={isMobile}
                onPick={() => toggleFilterBar()}
              />
            </FilterGroup>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   收缩栏专用:激活标签
   ============================================================ */

/** 激活态标签 — 形如 "情绪·悲伤 ×",点击 × 清除该组筛选 */
function ActiveTag({
  group,
  label,
  onClear,
}: {
  group: string;
  label: string;
  onClear: () => void;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 4px 2px 8px',
        background: 'var(--alpha-gold-16)',
        border: '1px solid var(--alpha-gold-40)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--gold-500)',
        fontSize: 'var(--text-caption)',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--muted-200)', fontSize: 'var(--text-overline)', letterSpacing: '0.15em' }}>
        {group}
      </span>
      <span>·</span>
      <span>{label}</span>
      <button
        onClick={onClear}
        aria-label={`清除 ${group} 筛选`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          marginLeft: 2,
          background: 'transparent',
          border: 'none',
          borderRadius: '50%',
          color: 'var(--gold-500)',
          fontSize: 12,
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--alpha-gold-40)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        ×
      </button>
    </span>
  );
}

/* ============================================================
   筛选区公用组件
   ============================================================ */

/** 玻璃底筛选组容器:左侧带分组小标签 */
function FilterGroup({
  label,
  subtle = false,
  children,
}: {
  label: string;
  subtle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 12,
        padding: '2px 4px',
        margin: 0,
        width: 'fit-content',
        maxWidth: 'calc(100vw - 48px)',
        pointerEvents: 'auto',
        opacity: subtle ? 0.78 : 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-dream)',
          fontSize: 'var(--text-overline)',
          color: 'var(--muted-200)',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** 统一筛选 chip — 全部使用同一形态,只通过 active 区分 */
function FilterChip({
  label,
  active,
  onClick,
  isMobile,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  isMobile: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-dream)',
        fontSize: isMobile ? 11 : 'var(--text-caption)',
        color: active ? 'var(--gold-500)' : 'var(--muted-100)',
        background: active ? 'var(--alpha-gold-16)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        padding: '3px 11px',
        cursor: 'pointer',
        transition: 'all 0.25s var(--ease-natural)',
        opacity: active ? 1 : 0.55,
        transform: active ? 'scale(1.04)' : 'scale(1)',
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.color = active ? 'var(--gold-500)' : 'var(--fg-100)';
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.opacity = '0.55';
          e.currentTarget.style.color = 'var(--muted-100)';
        }
      }}
    >
      {label}
    </button>
  );
}

/** 梦境类型筛选: 全部 / 碎片 / 叙事 / 长梦 / 短歌 — 返回 chip 节点列表 */
function DreamTypeRow({ isMobile, onPick }: { isMobile: boolean; onPick?: () => void }) {
  const types = ['全部', '碎片', '叙事', '长梦', '短歌'] as const;
  const filter = useUIStore((s) => s.dreamTypeFilter);
  const setFilter = useUIStore((s) => s.setDreamTypeFilter);
  return (
    <>
      {types.map((label) => {
        const active = (label === '全部' && !filter) || label === filter;
        return (
          <FilterChip
            key={label}
            label={label}
            active={active}
            onClick={() => { setFilter(label === '全部' ? null : label); onPick?.(); }}
            isMobile={isMobile}
          />
        );
      })}
    </>
  );
}

/** 主题词频 Top 8 — 返回 chip 节点列表(字号更小,弱化视觉权重) */
function ThemeFreqRow({ isMobile, onPick }: { isMobile: boolean; onPick?: () => void }) {
  const dreams = useDreamStore((s) => s.dreams);
  const themeFilter = useUIStore((s) => s.themeFilter);
  const setThemeFilter = useUIStore((s) => s.setThemeFilter);

  const top = useMemo(() => {
    const f: Record<string, number> = {};
    dreams.forEach(d => d.themes.forEach(t => f[t] = (f[t] || 0) + 1));
    return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [dreams]);

  if (top.length === 0) return null;

  return (
    <>
      {top.map(([t, count]) => {
        const active = themeFilter === t;
        return (
          <button
            key={t}
            onClick={() => { setThemeFilter(active ? null : t); onPick?.(); }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: isMobile ? 10 : 11,
              color: active ? 'var(--gold-500)' : 'var(--muted-200)',
              background: active ? 'var(--alpha-gold-16)' : 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '2px 8px',
              cursor: 'pointer',
              opacity: active ? 1 : 0.6,
              transition: 'all 0.25s var(--ease-natural)',
              whiteSpace: 'nowrap',
              lineHeight: 1.5,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--muted-100)'; }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = 'var(--muted-200)'; } }}
          >
            {t}·{count}
          </button>
        );
      })}
    </>
  );
}
