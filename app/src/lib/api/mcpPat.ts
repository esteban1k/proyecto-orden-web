import { ApiError, apiFetch } from "./client";

export type McpPatResponse = {
  token: string;
  token_prefix?: string;
  rotated_at: string;
};

/** Server-persisted MCP PAT when API exposes it (wave 2 contract). */
export async function fetchMcpPat(
  sessionToken: string,
): Promise<McpPatResponse | null> {
  try {
    return await apiFetch<McpPatResponse>("/v1/account/mcp-token", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
      return null;
    }
    throw err;
  }
}

export async function rotateMcpPat(
  sessionToken: string,
): Promise<McpPatResponse> {
  return apiFetch<McpPatResponse>("/v1/account/mcp-token/rotate", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: "{}",
  });
}