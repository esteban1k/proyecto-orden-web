const STORAGE_KEY = "lc_sync_e2e_key_v1";
export const WEB_SYNC_KEY_ID = "web-v1";

export type SyncKeyRecord = {
  user_id: string;
  key_id: string;
  key_b64: string;
};

function storage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

function parseRecord(raw: unknown): SyncKeyRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.user_id !== "string" || !record.user_id) return null;
  if (typeof record.key_id !== "string" || !record.key_id) return null;
  if (typeof record.key_b64 !== "string" || record.key_b64.length < 16) return null;
  return {
    user_id: record.user_id,
    key_id: record.key_id,
    key_b64: record.key_b64,
  };
}

export function readSyncKey(userId: string): SyncKeyRecord | null {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseRecord(JSON.parse(raw) as unknown);
    if (!parsed || parsed.user_id !== userId) return null;
    return parsed;
  } catch {
    ls.removeItem(STORAGE_KEY);
    return null;
  }
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function getOrCreateSyncKey(userId: string): SyncKeyRecord {
  const existing = readSyncKey(userId);
  if (existing) return existing;
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const created: SyncKeyRecord = {
    user_id: userId,
    key_id: WEB_SYNC_KEY_ID,
    key_b64: bytesToB64(keyBytes),
  };
  storage()?.setItem(STORAGE_KEY, JSON.stringify(created));
  return created;
}

export function syncKeyBytes(record: SyncKeyRecord): Uint8Array {
  const bin = atob(record.key_b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}