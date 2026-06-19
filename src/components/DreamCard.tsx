import { useState, useEffect } from 'react';
import { useDreamStore } from '../store/dreamStore';
import { useUIStore } from '../store/uiStore';
import { useCameraStore } from '../store/cameraStore';
import { moodLabels, moodColors, moodOptions } from '../constants/moods';

export default function DreamCard() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selectedDream = useDreamStore((s) => s.selectedDream);
  const selectedSubDream = useDreamStore((s) => s.selectedSubDream);
  const subDreams = useDreamStore((s) => s.subDreams);
  const selectDream = useDreamStore((s) => s.selectDream);
  const selectSubDream = useDreamStore((s) => s.selectSubDream);
  const togglePublic = useDreamStore((s) => s.togglePublic);
  const removeDream = useDreamStore((s) => s.removeDream);
  const updateDream = useDreamStore((s) => s.updateDream);
  const setInputOpen = useUIStore((s) => s.setInputOpen);
  const isDreamCardOpen = useUIStore((s) => s.isDreamCardOpen);
  const setDreamCardOpen = useUIStore((s) => s.setDreamCardOpen);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editEmotion, setEditEmotion] = useState('');
  const [editThemes, setEditThemes] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const displayContent = selectedSubDream?.content ?? selectedDream?.content ?? '';
  const displayEmotion = selectedSubDream?.emotion ?? selectedDream?.emotion ?? '';

  if (!selectedDream || !isDreamCardOpen) return null;

  const moodColor = moodColors[displayEmotion] ?? 'var(--gold-500)';
  const moodLabel = moodLabels[displayEmotion] ?? displayEmotion;

  const handleShare = () => {
    const url = `${location.origin}${location.pathname}#dream=${selectedDream.id}`;
    navigator.clipboard.writeText(url)
      .then(() => setToastMsg('星轨已复制'))
      .catch(() => setToastMsg('复制失败，请重试'));
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const wm = document.createElement('canvas');
    wm.width = canvas.width; wm.height = canvas.height;
    const ctx = wm.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
    ctx.fillStyle = 'rgba(255,210,122,0.6)';
    ctx.font = '14px "LXGW WenKai","Kaiti SC",serif';
    ctx.fillText('梦海 Oneironaut', 12, wm.height - 20);
    const link = document.createElement('a');
    link.download = `梦海-${selectedDream.id}-${Date.now()}.png`;
    link.href = wm.toDataURL('image/png');
    link.click();
    setToastMsg('星辉已留影');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const startEdit = () => {
    setEditContent(selectedDream.content);
    setEditEmotion(selectedDream.emotion);
    setEditThemes([...selectedDream.themes]);
    setIsEditing(true);
  };

  const saveEdit = () => {
    updateDream(selectedDream.id, { content: editContent, emotion: editEmotion, themes: editThemes });
    setIsEditing(false);
  };

  return (
    <>
      <div data-ui
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          maxWidth: isMobile ? '100vw' : 540,
          margin: '0 auto',
          animation: 'dreamSlideUp 0.5s var(--ease-spring)',
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : 0,
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: isMobile ? 'var(--space-5) var(--space-5) var(--space-4)' : 'var(--space-8) var(--space-10) var(--space-6)',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            border: `1px solid ${moodColor}66`,
            borderBottom: 'none',
            boxShadow: `0 -8px 40px ${moodColor}22, inset 0 1px 0 ${moodColor}33`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 顶部情绪色发光条 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${moodColor}, ${moodColor}, ${moodColor}, transparent)`,
              boxShadow: `0 0 16px ${moodColor}`,
              animation: 'dreamBarShimmer 2s ease-in-out infinite',
            }}
          />

          {/* 关闭 + 子星回退 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body)',
              color: moodColor, fontWeight: 500,
              textShadow: `0 0 8px ${moodColor}66`,
            }}>
              {selectedSubDream ? `✦ 子星 · ${moodLabel}` : isEditing ? '重塑此梦' : '✦ 一枚星语'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {selectedSubDream && (
                <button onClick={() => selectSubDream(null)}
                  style={{
                    fontFamily: 'var(--font-dream)', fontSize: isMobile ? 14 : 12,
                    padding: isMobile ? '8px 18px' : '4px 14px', minHeight: isMobile ? 44 : undefined,
                    color: moodColor, background: `${moodColor}22`,
                    border: `1px solid ${moodColor}66`, borderRadius: 'var(--radius-full)',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >← 回核心</button>
              )}
              <button onClick={() => { setIsEditing(false); selectSubDream(null); setDreamCardOpen(false); }}
                style={{
                  fontSize: 20, lineHeight: 1, padding: isMobile ? '8px 14px' : '0 8px',
                  minWidth: isMobile ? 44 : undefined, minHeight: isMobile ? 44 : undefined,
                  background: 'none', border: 'none', color: 'var(--muted-200)', cursor: 'pointer',
                }}>×</button>
            </div>
          </div>

          {isEditing ? (
            <>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={500}
                style={{
                  width: '100%', minHeight: 120,
                  background: 'var(--alpha-white-04)',
                  border: '1px solid var(--alpha-white-12)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--fg-100)',
                  fontFamily: 'var(--font-dream)',
                  fontSize: 'var(--text-heading-3)',
                  padding: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {moodOptions.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setEditEmotion(m.key)}
                    className="tag"
                    style={{
                      background: editEmotion === m.key ? `${moodColors[m.key] ?? 'var(--gold-500)'}22` : 'var(--alpha-white-04)',
                      border: editEmotion === m.key ? `1px solid ${moodColors[m.key] ?? 'var(--gold-500)'}` : '1px solid var(--alpha-white-08)',
                      cursor: 'pointer', fontSize: 'var(--text-caption)', fontFamily: 'var(--font-dream)',
                    }}
                  >
                    <span className="mood-dot" style={{ background: moodColors[m.key] ?? 'var(--gold-500)' }} />
                    {' '}{m.label}
                  </button>
                ))}
              </div>
              <input
                value={editThemes.join(', ')}
                onChange={(e) => setEditThemes(e.target.value.split(/[,，]\s*/).filter(Boolean))}
                placeholder="主题（逗号分隔）"
                style={{
                  width: '100%', marginTop: 12, padding: '8px 12px',
                  background: 'var(--alpha-white-04)', border: '1px solid var(--alpha-white-12)',
                  borderRadius: 'var(--radius-md)', color: 'var(--fg-100)',
                  fontFamily: 'var(--font-ui)', fontSize: 'var(--text-body-sm)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary" onClick={saveEdit} style={{ fontFamily: 'var(--font-dream)' }}>存梦</button>
                <button className="btn" onClick={() => setIsEditing(false)} style={{ fontFamily: 'var(--font-dream)' }}>舍弃</button>
              </div>
            </>
          ) : (
            <>
              <p
                className="dream-text"
                style={{ fontSize: 'var(--text-heading-3)', marginBottom: 'var(--space-6)', lineHeight: 1.8 }}
              >
                {displayContent}
              </p>
              <div
                style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 'var(--space-6)',
                  fontSize: 'var(--text-caption)', color: 'var(--muted-100)', fontFamily: 'var(--font-dream)',
                }}
              >
                <span className="tag">
                  <span className="mood-dot" style={{ background: moodColor }} />{' '}{moodLabel}
                </span>
                {selectedDream.themes.map((t) => <span key={t} className="tag">{t}</span>)}
                <span className="tag">{selectedDream.isPublic ? '众星可见' : '仅我凝望'}</span>
                <span className="tag" style={{
                  color: moodColor, borderColor: `${moodColor}66`,
                  background: `${moodColor}11`, fontWeight: 500,
                }}>伴星 · {selectedDream.subCount ?? 0}</span>
              </div>

              {/* 子星列表 — 醒目分区 */}
              {!selectedSubDream && (() => {
                const subs = subDreams.get(selectedDream.id) ?? [];
                if (subs.length === 0) return null;
                return (
                  <div style={{
                    marginBottom: 'var(--space-6)',
                    borderTop: `1px solid ${moodColor}44`,
                    borderBottom: `1px solid ${moodColor}22`,
                    padding: 'var(--space-4) 0',
                  }}>
                    <div style={{
                      fontSize: 'var(--text-body-sm)', color: moodColor, marginBottom: 10,
                      fontFamily: 'var(--font-dream)', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                        background: moodColor, boxShadow: `0 0 8px ${moodColor}`,
                      }} />
                      ✦ 萦绕的微光 · {subs.length} 颗
                    </div>
                    <div style={{ maxHeight: isMobile ? '30vh' : 180, overflowY: 'auto', paddingRight: 4 }}>
                      {subs.map((sub) => {
                        const sc = moodColors[sub.emotion] ?? 'var(--gold-500)';
                        const sl = moodLabels[sub.emotion] ?? sub.emotion;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => selectSubDream(sub)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              width: '100%', padding: '8px 10px', marginBottom: 5,
                              background: 'var(--alpha-white-06)',
                              border: `1px solid ${sc}33`,
                              borderRadius: 'var(--radius-md)', cursor: 'pointer',
                              fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-sm)',
                              color: 'var(--fg-100)', textAlign: 'left',
                              transition: 'all 0.2s',
                              animation: `staggerIn 0.35s ease-out both`,
                              animationDelay: `${0.02 + (subs.indexOf(sub) * 0.015)}s`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${sc}22`;
                              e.currentTarget.style.borderColor = sc;
                              e.currentTarget.style.transform = 'translateX(4px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'var(--alpha-white-06)';
                              e.currentTarget.style.borderColor = `${sc}33`;
                              e.currentTarget.style.transform = 'translateX(0)';
                            }}
                          >
                            <span className="mood-dot" style={{
                              background: sc, flexShrink: 0, marginTop: 4,
                              boxShadow: `0 0 4px ${sc}`,
                            }} />
                            <div>
                              <div style={{ lineHeight: 1.5 }}>{sub.content}</div>
                              <div style={{ fontSize: 'var(--text-caption)', color: sc, marginTop: 2 }}>{sl}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: `1px solid var(--alpha-white-08)`, paddingTop: 'var(--space-4)' }}>
                {[ { text:'分享星轨', onClick:handleShare },
                   { text:'留影', onClick:handleScreenshot },
                   { text:'⭐ 珍藏', onClick:() => {
                     const favs = JSON.parse(localStorage.getItem('dreamsea-favs') || '[]');
                     const i = favs.indexOf(selectedDream.id);
                     i === -1 ? favs.push(selectedDream.id) : favs.splice(i,1);
                     localStorage.setItem('dreamsea-favs', JSON.stringify(favs));
                     setToastMsg(i === -1 ? '已珍藏' : '已取消');
                     setTimeout(() => setToastMsg(''), 2000);
                   }},
                   { text:'重塑此梦', onClick:startEdit },
                   { text:selectedDream.isPublic ? '藏入私海' : '纳入众星', onClick:() => togglePublic(selectedDream.id) },
                ].map((btn, i) => (
                  <button key={btn.text} onClick={btn.onClick} style={{
                    fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-sm)',
                    color: 'var(--fg-100)', background: 'var(--alpha-white-10)',
                    border: '1px solid var(--alpha-white-20)', borderRadius: 'var(--radius-md)',
                    padding: '6px 16px', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    animation: `staggerIn 0.3s ease-out ${0.05 + i * 0.04}s both`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--alpha-white-20)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--alpha-white-10)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >{btn.text}</button>
                ))}
                <button onClick={() => {
                  const cs = useCameraStore.getState();
                  cs.setOrbitTarget(cs.orbitTarget ? null : selectedDream.position);
                }} style={{
                  fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-sm)',
                  color: 'var(--fg-100)', background: 'var(--alpha-white-10)',
                  border: '1px solid var(--alpha-white-20)', borderRadius: 'var(--radius-md)',
                  padding: '6px 16px', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--alpha-white-20)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--alpha-white-10)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >环绕此梦</button>
                <button onClick={() => { setDreamCardOpen(false); setInputOpen(true); }} style={{
                  fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-sm)',
                  color: moodColor, background: `${moodColor}15`,
                  border: `1px solid ${moodColor}44`, borderRadius: 'var(--radius-md)',
                  padding: '6px 16px', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  animation: 'starPulse 2s ease-in-out infinite',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${moodColor}33`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${moodColor}15`; e.currentTarget.style.transform = 'translateY(0)'; }}
                >缀新星</button>
                <button onClick={() => { removeDream(selectedDream.id); selectDream(null); }} style={{
                  fontFamily: 'var(--font-dream)', fontSize: 'var(--text-caption)',
                  color: 'var(--muted-200)', background: 'transparent',
                  border: 'none', padding: '6px 12px', cursor: 'pointer', opacity: 0.5,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                >湮灭</button>
              </div>
            </>
          )}
        </div>
      </div>

      {toastMsg && (
        <div
          style={{
            position: 'fixed', bottom: `calc(120px + env(safe-area-inset-bottom, 0px))`, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
            background: 'var(--alpha-gold-40)', color: 'var(--fg-100)',
            padding: '6px 20px', borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-dream)', fontSize: 'var(--text-body-sm)',
            animation: 'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* 注入全局动效 */}
      {typeof document !== 'undefined' && !(document as any).__dreamCardStyleInjected && (
        (() => { (document as any).__dreamCardStyleInjected = true;
          const s = document.createElement('style');
          s.textContent = `
            @keyframes dreamSlideUp { from { transform: translateX(-50%) translateY(100%); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }
            @keyframes dreamBarShimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
            @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
            @keyframes bounceIn { 0% { opacity:0; transform:translateX(-50%) scale(0.8); } 50% { transform:translateX(-50%) scale(1.05); } 100% { opacity:1; transform:translateX(-50%) scale(1); } }
            @keyframes starPulse { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.15); } }
            @keyframes gentleGlow { 0%,100% { text-shadow:0 0 4px currentColor; } 50% { text-shadow:0 0 16px currentColor, 0 0 32px currentColor; } }
            @keyframes rippleOut { from { box-shadow:0 0 0 0 currentColor; } to { box-shadow:0 0 0 8px transparent; } }
            @keyframes staggerIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
          `;
          document.head.appendChild(s);
        })()
      )}
    </>
  );
}
