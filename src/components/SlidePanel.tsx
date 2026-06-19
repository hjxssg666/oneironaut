import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  side?: 'left' | 'right';
  width?: number;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

/** 可复用的玻璃滑动面板容器 — 移动端全屏 */
export default function SlidePanel({
  open,
  side = 'right',
  width = 400,
  onClose,
  children,
  title,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isRight = side === 'right';

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(2,3,8,0.4)',
          WebkitTapHighlightColor: 'transparent',
        }}
      />

      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [isRight ? 'right' : 'left']: 0,
          width: isMobile ? '100vw' : `min(${width}px, 90vw)`,
          zIndex: 45,
          background: 'rgba(8,10,18,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderLeft: isRight ? '1px solid var(--alpha-white-08)' : 'none',
          borderRight: !isRight ? '1px solid var(--alpha-white-08)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          animation: `${isRight ? 'slideInRight' : 'slideInLeft'} 0.3s var(--ease-spring)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? 'var(--space-5) var(--space-5)' : 'var(--space-6) var(--space-8)',
            paddingTop: isMobile ? 'env(safe-area-inset-top, var(--space-5))' : undefined,
            borderBottom: '1px solid var(--alpha-white-06)',
            flexShrink: 0,
          }}
        >
          {title && (
            <h3
              style={{
                fontFamily: 'var(--font-dream)',
                fontSize: isMobile ? 'var(--text-heading-3)' : 'var(--text-heading-3)',
                color: 'var(--gold-500)',
                margin: 0,
                fontWeight: 'var(--fw-light)',
              }}
            >
              {title}
            </h3>
          )}
          <button
            className="btn"
            onClick={onClose}
            style={{ marginLeft: 'auto', padding: isMobile ? '8px 14px' : undefined, fontSize: isMobile ? 20 : undefined }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? 'var(--space-5)' : 'var(--space-6) var(--space-8)',
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, var(--space-5))' : undefined,
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--alpha-white-10) transparent',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
