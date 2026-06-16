import { useEffect } from 'react';
import Scene3D from '../three/Scene';
import HudTop from '../components/HudTop';
import HudBottom from '../components/HudBottom';
import SearchBar from '../components/SearchBar';
import DreamCard from '../components/DreamCard';
import Onboarding from '../components/Onboarding';
import Landing from '../components/Landing';
import TimelinePanel from '../components/TimelinePanel';
import CollectionPanel from '../components/CollectionPanel';
import FPSMonitor from '../components/FPSMonitor';
import DreamInput from './Input';
import { useUIStore } from '../store/uiStore';
import { useDreamStore } from '../store/dreamStore';
import { generateVoidDream } from '../lib/generator';

/** 3D 主场景页（核心页面） */
export default function ScenePage() {
  const addDream = useDreamStore((s) => s.addDream);
  const initFromDB = useDreamStore((s) => s.initFromDB);
  const dbStatus = useDreamStore((s) => s.dbStatus);
  const isInputOpen = useUIStore((s) => s.isInputOpen);
  const setInputOpen = useUIStore((s) => s.setInputOpen);
  const isLandingDone = useUIStore((s) => s.isLandingDone);

  /** 启动时从 IndexedDB 加载持久化梦境 */
  useEffect(() => {
    initFromDB();
  }, [initFromDB]);

  /** 点击虚空区域 → 生成随机梦境 */
  const handleVoidClick = () => {
    const generated = generateVoidDream();
    addDream({
      content: generated.content,
      emotion: generated.emotion,
      themes: generated.themes,
      isPublic: false,
    });
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* 3D Canvas */}
      <Scene3D />

      {/* T-007: Landing 落地页（覆盖在 3D 场景之上） */}
      <Landing />

      {/* HUD 层 — 落地完成后才显示 */}
      {isLandingDone && (
        <>
          <HudTop />
          <HudBottom />
          <Onboarding />
        </>
      )}

      <SearchBar />
      <DreamCard />

      {/* T-008/T-009: 时间线 + 收藏面板 */}
      <TimelinePanel />
      <CollectionPanel />

      {/* FPS 性能监控 */}
      <FPSMonitor />

      {/* IndexedDB 同步状态指示 */}
      {dbStatus === 'error' && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            left: 16,
            zIndex: 20,
            fontSize: 10,
            color: '#ff5a5a',
            background: 'rgba(2,3,8,0.7)',
            padding: '2px 8px',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        >
          离线模式（数据不持久化）
        </div>
      )}

      {/* 虚空生成按钮 — 落地完成后才显示 */}
      {isLandingDone && (
        <button
          onClick={handleVoidClick}
          className="btn"
          style={{
            position: 'fixed',
            bottom: 60,
            right: 24,
            zIndex: 10,
          }}
        >
          ✨ 虚空生成
        </button>
      )}

      {/* 梦境输入面板 */}
      {isInputOpen && (
        <DreamInput
          onClose={() => setInputOpen(false)}
          onSave={(dream) => {
            addDream(dream);
            setInputOpen(false);
          }}
        />
      )}
    </div>
  );
}
