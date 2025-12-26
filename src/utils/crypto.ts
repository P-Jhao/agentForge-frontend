/**
 * 前端加密工具
 * 使用 RSA 公钥加密敏感数据
 */
import { http } from './http';

// 缓存公钥
let cachedPublicKey: string | null = null;

/**
 * 获取 RSA 公钥（从服务端动态获取）
 */
export async function getPublicKey(): Promise<string> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  const res = await http.get<{ publicKey: string }>('/crypto/public-key');
  if (res.code !== 200 || !res.data?.publicKey) {
    throw new Error('获取公钥失败');
  }

  cachedPublicKey = res.data.publicKey;
  return cachedPublicKey;
}

/**
 * 清除缓存的公钥（用于刷新）
 */
export function clearPublicKeyCache(): void {
  cachedPublicKey = null;
}

/**
 * 将 PEM 格式公钥转换为 CryptoKey
 */
async function importPublicKey(pem: string): Promise<CryptoKey> {
  // 移除 PEM 头尾和换行
  const pemContents = pem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');

  // Base64 解码
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 导入公钥
  return await crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );
}

/**
 * RSA 加密数据
 * @param plainText 明文
 * @returns Base64 编码的加密数据
 */
export async function rsaEncrypt(plainText: string): Promise<string> {
  // 获取公钥
  const publicKeyPem = await getPublicKey();
  const publicKey = await importPublicKey(publicKeyPem);

  // 将明文转换为 ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // 加密
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    data
  );

  // 转换为 Base64
  const bytes = new Uint8Array(encrypted);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * 加密 API Key（带错误处理）
 * @param apiKey 明文 API Key
 * @returns 加密后的 API Key，失败时抛出错误
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  try {
    return await rsaEncrypt(apiKey);
  } catch (error) {
    console.error('[crypto] 加密 API Key 失败:', error);
    // 清除缓存的公钥，下次重新获取
    clearPublicKeyCache();
    throw new Error('加密失败，请刷新页面重试');
  }
}
