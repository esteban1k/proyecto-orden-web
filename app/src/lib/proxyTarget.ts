const LOOPBACK = "http://127.0.0.1:8080";

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "metadata.google.internal" || host === "metadata.google.com") return true;
  if (host.startsWith("169.254.")) return true;
  return false;
}

/** Dev-only rewrite target. Rejects non-HTTP(S), credentials, and link-local metadata hosts. */
export function resolveApiProxyTarget(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return LOOPBACK;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return LOOPBACK;
  }
  if (url.username || url.password) return LOOPBACK;
  if (url.protocol !== "http:" && url.protocol !== "https:") return LOOPBACK;
  if (isBlockedHost(url.hostname)) return LOOPBACK;
  if (url.protocol === "http:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    return LOOPBACK;
  }
  return url.origin;
}
