export const moodLabels: Record<string, string> = {
  serene: '平静', joy: '喜悦', fear: '恐惧', anger: '愤怒',
  sorrow: '悲伤', mystic: '神秘', anxious: '焦虑', nostalgic: '怀旧',
};

export const moodColors: Record<string, string> = {
  serene: 'var(--mood-serene)', joy: 'var(--mood-joy)',
  fear: 'var(--mood-fear)', anger: 'var(--mood-anger)',
  sorrow: 'var(--mood-sorrow)', mystic: 'var(--mood-mystic)',
  anxious: 'var(--mood-anxious)', nostalgic: 'var(--mood-nostalgic)',
};

export const moodOptions = [
  { key: 'serene', label: '平静' }, { key: 'joy', label: '喜悦' },
  { key: 'fear', label: '恐惧' }, { key: 'anger', label: '愤怒' },
  { key: 'sorrow', label: '悲伤' }, { key: 'mystic', label: '神秘' },
  { key: 'anxious', label: '焦虑' }, { key: 'nostalgic', label: '怀旧' },
];
