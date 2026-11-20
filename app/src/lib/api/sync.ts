import { ApiError, apiUrl } from "./client";
import type {
  PutSnapshotBody,
  PutSnapshotResponse,
  SnapshotResponse,
} from "../sync/types";

const ERROR_CODE = /^[a-z0-9_]{1,64}$/i;

function readErrorCode(data: unknown): string {
  if (!data || typeof data !== "object") return "generic";
  const record = data as Record<string, unknown>;
  if (typeof record.error === "string" && ERROR_CODE.test(record.error)) {
    return record.error;
  }
  if (record.status === "not_implemented") return "sync_not_ready";
  return "generic";
}

function mapSyncStatus(status: number, data: unknown): never {
  if (status === 501) throw new ApiError(501, "sync_not_ready");
  if (status === 401) throw new ApiError(401, "invalid_session");
  if (status === 409) throw new ApiError(409, "revision_conflict");
  if (status === 413) throw new ApiError(413, "payload_too_large");
  const code = readErrorCode(data);
  if (code === "sync_not_ready") throw new ApiError(status, "sync_not_ready");
  if (code === "invalid_envelope") throw new ApiError(status, "invalid_envelope");
  throw new ApiError(status, code);
}

async function syncFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new ApiError(0, "network");
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      if (!response.ok) throw new ApiError(response.status || 0, "generic");
      throw new ApiError(response.status || 0, "generic");
    }
  }

  if (response.status === 501) {
    mapSyncStatus(501, data);
  }

  if (
    data &&
    typeof data === "object" &&
    (data as { status?: string }).status === "not_implemented"
  ) {
    throw new ApiError(501, "sync_not_ready");
  }

  if (!response.ok) {
    mapSyncStatus(response.status, data);
  }

  return data as T;
}

export async function getSnapshot(sessionToken: string): Promise<SnapshotResponse> {
  return syncFetch<SnapshotResponse>("/v1/sync/snapshot", {
    headers: { Authorization: `Bearer ${sessionToken}` },
  });
}

export async function putSnapshot(
  sessionToken: string,
  body: PutSnapshotBody,
): Promise<PutSnapshotResponse> {
  return syncFetch<PutSnapshotResponse>("/v1/sync/snapshot", {
    method: "PUT",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify(body),
  });
}