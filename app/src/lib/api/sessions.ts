import { apiFetch } from "./client";

export type ActiveSessionRow = {
  session_id: string;
  device_id?: string;
  device_label?: string;
  created_at: string;
  expires_at: string;
  last_seen_at: string;
};

export type SessionsListResponse = {
  sessions: ActiveSessionRow[];
  cap: number;
};

export async function listSessions(
  sessionToken: string,
): Promise<SessionsListResponse> {
  return apiFetch<SessionsListResponse>("/v1/auth/sessions", {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function revokeSession(
  sessionToken: string,
  sessionId: string,
): Promise<void> {
  await apiFetch<{ status: string }>(
    `/v1/auth/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${sessionToken}` },
    },
  );
}