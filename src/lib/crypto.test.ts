import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateKey,
  getOrCreateKey,
  encrypt,
  decrypt,
  exportKey,
  importKey,
  isCryptoAvailable,
} from './crypto';

// Node.js 环境中 mock localStorage
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => { store.clear(); },
  get length() { return store.size; },
  key: (i: number) => [...store.keys()][i] ?? null,
});

describe('crypto', () => {
  beforeEach(() => {
    store.clear();
  });

  it('isCryptoAvailable 应返回 true (Node.js 18+)', () => {
    expect(isCryptoAvailable()).toBe(true);
  });

  it('generateKey 应生成一个 CryptoKey', async () => {
    const key = await generateKey();
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm).toBeDefined();
  });

  it('generateKey 应将密钥持久化到 localStorage', async () => {
    await generateKey();
    const stored = localStorage.getItem('oneironaut-e2e-keys');
    expect(stored).toBeTruthy();
    expect(stored!.length).toBeGreaterThan(0);
  });

  it('getOrCreateKey 首次调用应生成新密钥', async () => {
    const key = await getOrCreateKey();
    expect(key).toBeDefined();
    const stored = localStorage.getItem('oneironaut-e2e-keys');
    expect(stored).toBeTruthy();
  });

  it('getOrCreateKey 第二次调用应返回相同密钥', async () => {
    const key1 = await getOrCreateKey();
    const key2 = await getOrCreateKey();
    // 相同的原始密钥应产生相同的导出值
    const raw1 = await crypto.subtle.exportKey('raw', key1);
    const raw2 = await crypto.subtle.exportKey('raw', key2);
    expect(Buffer.from(raw1).toString('base64')).toBe(
      Buffer.from(raw2).toString('base64'),
    );
  });

  it('encrypt + decrypt 应正确往返', async () => {
    const key = await generateKey();
    const plaintext = '我梦见了星空中的鲸鱼。它们在发光。';

    const { ciphertext, iv } = await encrypt(plaintext, key);
    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();
    expect(ciphertext).not.toBe(plaintext);

    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypt 无参数应使用默认密钥', async () => {
    const { ciphertext, iv } = await encrypt('测试文本');
    expect(ciphertext).toBeTruthy();
    expect(iv).toBeTruthy();
  });

  it('不同明文加密结果应不同', async () => {
    const key = await generateKey();
    const r1 = await encrypt('梦境一', key);
    const r2 = await encrypt('梦境二', key);
    expect(r1.ciphertext).not.toBe(r2.ciphertext);
  });

  it('相同明文两次加密结果应不同 (IV 随机)', async () => {
    const key = await generateKey();
    const r1 = await encrypt('相同文本', key);
    const r2 = await encrypt('相同文本', key);
    expect(r1.ciphertext).not.toBe(r2.ciphertext);
  });

  it('exportKey + importKey 应正确往返', async () => {
    const key = await generateKey();
    const exported = await exportKey(key);
    expect(typeof exported).toBe('string');
    expect(exported.length).toBeGreaterThan(0);

    const imported = await importKey(exported);
    expect(imported).toBeDefined();
    expect(imported.type).toBe('secret');

    // 验证导入的密钥可以正常加解密
    const { ciphertext, iv } = await encrypt('用导入密钥加密', imported);
    const decrypted = await decrypt(ciphertext, iv, imported);
    expect(decrypted).toBe('用导入密钥加密');
  });

  it('错误 IV 解密应失败', async () => {
    const key = await generateKey();
    const { ciphertext } = await encrypt('敏感数据', key);

    const wrongIV = btoa(String.fromCharCode(...new Uint8Array(12).fill(0)));
    await expect(decrypt(ciphertext, wrongIV, key)).rejects.toThrow();
  });

  it('应支持中文梦境内容加密', async () => {
    const key = await generateKey();
    const dream = '在一片倒悬的紫色海洋里，所有的鱼都在发光，它们穿过我的身体，每一道光都是一段记忆。';
    const { ciphertext, iv } = await encrypt(dream, key);
    const decrypted = await decrypt(ciphertext, iv, key);
    expect(decrypted).toBe(dream);
  });
});
