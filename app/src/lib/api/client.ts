export type ApiErrorBody = {
  error: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const ERROR_CODE = /^[a-z0-9_]{1,64}$/i;

export function apiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return base.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl()}${normalized}`;
}

function readErrorCode(data: unknown): string {
  if (!data || typeof data !== "object" || !("error" in data)) return "generic";
  const code = (data as { error: unknown }).error;
  if (typeof code === "string" && ERROR_CODE.test(code)) return code;
  return "generic";
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
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
      throw new ApiError(response.status || 0, "generic");
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, readErrorCode(data));
  }

  return data as T;
}
