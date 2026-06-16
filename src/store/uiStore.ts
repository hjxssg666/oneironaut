import { create } from 'zustand';

export type Quality = 'high' | 'medium' | 'low';

interface UIStore {
  isHudVisible: boolean;
  isSearchOpen: boolean;
  isOnboarding: boolean;
  isInputOpen: boolean;
  selectedView: 'stars' | 'timeline' | 'collect' | 'ai';
  speed: number;
  quality: Quality;
  /** T-007: 落地页滚动进度 0→1 */
  landingProgress: number;
  /** T-007: 落地页是否已完成 */
  isLandingDone: boolean;
  /** T-019: AI 面板状态 */
  aiModelLoading: boolean;
  aiModelReady: boolean;
  toggleHud: () => void;
  toggleSearch: () => void;
  setOnboarding: (show: boolean) => void;
  setInputOpen: (open: boolean) => void;
  setView: (view: 'stars' | 'timeline' | 'collect' | 'ai') => void;
  setSpeed: (speed: number) => void;
  setQuality: (q: Quality) => void;
  setLandingProgress: (p: number) => void;
  finishLanding: () => void;
  setAiModelLoading: (loading: boolean) => void;
  setAiModelReady: (ready: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isHudVisible: true,
  isSearchOpen: false,
  isOnboarding: true,
  isInputOpen: false,
  selectedView: 'stars',
  speed: 20,
  quality: 'high',
  landingProgress: 0,
  isLandingDone: false,
  aiModelLoading: false,
  aiModelReady: false,

  toggleHud: () => set((s) => ({ isHudVisible: !s.isHudVisible })),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  setOnboarding: (show) => set({ isOnboarding: show }),
  setInputOpen: (open) => set({ isInputOpen: open }),
  setView: (view) => set({ selectedView: view }),
  setSpeed: (speed) => set({ speed }),
  setQuality: (q) => set({ quality: q }),
  setLandingProgress: (p) => set({ landingProgress: Math.max(0, Math.min(1, p)) }),
  finishLanding: () => set({ isLandingDone: true, isOnboarding: false, landingProgress: 1 }),
  setAiModelLoading: (loading) => set({ aiModelLoading: loading }),
  setAiModelReady: (ready) => set({ aiModelReady: ready }),
}));
