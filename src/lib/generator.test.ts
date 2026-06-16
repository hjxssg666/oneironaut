import { describe, it, expect } from 'vitest';
import { generateVoidDream, type GeneratedDream } from './generator';

describe('generateVoidDream', () => {
  it('应返回有效的梦境对象结构', () => {
    const dream = generateVoidDream();

    expect(dream).toBeDefined();
    expect(typeof dream.content).toBe('string');
    expect(dream.content.length).toBeGreaterThan(0);
    expect(typeof dream.emotion).toBe('string');
    expect(Array.isArray(dream.themes)).toBe(true);
    expect(typeof dream.timestamp).toBe('number');
  });

  it('应生成 3-5 句主体 + 1 句情绪结语的梦境', () => {
    const dream = generateVoidDream();
    // 中文句号分隔
    const sentences = dream.content.split('。').filter((s) => s.trim().length > 0);

    // 3~5 句主体 + 1 句情绪结语 = 4~6 句
    expect(sentences.length).toBeGreaterThanOrEqual(4);
    expect(sentences.length).toBeLessThanOrEqual(6);
  });

  it('情绪值应在合法范围内', () => {
    const validEmotions = [
      'serene', 'joy', 'fear', 'anger', 'sorrow', 'mystic', 'anxious', 'nostalgic',
    ];
    const dream = generateVoidDream();
    expect(validEmotions).toContain(dream.emotion);
  });

  it('主题数量应为 2-3 个', () => {
    const dream = generateVoidDream();
    expect(dream.themes.length).toBeGreaterThanOrEqual(2);
    expect(dream.themes.length).toBeLessThanOrEqual(3);
  });

  it('每次生成应产生不同的内容', () => {
    const dreams = Array.from({ length: 10 }, () => generateVoidDream());
    const contents = new Set(dreams.map((d) => d.content));
    // 10 次生成至少应有 5 种不同结果（允许极少数碰撞）
    expect(contents.size).toBeGreaterThanOrEqual(5);
  });

  it('时间戳应接近当前时间', () => {
    const dream = generateVoidDream();
    const now = Date.now();
    expect(dream.timestamp).toBeLessThanOrEqual(now);
    expect(dream.timestamp).toBeGreaterThan(now - 1000); // 1 秒内
  });

  it('每条梦境内容应有合理长度', () => {
    const dream = generateVoidDream();
    // 至少 20 个中文字符
    expect(dream.content.length).toBeGreaterThan(20);
    expect(dream.content.length).toBeLessThan(500);
  });
});
