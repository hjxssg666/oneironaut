import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

/** T-021: 在线状态指示器 — WebSocket 连接状态 */
export default function OnlineIndicator() {
  const { connected, users } = useWebSocket();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const totalUsers = users.length + 1;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 20,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--muted-200)',
        background: 'rgba(2,3,8,0.6)',
        padding: '2px 10px',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: connected ? '#5ac8a8' : 'var(--muted-200)',
        }}
      />
      {connected ? `${totalUsers} 人在线` : '单人模式'}
    </div>
  );
}
