import { useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { useDreamStore } from '../store/dreamStore';
import { generateVoidDream } from '../lib/generator';
import SlidePanel from './SlidePanel';

/** T-019: AI 梦境生成面板 — 默认秒出 + AI 模型按需加载 */
export default function AIPanel() {
  const selectedView = useUIStore((s) => s.selectedView);
  const setView = useUIStore((s) => s.setView);
  const addDream = useDreamStore((s) => s.addDream);
  const aiModelLoading = useUIStore((s) => s.aiModelLoading);
  const aiModelReady = useUIStore((s) => s.aiModelReady);
  const setAiModelLoading = useUIStore((s) => s.setAiModelLoading);
  const setAiModelReady = useUIStore((s) => s.setAiModelReady);

  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  /** 秒出模式：generator.ts */
  const handleQuickGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const dream = generateVoidDream();
      setResult(dream.content);
      setGenerating(false);
    }, 400 + Math.random() * 300);
  };

  /** 加载 AI 模型（模拟进度） */
  const handleLoadModel = async () => {
    setAiModelLoading(true);
    // 模拟下载进度
    for (let i = 0; i <= 100; i += Math.random() * 15 + 5) {
      setLoadProgress(Math.min(i, 100));
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));
    }
    setLoadProgress(100);
    setAiModelLoading(false);
    setAiModelReady(true);
  };

  /** AI 模式生成 */
  const handleAIGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // 基于提示词生成（当前用增强的 generator 模拟）
    setTimeout(() => {
      const base = generateVoidDream();
      const enhanced = prompt
        ? `「${prompt}」的印记：${base.content}`
        : base.content;
      setResult(enhanced);
      setGenerating(false);
    }, 800);
  };

  /** 采纳梦境 */
  const handleAdopt = () => {
    if (!result) return;
    const dream = generateVoidDream();
    addDream({
      content: result,
      emotion: prompt ? 'mystic' : dream.emotion,
      themes: prompt ? [prompt.slice(0, 8), ...dream.themes.slice(0, 2)] : dream.themes,
      isPublic: false,
    });
    setResult('');
    setPrompt('');
  };

  return (
    <SlidePanel
      open={selectedView === 'ai'}
      onClose={() => setView('stars')}
      title="AI 梦境生成"
    >
      {/* 默认模式：秒出生成 */}
      <div style={{ marginBottom: 20 }}>
        <p style={{
          color: 'var(--muted-100)',
          fontSize: 'var(--text-body-sm)',
          marginBottom: 12,
          lineHeight: 1.6,
        }}>
          点击下方按钮，虚空生成器将随机编织一个梦境。
          <br />
          或加载 AI 模型，根据你的提示词创作独一无二的梦。
        </p>

        <button
          className="btn btn-primary"
          onClick={handleQuickGenerate}
          disabled={generating}
          style={{ width: '100%' }}
        >
          {generating ? '✨ 梦境编织中...' : '✨ 虚空生成'}
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--alpha-white-06)', margin: '16px 0' }} />

      {/* AI 模式区域 */}
      <div>
        <h4 style={{
          color: 'var(--fg-200)',
          fontSize: 'var(--text-body-md)',
          marginBottom: 8,
          fontFamily: 'var(--font-dream)',
          fontWeight: 'var(--fw-light)',
        }}>
          🤖 AI 增强模式
        </h4>

        {!aiModelReady ? (
          <div>
            <p style={{ color: 'var(--muted-100)', fontSize: 'var(--text-body-sm)', marginBottom: 12 }}>
              AI 模型在浏览器端运行，首次需下载约 500MB。
              下载后缓存在本地，离线可用。
            </p>
            {aiModelLoading ? (
              <div>
                <div style={{
                  height: 6,
                  background: 'var(--alpha-white-08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${loadProgress}%`,
                    background: 'var(--gold-500)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-100)' }}>
                  下载中 {Math.round(loadProgress)}%
                </span>
              </div>
            ) : (
              <button className="btn" onClick={handleLoadModel} style={{ width: '100%' }}>
                📥 加载 AI 模型
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ac8a8' }} />
              <span style={{ fontSize: 'var(--text-caption)', color: '#5ac8a8', fontWeight: 500 }}>模型已就绪</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的梦境... 例如：在一片发光的紫色海洋上飞行"
              maxLength={200}
              style={{
                width: '100%',
                minHeight: 80,
                background: 'var(--alpha-white-04)',
                border: '1px solid var(--alpha-white-12)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--fg-100)',
                fontFamily: 'var(--font-dream)',
                fontSize: 'var(--text-body-sm)',
                padding: 12,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 8,
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAIGenerate}
              disabled={generating || !prompt.trim()}
              style={{ width: '100%' }}
            >
              {generating ? '🤖 生成中...' : '🤖 AI 生成梦境'}
            </button>
          </div>
        )}
      </div>

      {/* 生成结果 */}
      {result && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: 'var(--alpha-white-04)',
            border: '1px solid var(--alpha-white-08)',
            borderRadius: 'var(--radius-md)',
            animation: 'fadeSlideIn 0.4s var(--ease-spring)',
          }}
        >
          <p style={{
            color: 'var(--fg-100)',
            fontSize: 'var(--text-heading-3)',
            fontFamily: 'var(--font-dream)',
            whiteSpace: 'pre-line',
            lineHeight: 1.8,
            marginBottom: 12,
          }}>
            {result}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleAdopt}>
              ✨ 采纳此梦
            </button>
            <button className="btn" onClick={handleQuickGenerate}>
              🔄 换一个
            </button>
          </div>
        </div>
      )}
    </SlidePanel>
  );
}
