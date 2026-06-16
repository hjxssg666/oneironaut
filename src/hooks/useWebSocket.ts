import { useEffect, useRef, useState, useCallback } from 'react';

/** T-021: WebSocket 客户端 Hook */

export interface GhostUser {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  dreamId: string | null;
}

export function useWebSocket(serverUrl?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [users, setUsers] = useState<GhostUser[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor] = useState('#a78bfa');
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();

  const url = serverUrl || `ws://${window.location.hostname}:3001`;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'welcome':
              setMyId(msg.id);
              setMyColor(msg.color);
              setUsers(msg.users || []);
              break;
            case 'user_joined':
              setUsers((prev) => {
                if (prev.find((u) => u.id === msg.user.id)) return prev;
                return [...prev, { ...msg.user, dreamId: null }];
              });
              break;
            case 'user_left':
              setUsers((prev) => prev.filter((u) => u.id !== msg.id));
              break;
            case 'user_moved':
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === msg.id ? { ...u, position: msg.position } : u,
                ),
              );
              break;
            case 'dream_shared':
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === msg.id
                    ? { ...u, dreamId: msg.dreamId, position: msg.position }
                    : u,
                ),
              );
              break;
          }
        } catch { /* 忽略 */ }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    } catch {
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const updatePosition = useCallback(
    (pos: { x: number; y: number; z: number }) => {
      send({ type: 'update_position', position: pos });
    },
    [send],
  );

  const shareDream = useCallback(
    (dreamId: string, position: { x: number; y: number; z: number }) => {
      send({ type: 'share_dream', dreamId, position });
    },
    [send],
  );

  return {
    connected,
    myId,
    myColor,
    users,
    updatePosition,
    shareDream,
  };
}
