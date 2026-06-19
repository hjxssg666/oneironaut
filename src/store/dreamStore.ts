import { create } from 'zustand';
import { getMassDreams } from '../data/massGenerator';
import { saveDream, loadDreams, removeDream as removeDreamDB } from '../lib/storage';
import { useCameraStore } from './cameraStore';

export interface Dream {
  id: string;
  content: string;
  emotion: string;
  type?: string; // 碎片 | 叙事 | 长梦 | 短歌
  themes: string[];
  isPublic: boolean;
  position: [number, number, number];
  createdAt: number;
  subCount: number; // 子恒星数量（决定主星大小）
}

interface SubDreamRef {
  id: string;
  parentId: string;
  content: string;
  emotion: string;
  position: [number, number, number];
}

interface DreamStore {
  dreams: Dream[];
  subDreams: Map<string, SubDreamRef[]>;
  selectedDream: Dream | null;
  selectedSubDream: SubDreamRef | null;
  dbStatus: 'idle' | 'syncing' | 'synced' | 'error';
  isMassGenerating: boolean;
  setMassDreams: () => void;
  initFromDB: () => Promise<void>;
  addDream: (dream: Omit<Dream, 'id' | 'position' | 'createdAt' | 'subCount'>) => void;
  removeDream: (id: string) => void;
  togglePublic: (id: string) => void;
  selectDream: (dream: Dream | null) => void;
  selectSubDream: (sub: SubDreamRef | null) => void;
  updatePosition: (id: string, pos: [number, number, number]) => void;
  updateDream: (id: string, partial: Partial<Omit<Dream, 'id' | 'position' | 'createdAt'>>) => void;
}

function randomPos(): [number, number, number] {
  const phi = Math.acos(2 * Math.random() - 1);
  const theta = Math.random() * Math.PI * 2;
  const r = 50 + Math.random() * 200;
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)];
}

/** 相机前方位置:新星星出现在视野近处 */
function inViewPos(): [number, number, number] {
  const r = 15 + Math.random() * 20; // 15~35 单位
  const theta = Math.random() * Math.PI * 2;
  const phi = (Math.random() - 0.5) * 1.0;
  return [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), -r];
}

const seeds: Dream[] = [
  { id: 'seed-0', content: '一只白鹤飞过云层。在云层里，一面镜静静地不再说话。', emotion: 'serene', themes: ['飞翔','天空','宁静'], isPublic: true, position: randomPos(), createdAt: Date.now(), subCount: 8 },
  { id: 'seed-1', content: '我重新见到了已故的奶奶。她笑着为我织围巾，好像一切都已经发生过。', emotion: 'joy', themes: ['重逢','温暖','祖母'], isPublic: true, position: randomPos(), createdAt: Date.now(), subCount: 8 },
  { id: 'seed-2', content: '在无尽的走廊里奔跑。身后有什么越来越近，那种熟悉感让我想哭。', emotion: 'fear', themes: ['追逐','恐惧','黑暗'], isPublic: true, position: randomPos(), createdAt: Date.now(), subCount: 8 },
];

/** 模块加载时同步预生成 35K 梦境（让落地页就有星辰） */
const _mass = getMassDreams();
const _subRefs = new Map<string, SubDreamRef[]>();
_mass.subDreams.forEach((subs, parentId) => {
  _subRefs.set(parentId, subs.map((s, si) => ({
    id: `${parentId}-sub-${si}`,
    parentId,
    content: s.content,
    emotion: s.emotion,
    position: s.position,
  })));
});
const _initialDreams = [...seeds, ..._mass.dreams];

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: _initialDreams,  // 初始化时就有 35K+3 颗
  subDreams: _subRefs,
  selectedDream: null,
  selectedSubDream: null,
  dbStatus: 'idle',
  isMassGenerating: false,

  setMassDreams: () => {
    // 已同步预生成，无需再设
    if (get().isMassGenerating) return;
    set({ isMassGenerating: true });
    set({ isMassGenerating: false });
  },

  initFromDB: async () => {
    set({ dbStatus: 'syncing' });
    try {
      const stored = await loadDreams();
      if (stored && stored.length > 0) {
        const current = get().dreams;
        const existingIds = new Set(current.map((d) => d.id));
        const newDreams = stored.filter((d: Dream) => !existingIds.has(d.id));
        if (newDreams.length > 0) set((s) => ({ dreams: [...s.dreams, ...newDreams] }));
      }
      set({ dbStatus: 'synced' });
    } catch {
      set({ dbStatus: 'error' });
    }
  },

  addDream: (dream) => {
    const id = `d-${Date.now()}`;
    const nd: Dream = { ...dream, id, position: inViewPos(), createdAt: Date.now(), subCount: 8 };
    saveDream(nd).catch(() => set({ dbStatus: 'error' }));
    set((s) => ({
      dreams: [...s.dreams, nd],
      selectedDream: nd,
    }));
    useCameraStore.getState().setFlyToTarget(nd.position);
  },

  removeDream: (id) => {
    removeDreamDB(id).catch(() => set({ dbStatus: 'error' }));
    set((s) => ({
      dreams: s.dreams.filter(d => d.id !== id),
      selectedDream: s.selectedDream?.id === id ? null : s.selectedDream,
      selectedSubDream: null,
    }));
  },

  togglePublic: (id) => set((s) => ({ dreams: s.dreams.map(d => d.id === id ? { ...d, isPublic: !d.isPublic } : d) })),
  selectDream: (dream) => set({ selectedDream: dream, selectedSubDream: null }),
  selectSubDream: (sub) => set({ selectedSubDream: sub }),
  updatePosition: (id, pos) => set((s) => ({ dreams: s.dreams.map(d => d.id === id ? { ...d, position: pos } : d) })),

  updateDream: (id, partial) => {
    set((s) => {
      const updated = s.dreams.map(d => d.id === id ? { ...d, ...partial } : d);
      const dream = updated.find(d => d.id === id);
      if (dream) saveDream(dream).catch(() => {});
      return { dreams: updated, selectedDream: s.selectedDream?.id === id ? { ...s.selectedDream, ...partial } : s.selectedDream };
    });
  },
}));
