const STORAGE_KEY = "lc_mcp_api_token_v1";

export type McpApiTokenRecord = {
  user_id: string;
  token: string;
  rotated_at: string;
};

function isToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 32 &&
    value.length <= 128 &&
    /^[\x21-\x7E]+$/.test(value)
  );
}

function parseRecord(raw: unknown): McpApiTokenRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.user_id !== "string" || !record.user_id) return null;
  if (!isToken(record.token)) return null;
  if (typeof record.rotated_at !== "string" || !record.rotated_at) return null;
  return {
    user_id: record.user_id,
    token: record.token,
    rotated_at: record.rotated_at,
  };
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }
  return `lc_${out}`;
}

export function maskToken(token: string): string {
  if (token.length <= 12) return "••••••••";
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}

function storage(): Storage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function readMcpApiToken(userId: string): McpApiTokenRecord | null {
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

export function getOrCreateMcpApiToken(userId: string): McpApiTokenRecord {
  const existing = readMcpApiToken(userId);
  if (existing) return existing;
  const created: McpApiTokenRecord = {
    user_id: userId,
    token: randomToken(),
    rotated_at: new Date().toISOString(),
  };
  storage()?.setItem(STORAGE_KEY, JSON.stringify(created));
  return created;
}

export function rotateMcpApiToken(userId: string): McpApiTokenRecord {
  const next: McpApiTokenRecord = {
    user_id: userId,
    token: randomToken(),
    rotated_at: new Date().toISOString(),
  };
  storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}