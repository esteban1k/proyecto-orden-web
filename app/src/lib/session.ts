export const SESSION_STORAGE_KEY = "lc_web_session";
const SESSION_EVENT = "lc-session-change";

export type SessionPayload = {
  session_token: string;
  expires_at: string;
  device_id: string;
  user_id: string;
};

function isPrintableToken(value: unknown, min: number, max: number): value is string {
  return (
    typeof value === "string" &&
    value.length >= min &&
    value.length <= max &&
    /^[\x21-\x7E]+$/.test(value)
  );
}

export function parseSession(raw: unknown): SessionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (!isPrintableToken(record.session_token, 8, 4096)) return null;
  if (!isPrintableToken(record.expires_at, 4, 64)) return null;
  if (Number.isNaN(Date.parse(record.expires_at))) return null;
  if (!isPrintableToken(record.device_id, 1, 128)) return null;
  if (!isPrintableToken(record.user_id, 1, 128)) return null;
  return {
    session_token: record.session_token,
    expires_at: record.expires_at,
    device_id: record.device_id,
    user_id: record.user_id,
  };
}

export function isSessionValid(session: SessionPayload | null): boolean {
  const parsed = session ? parseSession(session) : null;
  if (!parsed) return false;
  return Date.parse(parsed.expires_at) > Date.now();
}

function emitSessionChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function readSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseSession(JSON.parse(raw) as unknown);
    if (!parsed || Date.parse(parsed.expires_at) <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function writeSession(session: SessionPayload): void {
  const parsed = parseSession(session);
  if (!parsed || Date.parse(parsed.expires_at) <= Date.now()) {
    throw new Error("invalid session");
  }
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
  emitSessionChange();
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
  emitSessionChange();
}

export function subscribeSession(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
