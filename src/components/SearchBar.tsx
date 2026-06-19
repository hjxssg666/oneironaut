import { useState, useRef, useEffect } from 'react';
import { useDreamStore } from '../store/dreamStore';
import { useUIStore } from '../store/uiStore';

/** 搜索栏 - 玻璃拟态浮层 */
export default function SearchBar() {
  const dreams = useDreamStore((s) => s.dreams);
  const selectDream = useDreamStore((s) => s.selectDream);
  const isSearchOpen = useUIStore((s) => s.isSearchOpen);
  const toggleSearch = useUIStore((s) => s.toggleSearch);

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = query.trim()
    ? dreams.filter(
        (d) =>
          d.content.includes(query) ||
          d.themes.some((t) => t.includes(query)),
      )
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(80px + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: '100%',
        maxWidth: 480,
      }}
    >
      <div className="glass-panel" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索梦境内容或主题..."
            onKeyDown={(e) => e.key === 'Escape' && toggleSearch()}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'var(--alpha-white-04)',
              border: '1px solid var(--alpha-white-12)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--fg-100)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-body-md)',
              outline: 'none',
            }}
          />
          <button className="btn" onClick={toggleSearch}>
            ×
          </button>
        </div>

        {query.trim() && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.slice(0, 8).map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  selectDream(d);
                  useUIStore.getState().setDreamCardOpen(true);
                  toggleSearch();
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'var(--alpha-white-04)',
                  border: '1px solid var(--alpha-white-12)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--fg-200)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-dream)',
                  fontSize: 'var(--text-body-sm)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {d.content.slice(0, 40)}...
              </button>
            ))}
          </div>
        )}

        {query.trim() && filtered.length === 0 && (
          <p style={{ color: 'var(--muted-100)', fontSize: 'var(--text-body-sm)', padding: 8 }}>
            未找到匹配的梦境
          </p>
        )}
      </div>
    </div>
  );
}
