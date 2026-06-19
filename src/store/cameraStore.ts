import { create } from 'zustand';

interface CameraStore {
  position: [number, number, number];
  direction: [number, number, number];
  speed: number;
  orbitTarget: [number, number, number] | null;
  onClickHandler: ((e: MouseEvent) => void) | null;
  onEmptyClick: (() => void) | null;
  flyToTarget: [number, number, number] | null;
  setPosition: (pos: [number, number, number]) => void;
  setDirection: (dir: [number, number, number]) => void;
  setSpeed: (speed: number) => void;
  setOrbitTarget: (t: [number, number, number] | null) => void;
  setOnClickHandler: (h: ((e: MouseEvent) => void) | null) => void;
  setOnEmptyClick: (h: (() => void) | null) => void;
  setFlyToTarget: (t: [number, number, number] | null) => void;
}

export const useCameraStore = create<CameraStore>((set) => ({
  position: [0, 0, 150],
  direction: [0, 0, -1],
  speed: 20,
  orbitTarget: null,
  onClickHandler: null,
  onEmptyClick: null,
  flyToTarget: null,
  setPosition: (pos) => set({ position: pos }),
  setDirection: (dir) => set({ direction: dir }),
  setSpeed: (speed) => set({ speed }),
  setOrbitTarget: (t) => set({ orbitTarget: t }),
  setOnClickHandler: (h) => set({ onClickHandler: h }),
  setOnEmptyClick: (h) => set({ onEmptyClick: h }),
  setFlyToTarget: (t) => set({ flyToTarget: t }),
}));
