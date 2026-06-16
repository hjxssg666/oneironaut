import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

/** T-021: 自建 WebSocket 信令服务器 — 多人幽灵粒子 */

interface UserPresence {
  id: string;
  dreamId: string | null;
  position: { x: number; y: number; z: number };
  color: string;
}

const clients = new Map<WebSocket, UserPresence>();

const app = express();
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// 状态 API
app.get('/status', (_req, res) => {
  res.json({
    online: clients.size,
    users: Array.from(clients.values()).map((u) => ({
      id: u.id,
      color: u.color,
    })),
  });
});

wss.on('connection', (ws) => {
  const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const colors = ['#a78bfa', '#67e8f9', '#34d399', '#fbbf24', '#f472b6', '#818cf8'];
  const presence: UserPresence = {
    id,
    dreamId: null,
    position: { x: 0, y: 0, z: 0 },
    color: colors[Math.floor(Math.random() * colors.length)],
  };
  clients.set(ws, presence);

  // 广播给所有人
  const broadcast = (type: string, data: any, exclude?: WebSocket) => {
    const msg = JSON.stringify({ type, ...data });
    clients.forEach((_, client) => {
      if (client !== exclude && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  };

  // 通知新用户上线
  broadcast('user_joined', { user: presence });
  ws.send(JSON.stringify({
    type: 'welcome',
    id,
    color: presence.color,
    users: Array.from(clients.values()).filter((u) => u.id !== id),
  }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {
        case 'update_position':
          presence.position = msg.position;
          broadcast('user_moved', { id, position: msg.position }, ws);
          break;
        case 'share_dream':
          presence.dreamId = msg.dreamId;
          broadcast('dream_shared', { id, dreamId: msg.dreamId, position: presence.position, color: presence.color }, ws);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch { /* 忽略无效消息 */ }
  });

  ws.on('close', () => {
    clients.delete(ws);
    broadcast('user_left', { id });
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🔮 梦海 WebSocket 服务器启动: ws://localhost:${PORT}`);
  console.log(`   在线状态: http://localhost:${PORT}/status`);
});
