import { useState } from 'react';
import { useDreamStore } from '../store/dreamStore';
import { useUIStore } from '../store/uiStore';

const moodLabels: Record<string, string> = {
  serene: '平静',
  joy: '喜悦',
  fear: '恐惧',
  anger: '愤怒',
  sorrow: '悲伤',
  mystic: '神秘',
  anxious: '焦虑',
  nostalgic: '怀旧',
};

const moodColors: Record<string, string> = {
  serene: 'var(--mood-serene)',
  joy: 'var(--mood-joy)',
  fear: 'var(--mood-fear)',
  anger: 'var(--mood-anger)',
  sorrow: 'var(--mood-sorrow)',
  mystic: 'var(--mood-mystic)',
  anxious: 'var(--mood-anxious)',
  nostalgic: 'var(--mood-nostalgic)',
};

const moodOptions = [
  { key: 'serene', label: '平静' },
  { key: 'joy', label: '喜悦' },
  { key: 'fear', label: '恐惧' },
  { key: 'anger', label: '愤怒' },
  { key: 'sorrow', label: '悲伤' },
  { key: 'mystic', label: '神秘' },
  { key: 'anxious', label: '焦虑' },
  { key: 'nostalgic', label: '怀旧' },
];

/** 梦境详情面板 - 点击星/虚空后弹出，支持编辑和 URL hash 分享 */
export default function DreamCard() {
  const selectedDream = useDreamStore((s) => s.selectedDream);
  const selectDream = useDreamStore((s) => s.selectDream);
  const togglePublic = useDreamStore((s) => s.togglePublic);
  const removeDream = useDreamStore((s) => s.removeDream);
  const updateDream = useDreamStore((s) => s.updateDream);
  const setInputOpen = useUIStore((s) => s.setInputOpen);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editEmotion, setEditEmotion] = useState('');
  const [editThemes, setEditThemes] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  if (!selectedDream) return null;

  const moodColor = moodColors[selectedDream.emotion] ?? 'var(--gold-500)';
  const moodLabel = moodLabels[selectedDream.emotion] ?? selectedDream.emotion;

  /** T-012: URL hash 分享 */
  const handleShare = () => {
    const url = `${location.origin}${location.pathname}#dream=${selectedDream.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setToastMsg('链接已复制');
    setTimeout(() => setToastMsg(''), 2000);
  };

  /** 进入编辑模式 */
  const startEdit = () => {
    setEditContent(selectedDream.content);
    setEditEmotion(selectedDream.emotion);
    setEditThemes([...selectedDream.themes]);
    setIsEditing(true);
  };

  /** 保存编辑 */
  const saveEdit = () => {
    updateDream(selectedDream.id, {
      content: editContent,
      emotion: editEmotion,
      themes: editThemes,
    });
    setIsEditing(false);
  };

  /** 取消编辑 */
  const cancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          width: '100%',
          maxWidth: 540,
          animation: 'slideUp 0.35s var(--ease-spring)',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: 'var(--space-8) var(--space-10)',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          {/* 关闭 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button className="btn" onClick={() => { setIsEditing(false); selectDream(null); }}>
              ×
            </button>
          </div>

          {isEditing ? (
            <>
              {/* 编辑模式 */}
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={500}
                style={{
                  width: '100%',
                  minHeight: 120,
                  background: 'var(--alpha-white-04)',
                  border: '1px solid var(--alpha-white-12)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--fg-100)',
                  fontFamily: 'var(--font-dream)',
                  fontSize: 'var(--text-heading-3)',
                  padding: 12,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* 情绪选择 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {moodOptions.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setEditEmotion(m.key)}
                    className="tag"
                    style={{
                      background: editEmotion === m.key
                        ? `${moodColors[m.key] ?? 'var(--gold-500)'}33`
                        : 'var(--alpha-white-06)',
                      border: editEmotion === m.key
                        ? `1px solid ${moodColors[m.key] ?? 'var(--gold-500)'}`
                        : '1px solid var(--alpha-white-08)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-caption)',
                    }}
                  >
                    <span className="mood-dot" style={{ background: moodColors[m.key] ?? 'var(--gold-500)' }} />
                    {' '}{m.label}
                  </button>
                ))}
              </div>

              {/* 主题标签 */}
              <input
                value={editThemes.join(', ')}
                onChange={(e) => setEditThemes(e.target.value.split(/[,，]\s*/).filter(Boolean))}
                placeholder="主题（逗号分隔）"
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '8px 12px',
                  background: 'var(--alpha-white-04)',
                  border: '1px solid var(--alpha-white-12)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--fg-100)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* 编辑操作 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={saveEdit}>💾 保存</button>
                <button className="btn" onClick={cancelEdit}>取消</button>
              </div>
            </>
          ) : (
            <>
              {/* 展示模式 */}
              <p
                className="dream-text"
                style={{
                  fontSize: 'var(--text-heading-3)',
                  marginBottom: 'var(--space-6)',
                }}
              >
                {selectedDream.content}
              </p>

              {/* 元信息 */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 'var(--space-6)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--muted-100)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span className="tag">
                  <span className="mood-dot" style={{ background: moodColor }} />{' '}
                  {moodLabel}
                </span>
                {selectedDream.themes.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
                <span className="tag">
                  {selectedDream.isPublic ? '公开' : '仅自己'}
                </span>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn" onClick={handleShare}>
                  📤 分享
                </button>
                <button className="btn" onClick={startEdit}>
                  ✏️ 编辑
                </button>
                <button className="btn" onClick={() => togglePublic(selectedDream.id)}>
                  {selectedDream.isPublic ? '🔒 设为私密' : '🌐 设为公开'}
                </button>
                <button className="btn" onClick={() => { removeDream(selectedDream.id); selectDream(null); }}>
                  🗑 删除
                </button>
                <button className="btn" onClick={() => { selectDream(null); setInputOpen(true); }}>
                  + 写梦
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'var(--gold-500)',
            color: 'var(--ink-900)',
            padding: '8px 20px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-body-sm)',
            animation: 'fadeSlideIn 0.3s var(--ease-spring)',
          }}
        >
          {toastMsg}
        </div>
      )}
    </>
  );
}

/* 注入 slideUp 动画 */
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(100%); }
      to { transform: translateX(-50%) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
