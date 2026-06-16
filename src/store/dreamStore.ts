import { create } from 'zustand';
import dreamsData from '../data/dreams.json';
import { saveDream, loadDreams, removeDream as removeDreamDB } from '../lib/storage';

export interface Dream {
  id: string;
  content: string;
  emotion: string;
  themes: string[];
  isPublic: boolean;
  position: [number, number, number];
  createdAt: number;
}

interface DreamStore {
  dreams: Dream[];
  selectedDream: Dream | null;
  /** IndexedDB 同步状态 */
  dbStatus: 'idle' | 'syncing' | 'synced' | 'error';
  /** 从 IndexedDB 初始化加载 */
  initFromDB: () => Promise<void>;
  addDream: (dream: Omit<Dream, 'id' | 'position' | 'createdAt'>) => void;
  removeDream: (id: string) => void;
  togglePublic: (id: string) => void;
  selectDream: (dream: Dream | null) => void;
  updatePosition: (id: string, pos: [number, number, number]) => void;
  /** T-011: 编辑梦境 */
  updateDream: (id: string, partial: Partial<Omit<Dream, 'id' | 'position' | 'createdAt'>>) => void;
}

/** 球面随机分布 */
function randomSpherePosition(radius = 120): [number, number, number] {
  const phi = Math.acos(2 * Math.random() - 1);
  const theta = Math.random() * Math.PI * 2;
  const r = 50 + Math.random() * radius;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

/** 为初始数据生成 3D 坐标 */
function withPositions(dreams: Omit<Dream, 'position' | 'createdAt'>[]): Dream[] {
  return dreams.map((d) => ({
    ...d,
    position: randomSpherePosition(),
    createdAt: Date.now(),
  }));
}

const initialDreams: Dream[] = withPositions(dreamsData as any[]);

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: initialDreams,
  selectedDream: null,
  dbStatus: 'idle',

  /** 启动时从 IndexedDB 加载已有梦境，与内置数据合并去重 */
  initFromDB: async () => {
    set({ dbStatus: 'syncing' });
    try {
      const stored = await loadDreams();
      if (stored && stored.length > 0) {
        const current = get().dreams;
        const existingIds = new Set(current.map((d) => d.id));
        const newDreams = stored.filter((d: Dream) => !existingIds.has(d.id));

        if (newDreams.length > 0) {
          set((state) => ({
            dreams: [...state.dreams, ...newDreams],
          }));
        }
      }
      set({ dbStatus: 'synced' });
    } catch (err) {
      console.warn('IndexedDB 加载失败，使用内置数据:', err);
      set({ dbStatus: 'error' });
    }
  },

  addDream: (dream) => {
    const id = `d-${Date.now()}`;
    const newDream: Dream = {
      ...dream,
      id,
      position: randomSpherePosition(),
      createdAt: Date.now(),
    };

    // 持久化到 IndexedDB（异步，不阻塞 UI）
    saveDream(newDream).catch((err) =>
      console.warn('IndexedDB 保存失败:', err),
    );

    set((state) => ({
      dreams: [...state.dreams, newDream],
    }));
  },

  removeDream: (id) => {
    // 从 IndexedDB 删除（异步）
    removeDreamDB(id).catch((err) =>
      console.warn('IndexedDB 删除失败:', err),
    );

    set((state) => ({
      dreams: state.dreams.filter((d) => d.id !== id),
      selectedDream: state.selectedDream?.id === id ? null : state.selectedDream,
    }));
  },

  togglePublic: (id) =>
    set((state) => ({
      dreams: state.dreams.map((d) =>
        d.id === id ? { ...d, isPublic: !d.isPublic } : d,
      ),
    })),

  selectDream: (dream) => set({ selectedDream: dream }),

  updatePosition: (id, pos) =>
    set((state) => ({
      dreams: state.dreams.map((d) =>
        d.id === id ? { ...d, position: pos } : d,
      ),
    })),

  updateDream: (id, partial) => {
    set((state) => {
      const updated = state.dreams.map((d) =>
        d.id === id ? { ...d, ...partial } : d,
      );
      const dream = updated.find((d) => d.id === id);
      // 同步到 IndexedDB
      if (dream) {
        saveDream(dream).catch((err) =>
          console.warn('IndexedDB 更新失败:', err),
        );
      }
      return {
        dreams: updated,
        selectedDream:
          state.selectedDream?.id === id
            ? { ...state.selectedDream, ...partial }
            : state.selectedDream,
      };
    });
  },
}));
