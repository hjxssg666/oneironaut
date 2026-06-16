import ScenePage from './pages/Scene';
import { useUIStore } from './store/uiStore';
import { useDreamStore } from './store/dreamStore';
import { useEffect } from 'react';

/** 根组件 */
export default function App() {
  const toggleHud = useUIStore((s) => s.toggleHud);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        toggleHud();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleHud]);

  /** T-012: 检测 URL hash，自动选中分享的梦境 */
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/#dream=(d-[^\s&]+)/);
    if (match) {
      const dreamId = match[1];
      // 等待 store 初始化完成后查找梦境
      const trySelect = () => {
        const dreams = useDreamStore.getState().dreams;
        const dream = dreams.find((d) => d.id === dreamId);
        if (dream) {
          useDreamStore.getState().selectDream(dream);
        } else {
          // 如果梦境不在列表中（可能从 URL 直接访问），稍后重试
          setTimeout(trySelect, 500);
        }
      };
      // 延迟执行，确保 initFromDB 已完成
      setTimeout(trySelect, 1000);
    }
  }, []);

  return <ScenePage />;
}
