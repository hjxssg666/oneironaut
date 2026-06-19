import { useEffect, useState } from 'react';
import Scene3D from '../three/Scene';
import HudTop from '../components/HudTop';
import HudBottom from '../components/HudBottom';
import SearchBar from '../components/SearchBar';
import DreamCard from '../components/DreamCard';
import Onboarding from '../components/Onboarding';
import Landing from '../components/Landing';
import TimelinePanel from '../components/TimelinePanel';
import CollectionPanel from '../components/CollectionPanel';
import AIPanel from '../components/AIPanel';
import Settings from './Settings';
import FPSMonitor from '../components/FPSMonitor';
import ShortcutPanel from '../components/ShortcutPanel';
import OnlineIndicator from '../components/OnlineIndicator';
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
  const isOnboarding = useUIStore((s) => s.isOnboarding);
  const [showTip, setShowTip] = useState(false);

  // Onboarding完成后3秒引导提示
  useEffect(() => {
    if (isLandingDone && !isOnboarding) {
      const t = setTimeout(() => setShowTip(true), 500);
      const t2 = setTimeout(() => setShowTip(false), 5000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [isLandingDone, isOnboarding]);

  useEffect(() => { initFromDB(); }, [initFromDB]);

  // 移动端自动低画质
  useEffect(() => {
    const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
    if (!isMobile) return;
    const { cycleQuality } = useUIStore.getState();
    cycleQuality(); // high→medium (or medium→low on tablets)
    if (window.innerWidth <= 480) cycleQuality(); // medium→low
  }, []);

  // 35K 梦境已在 dreamStore 初始化时同步生成，落地页就有星辰
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

      {/* 引导提示：Onboarding结束后短暂出现 */}
      {showTip && (
        <div style={{
          position: 'fixed', bottom: '30%', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, pointerEvents: 'none',
          fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-lg)',
          color: 'var(--gold-500)', textShadow: '0 0 20px var(--gold-500)66',
          animation: 'fadeSlideIn 0.6s ease-out, breathe-glow 3s ease-in-out infinite',
        }}>
          点击星辉 · 查看梦境
        </div>
      )}

      {/* T-008/T-009: 时间线 + 收藏面板 */}
      <TimelinePanel />
      <CollectionPanel />

      {/* T-019: AI 梦境生成面板 */}
      <AIPanel />

      {/* 设置页 */}
      <Settings />

      {/* FPS 性能监控 */}
      <FPSMonitor />
      <ShortcutPanel />

      {/* T-020: 在线状态 */}
      <OnlineIndicator />

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
            useUIStore.getState().setDreamCardOpen(true);
          }}
        />
      )}
    </div>
  );
}
