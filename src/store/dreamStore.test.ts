import { describe, it, expect, beforeEach } from 'vitest';
import { useDreamStore } from './dreamStore';

describe('dreamStore', () => {
  beforeEach(() => {
    // 重置 store（保留内置数据，清空选中和 DB 状态）
    useDreamStore.setState({
      selectedDream: null,
      dbStatus: 'idle',
    });
  });

  it('初始状态应有内置的梦境数据', () => {
    const { dreams } = useDreamStore.getState();
    expect(dreams.length).toBeGreaterThan(0);
    expect(dreams[0].id).toBeDefined();
    expect(dreams[0].content).toBeDefined();
  });

  it('addDream 应添加新梦境', () => {
    const before = useDreamStore.getState().dreams.length;
    useDreamStore.getState().addDream({
      content: '测试梦境内容',
      emotion: 'serene',
      themes: ['测试'],
      isPublic: false,
    });
    const after = useDreamStore.getState().dreams.length;
    expect(after).toBe(before + 1);
  });

  it('addDream 应自动生成 id 和 position', () => {
    useDreamStore.getState().addDream({
      content: '自动生成',
      emotion: 'joy',
      themes: [],
      isPublic: true,
    });
    const dream = useDreamStore.getState().dreams.at(-1)!;
    expect(dream.id).toMatch(/^d-/);
    expect(dream.position).toHaveLength(3);
    expect(dream.createdAt).toBeDefined();
  });

  it('removeDream 应删除指定梦境', () => {
    const { dreams } = useDreamStore.getState();
    const firstId = dreams[0].id;
    useDreamStore.getState().removeDream(firstId);
    const updated = useDreamStore.getState().dreams;
    expect(updated.find((d) => d.id === firstId)).toBeUndefined();
  });

  it('removeDream 删除选中的梦境应清空 selectedDream', () => {
    const { dreams } = useDreamStore.getState();
    const firstDream = dreams[0];
    useDreamStore.getState().selectDream(firstDream);
    useDreamStore.getState().removeDream(firstDream.id);
    expect(useDreamStore.getState().selectedDream).toBeNull();
  });

  it('selectDream 应设置选中梦境', () => {
    const { dreams } = useDreamStore.getState();
    useDreamStore.getState().selectDream(dreams[0]);
    expect(useDreamStore.getState().selectedDream).toEqual(dreams[0]);
  });

  it('selectDream(null) 应清空选中', () => {
    const { dreams } = useDreamStore.getState();
    useDreamStore.getState().selectDream(dreams[0]);
    useDreamStore.getState().selectDream(null);
    expect(useDreamStore.getState().selectedDream).toBeNull();
  });

  it('togglePublic 应切换公开状态', () => {
    const { dreams } = useDreamStore.getState();
    const firstId = dreams[0].id;
    const before = dreams[0].isPublic;
    useDreamStore.getState().togglePublic(firstId);
    const after = useDreamStore.getState().dreams.find((d) => d.id === firstId)!.isPublic;
    expect(after).toBe(!before);
  });

  it('updatePosition 应更新梦境位置', () => {
    const { dreams } = useDreamStore.getState();
    const firstId = dreams[0].id;
    const newPos: [number, number, number] = [42, 24, 7];
    useDreamStore.getState().updatePosition(firstId, newPos);
    const updated = useDreamStore.getState().dreams.find((d) => d.id === firstId)!;
    expect(updated.position).toEqual(newPos);
  });

  it('updateDream 应更新指定字段', () => {
    const { dreams } = useDreamStore.getState();
    const firstId = dreams[0].id;
    useDreamStore.getState().updateDream(firstId, {
      content: '编辑后的梦境',
      emotion: 'mystic',
    });
    const updated = useDreamStore.getState().dreams.find((d) => d.id === firstId)!;
    expect(updated.content).toBe('编辑后的梦境');
    expect(updated.emotion).toBe('mystic');
    // 未改字段应保持不变
    expect(updated.id).toBe(firstId);
  });

  it('updateDream 应同步更新 selectedDream', () => {
    const { dreams } = useDreamStore.getState();
    useDreamStore.getState().selectDream(dreams[0]);
    useDreamStore.getState().updateDream(dreams[0].id, { content: '选中更新' });
    expect(useDreamStore.getState().selectedDream?.content).toBe('选中更新');
  });

  it('每条内置梦境应有有效的 position', () => {
    const { dreams } = useDreamStore.getState();
    dreams.forEach((d) => {
      expect(d.position).toHaveLength(3);
      expect(typeof d.position[0]).toBe('number');
      expect(typeof d.position[1]).toBe('number');
      expect(typeof d.position[2]).toBe('number');
    });
  });
});
