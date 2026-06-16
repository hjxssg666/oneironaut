import { useState } from 'react';
import { useDreamStore } from '../store/dreamStore';

interface Props {
  onClose: () => void;
  onSave: (dream: { content: string; emotion: string; themes: string[]; isPublic: boolean }) => void;
}

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

const quickThemes = ['飞行', '水', '追逐', '坠落', '时间', '记忆', '城市', '自然'];

/** 梦境输入面板 */
export default function DreamInput({ onClose, onSave }: Props) {
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState('serene');
  const [themes, setThemes] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const dreams = useDreamStore((s) => s.dreams);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSave({
      content: content.trim(),
      emotion,
      themes,
      isPublic,
    });
  };

  const toggleTheme = (t: string) => {
    setThemes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(2,3,8,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 'var(--space-10)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-dream)',
              fontSize: 'var(--text-heading-1)',
              color: 'var(--gold-500)',
              fontWeight: 'var(--fw-light)',
            }}
          >
            记下你的梦
          </h2>
          <button className="btn" onClick={onClose}>×</button>
        </div>

        {/* 输入区 */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 500))}
          placeholder="描述你昨晚的梦境..."
          rows={6}
          style={{
            width: '100%',
            padding: 'var(--space-6)',
            background: 'var(--alpha-white-04)',
            border: '1px solid var(--alpha-white-12)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--fg-100)',
            fontFamily: 'var(--font-dream)',
            fontSize: 'var(--text-body-lg)',
            lineHeight: 1.8,
            resize: 'vertical',
            outline: 'none',
          }}
        />

        <div style={{ textAlign: 'right', fontSize: 'var(--text-caption)', color: 'var(--muted-100)', marginTop: 4 }}>
          {content.length} / 500
        </div>

        {/* 情绪选择 */}
        <div style={{ marginTop: 'var(--space-8)' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--muted-100)', marginBottom: 8 }}>
            情绪
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {moodOptions.map((m) => (
              <button
                key={m.key}
                className={`tag ${emotion === m.key ? 'active' : ''}`}
                onClick={() => setEmotion(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 主题选择 */}
        <div style={{ marginTop: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--muted-100)', marginBottom: 8 }}>
            主题（可多选）
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {quickThemes.map((t) => (
              <button
                key={t}
                className={`tag ${themes.includes(t) ? 'active' : ''}`}
                onClick={() => toggleTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 公开度 */}
        <div style={{ marginTop: 'var(--space-8)' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--muted-100)', marginBottom: 8 }}>
            公开度
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={!isPublic}
                onChange={() => setIsPublic(false)}
              />
              <span style={{ fontSize: 'var(--text-body-md)' }}>仅自己</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
              />
              <span style={{ fontSize: 'var(--text-body-md)' }}>公开</span>
            </label>
          </div>
        </div>

        {/* 提交 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-10)' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!content.trim()}
            style={{ flex: 1 }}
          >
            存入星海
          </button>
          <button className="btn" onClick={onClose}>
            取消
          </button>
        </div>

        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--muted-100)', marginTop: 8, textAlign: 'center' }}>
          已有 {dreams.length} 条梦境在星海中
        </p>
      </div>
    </div>
  );
}
