import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

// Liveblocks 客户端 — 替换为你的 public API key 即可激活
const PUBLIC_KEY = 'pk_dev_placeholder_replace_with_your_key';

const client = createClient({ publicApiKey: PUBLIC_KEY });

// 多人房间类型定义
export type Presence = {
  /** 用户的梦境 ID */
  dreamId: string | null;
  /** 相机位置 */
  cameraPos: { x: number; y: number; z: number };
  /** 用户颜色 */
  color: string;
};

export type Storage = {
  /** 共享梦境 ID 列表 */
  sharedDreamIds: string[];
};

export type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar?: string;
  };
};

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useStorage,
  useMutation,
} = createRoomContext<Presence, Storage, UserMeta>(client);
