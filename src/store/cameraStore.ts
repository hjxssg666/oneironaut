import { create } from 'zustand';

interface CameraStore {
  /** 相机当前世界坐标 */
  position: [number, number, number];
  /** 相机朝向（归一化方向向量） */
  direction: [number, number, number];
  /** 飞行速度（单位/秒） */
  speed: number;
  setPosition: (pos: [number, number, number]) => void;
  setDirection: (dir: [number, number, number]) => void;
  setSpeed: (speed: number) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  position: [0, 0, 150],
  direction: [0, 0, -1],
  speed: 20,
  setPosition: (pos) => set({ position: pos }),
  setDirection: (dir) => set({ direction: dir }),
  setSpeed: (speed) => set({ speed }),
}));
