/** T-022: 端到端加密 — Web Crypto API */

const ALGORITHM = { name: 'AES-GCM', length: 256 };
const KEY_STORE = 'oneironaut-e2e-keys';

/** 生成 AES-GCM 密钥，存入 IndexedDB */
export async function generateKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(ALGORITHM, true, ['encrypt', 'decrypt']);
  const raw = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem(KEY_STORE, btoa(String.fromCharCode(...new Uint8Array(raw))));
  return key;
}

/** 加载已存储的密钥 */
async function loadKey(): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(KEY_STORE);
  if (!stored) return null;
  try {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return crypto.subtle.importKey('raw', raw, ALGORITHM, true, ['encrypt', 'decrypt']);
  } catch {
    localStorage.removeItem(KEY_STORE);
    return null;
  }
}

/** 获取或创建密钥 */
export async function getOrCreateKey(): Promise<CryptoKey> {
  const existing = await loadKey();
  return existing ?? generateKey();
}

/** 加密文本 */
export async function encrypt(text: string, key?: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const k = key ?? (await getOrCreateKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, encoded);
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/** 解密文本 */
export async function decrypt(
  ciphertext: string,
  iv: string,
  key?: CryptoKey,
): Promise<string> {
  const k = key ?? (await getOrCreateKey());
  const encrypted = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const ivArr = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivArr }, k, encrypted);
  return new TextDecoder().decode(decrypted);
}

/** 导出密钥供分享（用于接收方解密） */
export async function exportKey(key?: CryptoKey): Promise<string> {
  const k = key ?? (await getOrCreateKey());
  const raw = await crypto.subtle.exportKey('raw', k);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/** 导入分享的密钥 */
export async function importKey(keyBase64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, ALGORITHM, false, ['encrypt', 'decrypt']);
}

/** 检查加密是否可用 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle;
}
