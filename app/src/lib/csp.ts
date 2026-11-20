function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "metadata.google.internal" || host.startsWith("169.254.");
}

function apiOrigin(apiBase: string): string | null {
  if (!apiBase.trim()) return null;
  try {
    const url = new URL(apiBase);
    if (url.username || url.password) return null;
    if (isBlockedHost(url.hostname)) return null;
    if (url.protocol === "https:") return url.origin;
    if (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      return url.origin;
    }
  } catch {
    return null;
  }
  return null;
}

/** Meta CSP for the static export. frame-ancestors is ignored in meta tags. */
export function appCsp(apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""): string {
  const connect = ["'self'", "http://localhost:8080", "http://127.0.0.1:8080"];
  const origin = apiOrigin(apiBase);
  if (origin) connect.push(origin);
  else connect.push("https:");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    `connect-src ${connect.join(" ")}`,
  ].join("; ");
}
