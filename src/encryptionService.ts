import { type CopilotSettings } from "@/settings/model";
import { Buffer } from "buffer";
import { Platform } from "obsidian";

// @ts-ignore
let safeStorageInternal: any = null;
// 添加一个存储设置的变量
let pluginSettings: CopilotSettings | null = null;

try {
  // 修复electron remote API访问
  const electron = require("electron");
  if (electron?.app?.isReady()) {
    safeStorageInternal = electron.safeStorage;
  } else {
    // 尝试使用正确的方式访问remote功能，移除直接访问remote属性
    try {
      const remote = require("@electron/remote");
      safeStorageInternal = remote?.safeStorage || null;
    } catch (e) {
      safeStorageInternal = null;
    }
  }
} catch (error) {
  // 在非electron环境中忽略错误
  console.log("Electron not available, encryption disabled");
}

function getSafeStorage(): any {
  if (!safeStorageInternal) {
    try {
      const electron = require("electron");
      safeStorageInternal = electron.safeStorage;
    } catch (error) {
      // 在非electron环境中返回null
      return null;
    }
  }
  return safeStorageInternal;
}

// Add new prefixes to distinguish encryption methods
const DESKTOP_PREFIX = "enc_desk_";
const WEBCRYPTO_PREFIX = "enc_web_";
// Keep old prefix for backward compatibility
const ENCRYPTION_PREFIX = "enc_";
const DECRYPTION_PREFIX = "dec_";

// Add these constants for the Web Crypto implementation
const ENCRYPTION_KEY = new TextEncoder().encode("obsidian-copilot-v1");
const ALGORITHM = { name: "AES-GCM", iv: new Uint8Array(12) };

async function getEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey("raw", ENCRYPTION_KEY, ALGORITHM.name, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptAllKeys(
  settings: Readonly<CopilotSettings>
): Promise<Readonly<CopilotSettings>> {
  if (!settings.enableEncryption) {
    return settings;
  }
  const newSettings = { ...settings };
  const keysToEncrypt = Object.keys(settings).filter(
    (key) => key.toLowerCase().includes("apikey") || key === "plusLicenseKey"
  );

  for (const key of keysToEncrypt) {
    const apiKey = settings[key as keyof CopilotSettings] as string;
    (newSettings[key as keyof CopilotSettings] as any) = await getEncryptedKey(apiKey);
  }

  if (Array.isArray(settings.activeModels)) {
    newSettings.activeModels = await Promise.all(
      settings.activeModels.map(async (model) => ({
        ...model,
        apiKey: await getEncryptedKey(model.apiKey || ""),
      }))
    );
  }

  if (Array.isArray(settings.activeEmbeddingModels)) {
    newSettings.activeEmbeddingModels = await Promise.all(
      settings.activeEmbeddingModels.map(async (model) => ({
        ...model,
        apiKey: await getEncryptedKey(model.apiKey || ""),
      }))
    );
  }

  return newSettings;
}

export async function getEncryptedKey(apiKey: string): Promise<string> {
  if (!apiKey || apiKey.startsWith(ENCRYPTION_PREFIX)) {
    return apiKey;
  }

  if (isDecrypted(apiKey)) {
    apiKey = apiKey.replace(DECRYPTION_PREFIX, "");
  }

  try {
    // Try desktop encryption first
    if (getSafeStorage()?.isEncryptionAvailable()) {
      const encryptedBuffer = getSafeStorage().encryptString(apiKey) as Buffer;
      return DESKTOP_PREFIX + encryptedBuffer.toString("base64");
    }

    // Fallback to Web Crypto API
    const key = await getEncryptionKey();
    const encodedData = new TextEncoder().encode(apiKey);
    const encryptedData = await crypto.subtle.encrypt(ALGORITHM, key, encodedData);
    return WEBCRYPTO_PREFIX + arrayBufferToBase64(encryptedData);
  } catch (error) {
    console.error("Encryption failed:", error);
    return apiKey;
  }
}

export async function getDecryptedKey(apiKey: string): Promise<string> {
  if (!apiKey || isPlainText(apiKey)) {
    return apiKey;
  }
  if (isDecrypted(apiKey)) {
    return apiKey.replace(DECRYPTION_PREFIX, "");
  }

  // Handle different encryption methods
  if (apiKey.startsWith(DESKTOP_PREFIX)) {
    const base64Data = apiKey.replace(DESKTOP_PREFIX, "");
    const buffer = Buffer.from(base64Data, "base64");
    return getSafeStorage().decryptString(buffer) as string;
  }

  if (apiKey.startsWith(WEBCRYPTO_PREFIX)) {
    const base64Data = apiKey.replace(WEBCRYPTO_PREFIX, "");
    const key = await getEncryptionKey();
    const encryptedData = base64ToArrayBuffer(base64Data);
    const decryptedData = await crypto.subtle.decrypt(ALGORITHM, key, encryptedData);
    return new TextDecoder().decode(decryptedData);
  }

  // Legacy support for old enc_ prefix
  const base64Data = apiKey.replace(ENCRYPTION_PREFIX, "");
  try {
    // Try desktop decryption first
    if (getSafeStorage()?.isEncryptionAvailable()) {
      try {
        const buffer = Buffer.from(base64Data, "base64");
        return getSafeStorage().decryptString(buffer) as string;
      } catch {
        // Silent catch is intentional - if desktop decryption fails,
        // it means this key was likely encrypted with Web Crypto.
        // We'll fall through to the Web Crypto decryption below.
      }
    }

    // Fallback to Web Crypto API
    const key = await getEncryptionKey();
    const encryptedData = base64ToArrayBuffer(base64Data);
    const decryptedData = await crypto.subtle.decrypt(ALGORITHM, key, encryptedData);
    return new TextDecoder().decode(decryptedData);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "Copilot failed to decrypt API keys!";
  }
}

function isPlainText(key: string): boolean {
  return (
    !key.startsWith(ENCRYPTION_PREFIX) &&
    !key.startsWith(DECRYPTION_PREFIX) &&
    !key.startsWith(DESKTOP_PREFIX) &&
    !key.startsWith(WEBCRYPTO_PREFIX)
  );
}

function isDecrypted(keyBuffer: string): boolean {
  return keyBuffer.startsWith(DECRYPTION_PREFIX);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 添加getSettings函数
function getSettings(): CopilotSettings {
  if (!pluginSettings) {
    // 如果没有设置，返回默认值
    return { enableEncryption: false } as CopilotSettings;
  }
  return pluginSettings;
}

// 添加设置设置的函数
export function setSettings(settings: CopilotSettings): void {
  pluginSettings = settings;
}

export async function encryptString(apiKey: string): Promise<string> {
  if (!getSettings().enableEncryption) {
    return apiKey;
  }

  try {
    const safeStorage = getSafeStorage();
    if (!safeStorage) {
      console.warn("SafeStorage not available, returning unencrypted string");
      return apiKey;
    }

    if (safeStorage.isEncryptionAvailable()) {
      const encryptedBuffer = safeStorage.encryptString(apiKey) as Buffer;
      return encryptedBuffer.toString("base64");
    } else {
      // Fallback to Web Crypto API
      const key = await getEncryptionKey();
      const encodedData = new TextEncoder().encode(apiKey);
      const encryptedData = await crypto.subtle.encrypt(ALGORITHM, key, encodedData);
      return WEBCRYPTO_PREFIX + arrayBufferToBase64(encryptedData);
    }
  } catch (error) {
    console.error("Encryption failed:", error);
    return apiKey;
  }
}

export async function decryptString(encryptedApiKey: string): Promise<string> {
  if (!encryptedApiKey) {
    return encryptedApiKey;
  }

  try {
    const safeStorage = getSafeStorage();
    if (!safeStorage) {
      console.warn("SafeStorage not available, returning encrypted string as-is");
      return encryptedApiKey;
    }

    const buffer = Buffer.from(encryptedApiKey, "base64");
    return safeStorage.decryptString(buffer) as string;
  } catch (error) {
    console.error("Decryption failed:", error);

    try {
      const safeStorage = getSafeStorage();
      if (safeStorage) {
        const buffer = Buffer.from(encryptedApiKey, "hex");
        return safeStorage.decryptString(buffer) as string;
      }
      return encryptedApiKey;
    } catch (fallbackError) {
      console.error("Fallback decryption also failed:", fallbackError);
      return "Copilot failed to decrypt API keys!";
    }
  }
}
