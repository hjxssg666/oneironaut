import ScenePage from './pages/Scene';
import ErrorBoundary from './components/ErrorBoundary';
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
      let retries = 0;
      const MAX_RETRIES = 20;
      // 等待 store 初始化完成后查找梦境
      const trySelect = () => {
        const dreams = useDreamStore.getState().dreams;
        const dream = dreams.find((d) => d.id === dreamId);
        if (dream) {
          useDreamStore.getState().selectDream(dream);
        } else if (++retries < MAX_RETRIES) {
          setTimeout(trySelect, 500);
        }
      };
      setTimeout(trySelect, 1000);
    }
  }, []);

  return <ErrorBoundary><ScenePage /></ErrorBoundary>;
}
