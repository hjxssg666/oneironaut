import { useState, useEffect } from 'react';

const SHORTCUTS = [
  ['W A S D', '御风飞行'],
  ['拖拽鼠标', '旋转视角'],
  ['滚轮', '缩放视野'],
  ['H', '隐藏界面'],
  ['Esc', '退出环绕'],
  ['Shift', '加速飞行'],
  ['? / F1', '显示此面板'],
  ['点击星空', '查看梦境'],
  ['点击虚空', '缀一颗星'],
  ['悬浮0.8秒', '预览内容'],
];

export default function ShortcutPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === 'F1' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape' && open) { setOpen(false); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={() => setOpen(false)} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(2,3,8,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(8,10,20,0.92)', border: '1px solid var(--alpha-white-12)',
        borderRadius: 16, padding: '24px 32px', minWidth: 300,
        backdropFilter: 'blur(12px)',
      }}>
        <h2 style={{ fontFamily: 'var(--font-dream)', color: 'var(--gold-500)', fontSize: 18, marginBottom: 16, fontWeight: 300 }}>
          星海指南
        </h2>
        {SHORTCUTS.map(([key, desc]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{key}</span>
            <span style={{ color: 'var(--muted-100)' }}>{desc}</span>
          </div>
        ))}
        <p style={{ color: 'var(--muted-200)', fontSize: 11, marginTop: 16, textAlign: 'center' }}>
          按 ? 或点击空白处关闭
        </p>
      </div>
    </div>
  );
}
