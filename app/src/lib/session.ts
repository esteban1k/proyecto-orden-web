const STORAGE_KEY = "lc_web_session";

export type SessionPayload = {
  session_token: string;
  expires_at: string;
  device_id: string;
  user_id: string;
};

export function readSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed.session_token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: SessionPayload): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSessionValid(session: SessionPayload | null): boolean {
  if (!session?.expires_at) return Boolean(session?.session_token);
  const expires = Date.parse(session.expires_at);
  if (Number.isNaN(expires)) return Boolean(session.session_token);
  return expires > Date.now();
}