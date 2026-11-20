const GOOGLE_OAUTH_HOST = "accounts.google.com";

function parseHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.username || url.password) return null;
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

export function isAllowedGoogleRedirect(raw: string): boolean {
  const url = parseHttpUrl(raw);
  if (!url || url.protocol !== "https:") return false;
  if (url.hostname !== GOOGLE_OAUTH_HOST) return false;
  return url.pathname.startsWith("/o/oauth2/");
}
