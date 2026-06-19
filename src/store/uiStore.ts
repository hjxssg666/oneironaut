import { create } from 'zustand';
import { useDreamStore } from './dreamStore';

export type Quality = 'high' | 'medium' | 'low';

interface UIStore {
  isHudVisible: boolean;
  isSearchOpen: boolean;
  isOnboarding: boolean;
  isInputOpen: boolean;
  selectedView: 'stars' | 'timeline' | 'collect' | 'ai' | 'settings';
  quality: Quality;
  /** 情绪筛选: null=全部, string=情绪key */
  emotionFilter: string | null;
  showConnections: boolean;
  /** 光纤网模式: 'off'=全关 | 'selected'=仅选中梦 | 'all'=全量 */
  fiberNetMode: 'off' | 'selected' | 'all';
  /** 梦境详情面板是否打开(关闭后光纤保持活跃) */
  isDreamCardOpen: boolean;
  themeFilter: string | null;
  dreamTypeFilter: string | null;
  /** 顶部筛选栏是否展开(收起态只显示激活的标签) */
  isFilterBarExpanded: boolean;
  /** 浏览足迹：id + 创建时间戳(ms) */
  giftTrail: { id: string; ts: number }[];
  landingProgress: number;
  isLandingDone: boolean;
  aiModelLoading: boolean;
  aiModelReady: boolean;
  toggleHud: () => void;
  toggleSearch: () => void;
  setOnboarding: (show: boolean) => void;
  setInputOpen: (open: boolean) => void;
  setView: (view: 'stars' | 'timeline' | 'collect' | 'ai' | 'settings') => void;
  setQuality: (q: Quality) => void;
  setEmotionFilter: (f: string | null) => void;
  toggleConnections: () => void;
  cycleFiberNetMode: () => void;
  cycleQuality: () => void;
  setDreamCardOpen: (open: boolean) => void;
  setThemeFilter: (t: string | null) => void;
  setDreamTypeFilter: (t: string | null) => void;
  setFilterBarExpanded: (v: boolean) => void;
  toggleFilterBar: () => void;
  pushToTrail: (id: string) => void;
  expireTrail: () => void;
  clearTrail: () => void;
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
  quality: 'high',
  emotionFilter: null,
  showConnections: true,
  fiberNetMode: 'selected',
  isDreamCardOpen: false,
  themeFilter: null,
  dreamTypeFilter: null,
  isFilterBarExpanded: false,
  giftTrail: [],
  landingProgress: 0,
  isLandingDone: false,
  aiModelLoading: false,
  aiModelReady: false,

  toggleHud: () => set((s) => ({ isHudVisible: !s.isHudVisible })),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  setOnboarding: (show) => set({ isOnboarding: show }),
  setInputOpen: (open) => set({ isInputOpen: open }),
  setView: (view) => set({ selectedView: view }),
  setQuality: (q) => set({ quality: q }),
  setEmotionFilter: (f) => set({ emotionFilter: f }),
  toggleConnections: () => set((s) => ({ showConnections: !s.showConnections })),
  cycleFiberNetMode: () => set((s) => {
    const next: Record<string, 'off' | 'selected' | 'all'> = {
      off: 'selected', selected: 'all', all: 'off',
    };
    const mode = next[s.fiberNetMode];
    if (mode === 'off') {
      useDreamStore.getState().selectDream(null);
    }
    return { fiberNetMode: mode, isDreamCardOpen: mode !== 'off' ? s.isDreamCardOpen : false };
  }),
  cycleQuality: () => set((s) => {
    const next: Record<string, Quality> = {
      high: 'medium', medium: 'low', low: 'high',
    };
    return { quality: next[s.quality] };
  }),
  setDreamCardOpen: (open) => set({ isDreamCardOpen: open }),
  setThemeFilter: (t) => set({ themeFilter: t }),
  setDreamTypeFilter: (t) => set({ dreamTypeFilter: t }),
  setFilterBarExpanded: (v) => set({ isFilterBarExpanded: v }),
  toggleFilterBar: () => set((s) => ({ isFilterBarExpanded: !s.isFilterBarExpanded })),
  pushToTrail: (id) => set((s) => {
    const now = performance.now();
    const trail = [...s.giftTrail, { id, ts: now }];
    if (trail.length > 11) trail.shift();
    return { giftTrail: trail };
  }),
  expireTrail: () => set((s) => {
    const cutoff = performance.now() - 30000;
    return { giftTrail: s.giftTrail.filter(t => t.ts > cutoff) };
  }),
  clearTrail: () => set({ giftTrail: [] }),
  setLandingProgress: (p) => set({ landingProgress: Math.max(0, Math.min(1, p)) }),
  finishLanding: () => set({ isLandingDone: true, landingProgress: 1 }),
  setAiModelLoading: (loading) => set({ aiModelLoading: loading }),
  setAiModelReady: (ready) => set({ aiModelReady: ready }),
}));
